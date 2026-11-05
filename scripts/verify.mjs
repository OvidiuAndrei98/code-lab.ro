import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";

await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
  acceptDownloads: true,
});
await context.addInitScript(() => {
  if (window.top !== window || !/^https?:$/.test(location.protocol)) return;
  addEventListener("pageswap", (event) =>
    sessionStorage.setItem("sheet-swap", String(!!event.viewTransition)),
  );
  addEventListener("pagereveal", (event) =>
    sessionStorage.setItem("sheet-reveal", String(!!event.viewTransition)),
  );
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const base = process.env.SITE_URL || "http://127.0.0.1:3000";
const audits = [];
async function audit(state) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  const violations = result.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.map((n) => ({
      target: n.target,
      summary: n.failureSummary,
    })),
  }));
  audits.push({ state, violations });
  console.log("AUDIT", state, violations.length, "violations");
}
const routes = [
  "/",
  "/proiecte",
  "/servicii",
  "/servicii/website-uri",
  "/servicii/magazin-online",
  "/servicii/aplicatii-web",
  "/studio",
  "/contact",
  "/proiecte/fason",
  "/proiecte/carnet-demo",
];
try {
  for (const [legacy, destination] of [
    ["/work", "/proiecte"],
    ["/work/fason", "/proiecte/fason"],
  ]) {
    const response = await fetch(base + legacy, { redirect: "manual" });
    assert.equal(response.status, 308, `${legacy} should redirect permanently`);
    assert.equal(response.headers.get("location"), destination);
    await page.goto(base + legacy, { waitUntil: "networkidle" });
    assert.equal(new URL(page.url()).pathname, destination);
  }
  console.log("PASS legacy work URLs redirect to the Romanian project routes");
  for (const route of routes) {
    await page.goto(base + route, { waitUntil: "networkidle" });
    for (const width of [320, 390, 520, 700, 701, 800, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      assert.ok(
        overflow <= 1,
        "Horizontal overflow: " + route + " at " + width + "px: " + overflow,
      );
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await audit(route);
  }
  console.log(`PASS all ${routes.length} routes at widths 320–1920px`);

  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const projectPreview = page
    .locator(".showcase-project .showcase-media")
    .first();
  await projectPreview.scrollIntoViewIfNeeded();
  const preview = page
    .frameLocator(".showcase-project .showcase-media iframe")
    .first();
  assert.ok(
    await page.evaluate(
      () =>
        document
          .querySelector(".showcase-project .work-display-top")
          .getBoundingClientRect().bottom <=
        document.querySelector(".showcase-media").getBoundingClientRect().top,
    ),
    "Project context should introduce the preview",
  );
  await preview.locator("#acasa img").evaluate((image) => image.decode());
  const previewState = await preview.locator("body").evaluate(() => ({
    width: innerWidth,
    height: innerHeight,
    inert: document.body.inert,
    effects: document.querySelectorAll("script,canvas").length,
    animations: document.getAnimations().length,
    activeLinks: document.querySelectorAll("a[href]").length,
    disabledButtons: [...document.querySelectorAll("button")].every(
      (button) => button.disabled,
    ),
  }));
  assert.deepEqual(previewState, {
    width: 1440,
    height: 960,
    inert: true,
    effects: 0,
    animations: 0,
    activeLinks: 0,
    disabledButtons: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  assert.equal(await preview.locator("body").evaluate(() => innerWidth), 1440);
  assert.ok(
    await page
      .locator(".showcase-project .showcase-media")
      .first()
      .evaluate((el) => el.clientHeight < 260),
  );
  await projectPreview.scrollIntoViewIfNeeded();
  const previewBox = await projectPreview.boundingBox();
  await page.mouse.click(
    previewBox.x + previewBox.width / 2,
    previewBox.y + previewBox.height * 0.8,
  );
  await page.waitForURL("**/proiecte/fason");
  await page.goBack({ waitUntil: "networkidle" });
  await page
    .getByRole("link", { name: "Toate proiectele", exact: true })
    .focus();
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() =>
      document.activeElement.classList.contains("home-work-media"),
    ),
    true,
  );
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() =>
      document.activeElement.classList.contains("showcase-link"),
    ),
    true,
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => scrollTo(0, 0));
  console.log(
    "PASS inert original HTML on phones, working outer project link and keyboard access without internal preview focus",
  );
  assert.equal(
    await page
      .getByRole("heading", { name: "CODELAB", exact: true, level: 1 })
      .count(),
    1,
  );
  assert.equal(
    await page
      .locator(
        ".interface-lab,.hero-chapter,.section-number,.ticker,.hero-mark,.contact-cta",
      )
      .count(),
    0,
  );
  const footerLayout = await page.locator("footer").evaluate((element) => {
    const mark = element
      .querySelector("[data-footer-mark]")
      .getBoundingClientRect();
    return {
      height: element.getBoundingClientRect().height,
      viewportHeight: innerHeight,
      markRatio: mark.width / mark.height,
      links: element.querySelectorAll('nav[aria-label="Navigare în footer"] a')
        .length,
    };
  });
  assert.ok(
    footerLayout.height < footerLayout.viewportHeight * 0.8,
    "Footer remains a bounded closing composition",
  );
  assert.ok(
    Math.abs(footerLayout.markRatio - 2.6) < 0.002,
    "Footer preserves the original signature proportions",
  );
  assert.equal(
    footerLayout.links,
    4,
    "Global footer exposes all four real navigation destinations",
  );
  await page.screenshot({
    path: "artifacts/identity-desktop.png",
    fullPage: true,
  });
  const button = page.locator(".menu-tab");
  const menu = page.getByRole("dialog", {
    name: "Meniu principal",
    exact: true,
  });
  assert.equal(await button.getAttribute("aria-label"), "Deschide meniul");
  await page.evaluate(() => scrollTo(0, 1000));
  const before = await page.evaluate(() => scrollY);
  await button.click();
  assert.equal(
    await page.evaluate(
      () => !!document.activeElement.closest("[data-menu-modal]"),
    ),
    true,
  );
  await audit("menu desktop");
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(
        () => !!document.activeElement.closest("[data-menu-modal]"),
      ),
      true,
    );
  }
  await page.keyboard.press("Escape");
  await menu.waitFor({ state: "hidden" });
  assert.equal(
    await button.evaluate((el) => el === document.activeElement),
    true,
  );
  assert.ok(Math.abs((await page.evaluate(() => scrollY)) - before) < 2);
  console.log("PASS modal focus trap, Escape, focus and scroll restoration");

  await page
    .getByRole("link", { name: "Descoperă proiectul FASON", exact: true })
    .click();
  await page.waitForURL("**/proiecte/fason");
  assert.match(await page.locator("h1").textContent(), /FASON/);
  await page
    .getByRole("navigation", { name: "Continuă explorarea" })
    .getByRole("link")
    .click();
  await page.waitForURL("**/proiecte/carnet-demo");
  assert.match(
    await page.locator(".case-heading").innerText(),
    /Concept demonstrativ/,
  );
  await page.goBack({ waitUntil: "networkidle" });
  assert.equal(new URL(page.url()).pathname, "/proiecte/fason");
  await page.goForward({ waitUntil: "networkidle" });
  assert.equal(new URL(page.url()).pathname, "/proiecte/carnet-demo");
  await page.goto(base + "/servicii#ecommerce", { waitUntil: "networkidle" });
  const anchorVisible = await page.locator("#ecommerce h2").evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= innerHeight;
  });
  assert.ok(anchorVisible, "Service deep link must show the requested heading");
  console.log("PASS real routes, Back/Forward and direct service anchors");

  await page.goto(base + "/contact", { waitUntil: "networkidle" });
  assert.equal(
    await page.locator("form").evaluate((form) => form.checkValidity()),
    false,
  );
  await page.getByLabel("Numele tău").fill("Alex Popescu");
  await page.getByLabel("Email", { exact: true }).fill("alex@example.com");
  await page.getByLabel("Aplicație web", { exact: true }).check();
  await page
    .getByLabel("Câteva cuvinte despre proiect")
    .fill("Un portal pentru clienții companiei noastre.");
  await page.getByRole("button", { name: "Pregătește brief-ul" }).click();
  const result = page.getByRole("heading", { name: "Brief-ul e pregătit." });
  await result.waitFor();
  assert.equal(
    await result.evaluate((el) => el === document.activeElement),
    true,
  );
  const pendingDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descarcă brief-ul" }).click();
  const download = await pendingDownload;
  const brief = await readFile(await download.path(), "utf8");
  assert.match(brief, /Alex Popescu/);
  assert.match(brief, /alex@example.com/);
  assert.match(brief, /Aplicație web/);
  console.log(
    "PASS form validation, focused result and generated brief content",
  );

  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of routes) {
    await page.goto(base + route, { waitUntil: "networkidle" });
    await audit(route + " mobile");
  }
  await page.goto(base, { waitUntil: "networkidle" });
  await page.screenshot({
    path: "artifacts/identity-mobile.png",
    fullPage: true,
  });
  await button.click();
  await page.screenshot({ path: "artifacts/identity-menu-mobile.png" });
  await menu.getByRole("link", { name: "Studio", exact: true }).click();
  await page.waitForURL("**/studio");
  assert.equal(
    await page.locator("html").evaluate((el) => el.classList.contains("lenis")),
    false,
  );
  await page.setViewportSize({ width: 320, height: 480 });
  await button.click();
  const close = menu.getByRole("button", { name: "Închide meniul" });
  assert.ok(
    await close.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return (
        r.top >= 0 &&
        r.bottom <= innerHeight &&
        r.left >= 0 &&
        r.right <= innerWidth
      );
    }),
  );
  await page.keyboard.press("Escape");
  console.log("PASS phone navigation and short viewport menu");

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("lenis"),
  );
  await page.mouse.wheel(0, 600);
  await page.waitForFunction(() => scrollY > 100);
  await page.waitForTimeout(700);
  const stretches = await page
    .locator(".identity-lockup .identity-stretch")
    .evaluateAll((elements) =>
      elements.map((el) => new DOMMatrix(getComputedStyle(el).transform).m22),
    );
  const hydraulic = await page.locator(".hydraulic-hero").count();
  if (hydraulic) {
    assert.ok(
      stretches.every((scale) => scale < 1 && scale >= 0.22),
      "The hydraulic press should compress the letters together",
    );
    assert.ok(
      Math.abs(
        await page
          .locator(".identity-section")
          .evaluate((el) => el.getBoundingClientRect().top),
      ) < 1,
      "The hero should stay pinned while the press operates",
    );
  } else {
    assert.ok(
      Math.max(...stretches) - Math.min(...stretches) > 0.05,
      "The original varied letter stretch follows the work sheet",
    );
    assert.ok(
      await page
        .locator(".identity-inertia")
        .evaluateAll((elements) =>
          elements.every(
            (el) => new DOMMatrix(getComputedStyle(el).transform).d === 1,
          ),
        ),
      "Letter stretch has no independent inertia timer",
    );
    const identity = await page.locator(".identity-scene").evaluate((el) => {
      const style = getComputedStyle(el);
      const transform = new DOMMatrix(style.transform);
      return { opacity: +style.opacity, scale: transform.a, y: transform.f };
    });
    assert.equal(identity.scale, 1);
    assert.equal(identity.y, 0);
    assert.ok(
      identity.opacity >= 0.719 && identity.opacity <= 1,
      "The identity keeps a subtle contrast falloff without shrinking or drifting",
    );
    const media = await page
      .locator(".home-work-media .project-media")
      .evaluate((el) => {
        const style = getComputedStyle(el);
        const transform = new DOMMatrix(style.transform);
        return {
          clip: style.clipPath,
          opacity: +style.opacity,
          scale: transform.a,
          y: transform.f,
        };
      });
    assert.equal(
      media.clip,
      "none",
      "The handoff never blanks the project with an independent mask",
    );
    assert.equal(media.opacity, 1);
    assert.equal(media.scale, 1);
    assert.ok(
      media.y >= 0 && media.y <= 16,
      "Only a small internal media offset follows the sheet",
    );
  }
  await page.evaluate(() => {
    window.menuProbe = { running: true, gaps: [] };
    const sample = () => {
      if (!window.menuProbe.running) return;
      const mechanism = document.querySelector(".menu-mechanism");
      if (mechanism.matches('[data-menu-modal][aria-modal="true"]'))
        window.menuProbe.gaps.push(
          Math.abs(
            document.querySelector(".side-menu").getBoundingClientRect().left -
              document.querySelector(".site-stage").getBoundingClientRect()
                .right,
          ),
        );
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await button.click();
  await page.waitForTimeout(50);
  assert.ok(
    await page
      .locator(".site-stage")
      .evaluate((el) => el.getBoundingClientRect().left < -15),
    "Menu movement should begin immediately",
  );
  assert.equal(
    await page
      .locator("html")
      .evaluate((el) => el.classList.contains("lenis-stopped")),
    true,
  );
  const geometry = await page
    .locator(".site-stage")
    .evaluate((el) => ({ width: el.offsetWidth, height: el.offsetHeight }));
  await page.waitForTimeout(600);
  const transform = await page
    .locator(".site-stage")
    .evaluate((el) => getComputedStyle(el).transform);
  assert.notEqual(transform, "none");
  assert.notEqual(transform, "matrix(1, 0, 0, 1, 0, 0)");
  await page.mouse.click(20, 180);
  await menu.waitFor({ state: "hidden" });
  await page.waitForFunction(
    () => !document.documentElement.classList.contains("lenis-stopped"),
  );
  assert.deepEqual(
    await page
      .locator(".site-stage")
      .evaluate((el) => ({ width: el.offsetWidth, height: el.offsetHeight })),
    geometry,
  );
  const seam = await page.evaluate(() => {
    window.menuProbe.running = false;
    return {
      count: window.menuProbe.gaps.length,
      gap: Math.max(...window.menuProbe.gaps),
    };
  });
  assert.ok(
    seam.count > 10 && seam.gap < 1,
    "Menu and page must share an attached edge during opening and closing",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(
    () => !document.documentElement.classList.contains("lenis"),
  );
  assert.equal(
    await page
      .locator(".identity-lockup .identity-stretch")
      .first()
      .evaluate((el) => getComputedStyle(el).transform),
    "none",
  );
  assert.equal(
    await page.locator(".identity-scene").evaluate((el) => el.style.opacity),
    "",
    "Reduced motion must restore the readable identity",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("lenis"),
  );
  console.log(
    "PASS prompt attached menu motion, outside-click dismissal and coherent Home handoff with reduced-motion cleanup",
  );
  await page
    .getByRole("navigation", { name: "Navigare principală", exact: true })
    .getByRole("link", { name: "Servicii", exact: true })
    .click();
  await page.waitForURL("**/servicii");
  await page.waitForFunction(
    () => sessionStorage.getItem("sheet-reveal") === "true",
  );
  assert.equal(
    await page.evaluate(() => sessionStorage.getItem("sheet-swap")),
    "true",
  );
  await page.waitForTimeout(900);
  assert.equal(
    await page.locator("main").evaluate((el) => getComputedStyle(el).transform),
    "none",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(
    () => !document.documentElement.classList.contains("lenis"),
  );
  assert.equal(await page.locator(".pin-spacer").count(), 0);
  console.log(
    "PASS smooth wheel, menu pause/resume, native page-sheet transition and reduced-motion cleanup",
  );

  await writeFile(
    "artifacts/verification.json",
    JSON.stringify({ audits, errors }, null, 2),
  );
  if (audits.some((a) => a.violations.length))
    console.log(
      JSON.stringify(
        audits.filter((a) => a.violations.length),
        null,
        2,
      ),
    );
  assert.ok(
    audits.every((a) => a.violations.length === 0),
    "Accessibility audit found violations",
  );
  assert.deepEqual(errors, []);
  console.log("PASS no uncaught JavaScript errors or accessibility violations");
} finally {
  await browser.close();
}
