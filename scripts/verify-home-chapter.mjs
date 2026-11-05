import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import sharp from "sharp";
const base = process.env.SITE_URL || "http://127.0.0.1:3000";
const b = await chromium.launch({ channel: "msedge", headless: true });
try {
  const p = await b.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "no-preference",
  });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(base, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  const scroll = async (y) => {
    await p.evaluate((y) => scrollTo(0, y), y);
    await p.waitForTimeout(950);
  };
  const position = (selector) =>
    p
      .locator(selector)
      .evaluate((el) => el.getBoundingClientRect().top + scrollY);
  const panelTop = await position(".showcase-section");
  const media = () =>
    p.locator(".home-work-media .project-media").evaluate((el) => {
      const style = getComputedStyle(el);
      const transform = new DOMMatrix(style.transform);
      return {
        clip: style.clipPath,
        opacity: +style.opacity,
        scale: transform.a,
        y: transform.f,
      };
    });
  await scroll(panelTop - 500);
  const middle = await media();
  assert.equal(
    middle.clip,
    "none",
    "The image is visible throughout the sheet's arrival",
  );
  assert.equal(middle.opacity, 1);
  assert.equal(middle.scale, 1);
  assert.ok(
    middle.y > 0 && middle.y < 16,
    "A small internal offset follows the sheet",
  );
  await p.screenshot({ path: "artifacts/home-project-handoff-mid.png" });
  await scroll(panelTop + 1);
  const completed = await media();
  assert.equal(completed.clip, "none");
  assert.equal(completed.scale, 1);
  assert.ok(
    Math.abs(completed.y) < 0.01,
    "Media settles when the sheet reaches the top",
  );
  await scroll(panelTop + 150);
  assert.deepEqual(
    await media(),
    completed,
    "The project remains stable after entry",
  );
  assert.equal(
    await p.locator(".service-teaser,.overview-preview,.teaser-shop").count(),
    0,
  );
  assert.equal(await p.locator(".home-continuation iframe").count(), 0);
  const frame = await p.locator(".home-work-media").boundingBox();
  assert.ok(frame.width > 1300);
  const stack = await p.locator(".home-work-project").evaluate((el) => ({
    title: parseFloat(getComputedStyle(el.querySelector("h3")).fontSize),
    ratio:
      el.querySelector(".project-media").offsetWidth /
      el.querySelector(".project-media").offsetHeight,
  }));
  assert.ok(stack.title < 40);
  assert.ok(Math.abs(stack.ratio - 1.5) < 0.003);
  for (const id of ["website", "ecommerce", "aplicatii", "website"]) {
    await scroll((await position(`#home-${id}`)) - 300);
    assert.equal(
      await p.locator(".offer-index [aria-current]").getAttribute("href"),
      `#home-${id}`,
    );
    const transforms = await p
      .locator(`#home-${id} .offer-line-text`)
      .evaluateAll((elements) =>
        elements.map((el) => getComputedStyle(el).transform),
      );
    assert.ok(transforms.every((value) => value === "none"));
    const contextTop = await p
      .locator(".offer-context-sticky")
      .evaluate((el) => el.getBoundingClientRect().top);
    assert.ok(
      contextTop >= 119 && contextTop <= 321,
      `Sticky context: ${contextTop}`,
    );
    if (id !== "website") assert.ok(Math.abs(contextTop - 120) < 2);
  }
  await scroll((await position(".home-studio-pause")) - 100);
  assert.ok(
    (await p
      .locator(".offer-context-sticky")
      .evaluate((el) => el.getBoundingClientRect().bottom)) < 400,
    "Sidebar ends within its own chapter",
  );
  await p.emulateMedia({ reducedMotion: "reduce" });
  await p.waitForTimeout(150);
  assert.equal(
    await p
      .locator(".home-work-media .project-media")
      .evaluate((el) => getComputedStyle(el).clipPath),
    "none",
  );
  assert.equal(await p.locator(".home-chapter-motion").count(), 0);
  assert.equal(
    await p
      .locator(".offer-context-sticky")
      .evaluate((el) => getComputedStyle(el).position),
    "static",
  );
  await scroll(0);
  await p
    .locator(".identity-section")
    .screenshot({ path: "artifacts/home-hero-verified.png" });
  assert.ok(
    (
      await sharp("artifacts/home-hero-before-editorial.png").raw().toBuffer()
    ).equals(await sharp("artifacts/home-hero-verified.png").raw().toBuffer()),
    "Approved hero stays pixel identical",
  );
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await p.setViewportSize({ width, height: width < 800 ? 844 : 1000 });
    await scroll(0);
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert.ok(
      await p.locator(".offer-line-text").evaluateAll((elements) =>
        elements.every((el) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          const rect = range.getBoundingClientRect();
          return rect.left >= -1 && rect.right <= innerWidth + 1;
        }),
      ),
      "Service text is not clipped at " + width,
    );
  }
  await p.setViewportSize({ width: 390, height: 844 });
  await p.locator(".home-contact-link").click();
  await p.waitForURL("**/contact");
  assert.equal(await p.locator("#contact-form").count(), 1);
  const noJs = await b.newPage({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  await noJs.goto(base, { waitUntil: "load" });
  assert.equal(await noJs.locator("[data-offer]").count(), 3);
  assert.equal(
    await noJs.locator(".home-contact-link").getAttribute("href"),
    "/contact",
  );
  assert.equal(
    await noJs
      .locator(".offer-line-text")
      .first()
      .evaluate((el) => getComputedStyle(el).transform),
    "none",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS hero pixel match, wide visible project/coherent handoff/stable state, service indicator/reversal, bounded sticky context, reduced-motion cleanup, legible type at 320-1920px, contact and no-JS content",
  );
} finally {
  await b.close();
}
