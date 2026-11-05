import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";

const base = process.env.SITE_URL || "http://127.0.0.1:3000";
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
const navigation = [
  ["Proiecte", "/proiecte"],
  ["Servicii", "/servicii"],
  ["Studio", "/studio"],
  ["Contact", "/contact"],
];
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
const track = (page) =>
  page.on("pageerror", (error) => errors.push(error.message));
const reveal = async (page) => {
  await page.locator("footer.site-footer").scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () => {
      const mark = document.querySelector("[data-footer-mark]");
      const style = getComputedStyle(mark);
      return (
        Number(style.opacity) > 0.999 &&
        Math.abs(new DOMMatrix(style.transform).m42) < 0.01
      );
    },
    undefined,
    { timeout: 5000 },
  );
};
const top = async (page, input = "mouse") => {
  const back = page.locator('footer a[href="#top"]');
  if (input === "keyboard") {
    await back.focus();
    await page.keyboard.press("Enter");
  } else if (input === "touch") await back.tap();
  else await back.click();
  await page.waitForFunction(() => scrollY <= 1);
  await expect(page.locator(".site-header .logo")).toBeFocused();
};

try {
  // A shorter Contact result must refresh an unseen footer's scroll trigger.
  for (const [width, height, method] of [
    [390, 844, "normal"],
    [768, 1000, "semantic-submit"],
  ]) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    track(page);
    await page.goto(`${base}/contact`, { waitUntil: "networkidle" });
    if (method === "normal") {
      await page.locator('#contact-form [name="service"]').first().check();
      await page
        .locator('#contact-form [name="message"]')
        .fill("Un site simplu.");
      await page.locator('#contact-form [name="name"]').fill("Test Footer");
      await page
        .locator('#contact-form [name="email"]')
        .fill("footer@example.test");
      await page.locator('#contact-form button[type="submit"]').click();
    } else
      await page.locator("#contact-form").evaluate((form) => {
        form.querySelector('[name="service"]').click();
        for (const [key, value] of Object.entries({
          message: "Un site simplu.",
          name: "Test Footer",
          email: "footer@example.test",
        })) {
          const control = form.querySelector(`[name="${key}"]`);
          control.value = value;
          control.dispatchEvent(new Event("input", { bubbles: true }));
        }
        form.requestSubmit();
      });
    await expect(page.locator(".brief-ready")).toBeVisible();
    await reveal(page);
    console.log(
      `PASS footer after Contact layout change: ${width}px ${method}`,
    );
    await context.close();
  }

  const protectedContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const protectedPage = await protectedContext.newPage();
  track(protectedPage);
  await protectedPage.goto(base, { waitUntil: "networkidle" });
  await protectedPage.evaluate(() => document.fonts.ready);
  const hero = await protectedPage
    .locator(".identity-section")
    .screenshot({ path: "artifacts/hero-after-global-footer.png" });
  assert.ok(
    (await sharp(hero).raw().toBuffer()).equals(
      await sharp("artifacts/approved-hero-before.png").raw().toBuffer(),
    ),
    "Global signature leaves the approved Home hero pixel-identical",
  );
  const originalPaths = await protectedPage
    .locator(".identity-lockup svg path")
    .evaluateAll((paths) => paths.map((path) => path.getAttribute("d")));
  assert.deepEqual(
    await protectedPage
      .locator("[data-footer-mark] path")
      .evaluateAll((paths) => paths.map((path) => path.getAttribute("d"))),
    originalPaths,
    "Footer reuses all seven original letterforms",
  );
  await protectedContext.close();

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  track(page);
  const footer = page.locator("footer.site-footer");
  const nav = footer.getByRole("navigation", {
    name: "Navigare în footer",
    exact: true,
  });
  const mark = footer.locator("[data-footer-mark]");
  const signature = footer.getByRole("link", {
    name: "CODELAB — Acasă",
    exact: true,
  });
  const audit = async (label) => {
    const result = await new AxeBuilder({ page })
      .include("footer.site-footer")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    assert.deepEqual(
      result.violations.map((violation) => ({
        id: violation.id,
        targets: violation.nodes.map((node) => node.target),
      })),
      [],
      label,
    );
  };
  const bounds = (locator) =>
    locator.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        x: rect.x + scrollX,
        y: rect.y + scrollY,
        width: rect.width,
        height: rect.height,
      };
    });
  const labelState = (locator) =>
    locator.evaluate((link) => {
      const surface = link.querySelector("[data-footer-label]");
      const original = link.querySelector("[data-footer-label-text]");
      const clone = link.querySelector("[data-footer-letters]");
      const characters = [...link.querySelectorAll("[data-footer-character]")];
      return {
        active: surface.hasAttribute("data-reordering"),
        originalOpacity: +getComputedStyle(original).opacity,
        cloneOpacity: +getComputedStyle(clone).opacity,
        cloneHidden: clone.getAttribute("aria-hidden"),
        normalText: original.textContent,
        visibleOrder: characters
          .map((character) => ({
            text: character.textContent,
            x: character.getBoundingClientRect().x,
          }))
          .sort((a, b) => a.x - b.x)
          .map((character) => character.text)
          .join(""),
        transforms: characters.map(
          (character) => new DOMMatrix(getComputedStyle(character).transform).e,
        ),
        animations: characters.flatMap((character) => character.getAnimations())
          .length,
        color: getComputedStyle(link).color,
      };
    });
  const setLabelTime = (locator, time) =>
    locator.evaluate((link, time) => {
      for (const character of link.querySelectorAll(
        "[data-footer-character]",
      )) {
        const animation = character.getAnimations()[0];
        if (!animation) throw new Error("A hovered character has no animation");
        animation.pause();
        animation.currentTime = time;
      }
    }, time);
  const measurements = [];
  for (const route of routes) {
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await expect(footer).toHaveCount(1);
    await expect(nav.getByRole("link")).toHaveCount(4);
    await expect(signature).toHaveAttribute("href", "/");
    await expect(mark).toHaveAttribute("viewBox", "0 0 832 320");
    await expect(mark).toHaveAttribute("preserveAspectRatio", "xMinYMax meet");
    await expect(mark.locator("path")).toHaveCount(7);
    await expect(footer).toContainText("Design și dezvoltare web.");
    await expect(footer).toContainText("București, România.");
    await expect(footer).toContainText(`© ${new Date().getFullYear()} CODELAB`);
    await expect(footer.locator('a[href="#top"]')).toHaveAccessibleName(
      "Înapoi sus",
    );
    await expect(page.locator("#top")).toHaveCount(1);
    await expect(
      footer.locator(
        ".identity-fill, .identity-stretch, .identity-letter, form, input, button",
      ),
    ).toHaveCount(0);
    for (const [label, href] of navigation) {
      const link = nav.getByRole("link", { name: label, exact: true });
      await expect(link).toHaveAttribute("href", href);
      const current =
        route === href
          ? "page"
          : route.startsWith(`${href}/`)
            ? "location"
            : null;
      assert.equal(await link.getAttribute("aria-current"), current);
    }
    assert.deepEqual(
      await footer
        .locator("a")
        .evaluateAll((links) =>
          links.map((link) => link.getAttribute("href")).sort(),
        ),
      ["#top", "/", "/contact", "/proiecte", "/servicii", "/studio"].sort(),
      "All footer destinations are confirmed real routes or the top anchor",
    );
    for (const width of [320, 390, 768, 980, 981, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: width <= 390 ? 844 : 1000 });
      await reveal(page);
      const layout = await footer.evaluate((element) => {
        const mark = element.querySelector("[data-footer-mark]"),
          nav = element.querySelector("nav"),
          markBox = mark.getBoundingClientRect(),
          navBox = nav.getBoundingClientRect(),
          box = element.getBoundingClientRect(),
          ink = mark.getBBox(),
          view = mark.viewBox.baseVal;
        const clipped = [...element.querySelectorAll("p, span, a")].flatMap(
          (text) => {
            if (text.querySelector("svg") && !text.textContent.trim())
              return [];
            const range = document.createRange();
            range.selectNodeContents(text);
            return [...range.getClientRects()]
              .filter(
                (bounds) =>
                  bounds.width &&
                  (bounds.left < -1 || bounds.right > innerWidth + 1),
              )
              .map(() => text.textContent);
          },
        );
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          height: box.height,
          markRatio: markBox.width / markBox.height,
          markWidth: markBox.width,
          markHeight: markBox.height,
          markTop: markBox.top,
          markBottom: markBox.bottom,
          navTop: navBox.top,
          navHeight: navBox.height,
          navRows: [...nav.querySelectorAll("a")].map((link) => {
            const rect = link.getBoundingClientRect();
            return { y: rect.y, height: rect.height };
          }),
          navX: [...nav.querySelectorAll("a")].map(
            (link) => link.getBoundingClientRect().left,
          ),
          linkHeights: [...element.querySelectorAll("a")].map(
            (link) => link.getBoundingClientRect().height,
          ),
          columnsOverlap:
            Math.min(markBox.right, navBox.right) >
              Math.max(markBox.left, navBox.left) + 1 &&
            Math.min(markBox.bottom, navBox.bottom) >
              Math.max(markBox.top, navBox.top) + 1,
          inkFits:
            ink.x >= view.x &&
            ink.y >= view.y &&
            ink.x + ink.width <= view.x + view.width &&
            ink.y + ink.height <= view.y + view.height,
          precedingGap:
            box.top -
            element.previousElementSibling.getBoundingClientRect().bottom,
          smallestText: Math.min(
            ...[...element.querySelectorAll("p, span")].map((text) =>
              parseFloat(getComputedStyle(text).fontSize),
            ),
          ),
          individualAnimations: [...mark.querySelectorAll("path")].some(
            (path) => getComputedStyle(path).animationName !== "none",
          ),
          clipped,
        };
      });
      assert.equal(
        layout.overflow,
        false,
        `${route} footer overflow at ${width}px`,
      );
      assert.deepEqual(
        layout.clipped,
        [],
        `${route} footer text clipping at ${width}px`,
      );
      assert.ok(
        Math.abs(layout.markRatio - 2.6) < 0.002,
        `Signature stays proportional at ${route}/${width}px`,
      );
      assert.ok(
        layout.inkFits &&
          !layout.columnsOverlap &&
          !layout.individualAnimations,
      );
      assert.ok(
        layout.height < 900 && layout.height > 200,
        `Footer has a composed, bounded footprint at ${route}/${width}px`,
      );
      assert.ok(
        layout.linkHeights.every((height) => height >= 44),
        `Comfortable footer targets at ${route}/${width}px`,
      );
      assert.ok(
        layout.smallestText >= 13 &&
          Math.max(...layout.navX) - Math.min(...layout.navX) < 1,
      );
      const rowHeights = layout.navRows.map((row) => row.height);
      assert.ok(
        Math.max(...rowHeights) - Math.min(...rowHeights) < 0.1,
        `Four equal navigation rows at ${route}/${width}px`,
      );
      layout.navRows
        .slice(1)
        .forEach((row, index) =>
          assert.ok(
            Math.abs(
              row.y - layout.navRows[index].y - layout.navRows[index].height,
            ) < 0.1,
            `Navigation rows keep an equal, continuous step at ${route}/${width}px`,
          ),
        );
      if (width > 980) {
        assert.ok(
          Math.abs(layout.navTop - layout.markTop) < 0.1 &&
            Math.abs(layout.navHeight - layout.markHeight) < 0.1,
          `Navigation and signature share their full height at ${route}/${width}px`,
        );
      } else
        assert.ok(
          layout.navTop - layout.markBottom >= 35,
          `Stacked footer separates signature and navigation at ${route}/${width}px`,
        );
      assert.ok(
        Math.abs(layout.precedingGap) < 1,
        `No empty spacer before the footer at ${route}/${width}px`,
      );
      if ([390, 1440].includes(width))
        await audit(`${route} footer ${width}px`);
      if (
        ["/", "/contact", "/studio", "/servicii"].includes(route) &&
        [390, 1440].includes(width)
      )
        await footer.screenshot({
          path: `artifacts/footer-${route === "/" ? "home" : route.slice(1)}-${width}.png`,
        });
      if (route === "/" && [980, 981].includes(width))
        await footer.screenshot({
          path: `artifacts/footer-breakpoint-${width}.png`,
        });
      if (route === "/") measurements.push({ width, ...layout });
    }
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  // Every navigation destination is exercised through the footer itself.
  for (const [label, href] of navigation) {
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    await reveal(page);
    await nav.getByRole("link", { name: label, exact: true }).click();
    await page.waitForURL(`**${href}`);
    assert.equal(new URL(page.url()).pathname, href);
    await expect(page.locator("main")).toBeVisible();
  }
  await reveal(page);
  await signature.click();
  await page.waitForURL(`${base}/`);
  await reveal(page);
  await top(page);
  await reveal(page);
  await footer.locator('a[href="#top"]').focus();
  await page.keyboard.press("Tab");
  await expect(signature).toBeFocused();
  for (const [label] of navigation) {
    await page.keyboard.press("Tab");
    await expect(
      nav.getByRole("link", { name: label, exact: true }),
    ).toBeFocused();
  }
  const studioLink = nav.getByRole("link", { name: "Studio", exact: true });
  await page.mouse.move(0, 0);
  await page.evaluate(() => document.activeElement.blur());
  await page.waitForTimeout(300);
  const labelBefore = await labelState(studioLink);
  assert.equal(labelBefore.originalOpacity, 1);
  assert.equal(labelBefore.cloneOpacity, 0);
  assert.equal(labelBefore.cloneHidden, "true");
  const before = await bounds(studioLink);
  await studioLink.hover();
  await setLabelTime(studioLink, 40);
  const labelReversed = await labelState(studioLink);
  assert.equal(
    labelReversed.visibleOrder,
    "oidutS",
    "Hover starts with the exactly reversed word",
  );
  assert.equal(labelReversed.active, true);
  assert.equal(labelReversed.originalOpacity, 0);
  assert.equal(labelReversed.cloneOpacity, 1);
  await expect(studioLink).toHaveAccessibleName("Studio");
  await footer.screenshot({ path: "artifacts/footer-label-reversed.png" });
  const reorderPhases = [];
  for (const [time, expected] of [
    [70, "Soidut"],
    [100, "Stoidu"],
    [130, "Stuoid"],
    [160, "Studoi"],
    [189.99, "Studio"],
  ]) {
    await setLabelTime(studioLink, time);
    const state = await labelState(studioLink);
    assert.equal(
      state.visibleOrder,
      expected,
      "Each step moves the last reversed letter into its natural prefix",
    );
    await expect(studioLink).toHaveAccessibleName("Studio");
    reorderPhases.push({ time, ...state });
  }
  await expect(studioLink).toHaveCSS("color", "rgb(198, 62, 36)");
  const hovered = await bounds(studioLink);
  for (const axis of ["x", "y", "width", "height"])
    assert.ok(
      Math.abs(before[axis] - hovered[axis]) < 0.1,
      "Navigation feedback keeps the click area stable",
    );
  await setLabelTime(studioLink, 100);
  const interrupted = await labelState(studioLink);
  await page.mouse.move(0, 0);
  const returnStarts = await studioLink.evaluate((link) =>
    [...link.querySelectorAll("[data-footer-character]")].map(
      (character) =>
        new DOMMatrix(
          character.getAnimations()[0].effect.getKeyframes()[0].transform,
        ).e,
    ),
  );
  returnStarts.forEach((x, index) =>
    assert.ok(
      Math.abs(x - interrupted.transforms[index]) < 0.1,
      "Leaving returns from the actual visible letter positions",
    ),
  );
  await page.waitForTimeout(130);
  const afterLeave = await labelState(studioLink);
  assert.equal(afterLeave.active, false);
  assert.equal(afterLeave.originalOpacity, 1);
  assert.equal(afterLeave.animations, 0);

  // A new entry may replace an interrupted sequence; keyboard focus cancels it.
  await studioLink.hover();
  await setLabelTime(studioLink, 70);
  await studioLink.focus();
  const labelFocused = await labelState(studioLink);
  assert.equal(
    labelFocused.active,
    false,
    "Keyboard focus restores the normal label immediately",
  );
  assert.equal(labelFocused.originalOpacity, 1);
  assert.equal(labelFocused.animations, 0);
  await expect(studioLink).toHaveCSS("color", "rgb(198, 62, 36)");
  await expect(studioLink).toHaveAccessibleName("Studio");
  const focused = await bounds(studioLink);
  for (const axis of ["x", "y", "width", "height"])
    assert.ok(
      Math.abs(before[axis] - focused[axis]) < 0.1,
      "Keyboard focus preserves the navigation geometry",
    );
  assert.ok(
    await studioLink.evaluate(
      (link) => parseFloat(getComputedStyle(link).outlineWidth) >= 2,
    ),
    "Navigation has a visible focus outline",
  );
  await page.keyboard.press("Enter");
  await page.waitForURL("**/studio");
  await reveal(page);
  await top(page, "keyboard");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await reveal(page);
  assert.equal(
    await mark.evaluate((svg) => getComputedStyle(svg).transform),
    "none",
  );
  const reducedLink = nav.getByRole("link", { name: "Servicii", exact: true });
  await reducedLink.hover();
  await reducedLink.focus();
  const reducedLabel = await labelState(reducedLink);
  assert.equal(
    reducedLabel.active,
    false,
    "Reduced motion retains the normal label on hover and focus",
  );
  assert.equal(reducedLabel.originalOpacity, 1);
  assert.equal(reducedLabel.cloneOpacity, 0);
  assert.equal(reducedLabel.animations, 0);
  assert.equal(reducedLabel.color, "rgb(198, 62, 36)");
  await expect(reducedLink).toHaveAccessibleName("Servicii");
  await top(page);
  await context.close();

  const phoneContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const phone = await phoneContext.newPage();
  track(phone);
  await phone.goto(`${base}/studio`, { waitUntil: "networkidle" });
  await reveal(phone);
  await top(phone, "touch");
  await reveal(phone);
  const touchLink = phone
    .locator("footer")
    .getByRole("link", { name: "Proiecte", exact: true });
  const touchLabel = await labelState(touchLink);
  assert.equal(
    touchLabel.active,
    false,
    "Touch exposes the normal label without a hover requirement",
  );
  assert.equal(touchLabel.originalOpacity, 1);
  assert.equal(touchLabel.cloneOpacity, 0);
  assert.equal(touchLabel.animations, 0);
  await expect(touchLink).toHaveAccessibleName("Proiecte");
  await phone
    .locator("footer")
    .getByRole("link", { name: "Proiecte", exact: true })
    .tap();
  await phone.waitForURL("**/proiecte");
  await phoneContext.close();
  for (const width of [390, 1440]) {
    const staticContext = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 1000 },
      javaScriptEnabled: false,
      reducedMotion: "reduce",
    });
    const staticPage = await staticContext.newPage();
    await staticPage.goto(`${base}/studio`, { waitUntil: "load" });
    await expect(staticPage.locator("[data-footer-mark]")).toBeVisible();
    await staticPage.locator("footer").scrollIntoViewIfNeeded();
    await staticPage.locator('footer a[href="#top"]').click();
    await staticPage.waitForFunction(() => scrollY <= 1);
    await staticPage
      .locator("footer")
      .getByRole("link", { name: "Contact", exact: true })
      .click();
    await staticPage.waitForURL("**/contact");
    await staticContext.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS footer: dynamic Contact reflow, original proportional signature and approved hero, 10 routes×8 widths including980/981, equal navigation rows/full signature alignment, all real links/Home/backtop, native keyboard/touch, accessible reversed-letter sequence/interruption with stable geometry, desktop/mobile Axe, reduced motion and no-JS fallback",
    JSON.stringify({ measurements, reorderPhases }),
  );
} finally {
  await browser.close();
}
