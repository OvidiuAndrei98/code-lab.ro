import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";
const base = process.env.SITE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}/servicii/website-uri`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  const art = page.locator(".website-focus-canvas");
  assert.equal(await page.locator("h1").count(), 1);
  assert.equal(await art.getAttribute("data-view"), "ansamblu");
  const first = await page.locator(".website-focus-frame").boundingBox();
  assert.ok(first.y < 300 && first.width > 700);
  const inspect = () =>
    page.locator(".website-focus-canvas").evaluate((canvas) => {
      const iframe = canvas.querySelector("iframe");
      const scale = iframe.getBoundingClientRect().width / 1440;
      const frame = canvas.parentElement.getBoundingClientRect();
      const rect = iframe.getBoundingClientRect();
      const project = iframe.contentDocument;
      const box = (selector) => {
        const target = project.querySelector(selector).getBoundingClientRect();
        return {
          x: rect.left + (target.left + target.width / 2) * scale,
          y: rect.top + (target.top + target.height / 2) * scale,
          width: target.width * scale,
        };
      };
      const matrix = new DOMMatrix(getComputedStyle(canvas).transform);
      return {
        scale: matrix.m11,
        y: matrix.m42,
        nav: box("header nav"),
        action: box(".hero-booking"),
        frame: {
          left: frame.left,
          right: frame.right,
          top: frame.top,
          bottom: frame.bottom,
        },
        stickyBottom: canvas
          .closest(".website-visual-sticky")
          .getBoundingClientRect().bottom,
      };
    });
  const initial = await inspect();
  assert.equal(initial.scale, 1);
  const scroll = async (id) => {
    const position = await page
      .locator(`#website-${id}`)
      .evaluate(
        (el) => el.getBoundingClientRect().top + scrollY - innerHeight * 0.35,
      );
    await page.evaluate((position) => scrollTo(0, position), position);
    await page.waitForTimeout(1050);
  };
  for (const view of ["navigare", "contact", "navigare", "ansamblu"]) {
    await scroll(view);
    assert.equal(await art.getAttribute("data-view"), view);
    assert.equal(
      await page
        .locator(".website-perspectives [aria-current]")
        .getAttribute("href"),
      `#website-${view}`,
    );
    const state = await inspect();
    const expected = view === "navigare" ? 1.3 : view === "contact" ? 1.55 : 1;
    assert.ok(Math.abs(state.scale - expected) < 0.01, JSON.stringify(state));
    const target = view === "navigare" ? state.nav : state.action;
    assert.ok(
      target.x >= state.frame.left &&
        target.x <= state.frame.right &&
        target.y >= state.frame.top &&
        target.y <= state.frame.bottom,
      `Real ${view} detail is visible`,
    );
    if (view === "contact")
      assert.ok(state.action.width > initial.action.width * 1.5);
    assert.ok(
      state.stickyBottom <= 1001,
      "Sticky composition fits in the viewport",
    );
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(200);
  assert.equal(
    await art.evaluate((el) => getComputedStyle(el).transform),
    "none",
  );
  assert.equal(
    await page
      .locator(".website-visual-sticky")
      .evaluate((el) => getComputedStyle(el).position),
    "static",
  );
  assert.equal(await page.locator(".website-detail-frame:visible").count(), 2);
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: width < 800 ? 844 : 1000 });
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(120);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "Overflow at " + width,
    );
    assert.ok(
      await page.locator(".website-title-line > span").evaluateAll((elements) =>
        elements.every((el) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          const rect = range.getBoundingClientRect();
          return rect.left >= -1 && rect.right <= innerWidth + 1;
        }),
      ),
      "Clipped heading at " + width,
    );
    if ([390, 1440].includes(width)) {
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      assert.deepEqual(
        audit.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        [],
      );
    }
  }
  await page.locator(".website-conversation-action").click();
  await page.waitForURL("**/contact");
  assert.equal(await page.locator("#contact-form").count(), 1);
  await page.goto(base, { waitUntil: "networkidle" });
  assert.equal(
    await page.locator('[data-offer="website"] h3 a').getAttribute("href"),
    "/servicii/website-uri",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => scrollTo(0, 0));
  await page.evaluate(() => document.fonts.ready);
  await page
    .locator(".identity-section")
    .screenshot({ path: "artifacts/hero-after-website-page.png" });
  assert.ok(
    (
      await sharp("artifacts/home-hero-before-editorial.png")
        .extract({ left: 43, top: 64, width: 1339, height: 515 })
        .raw()
        .toBuffer()
    ).equals(
      await sharp("artifacts/hero-after-website-page.png")
        .extract({ left: 43, top: 64, width: 1339, height: 515 })
        .raw()
        .toBuffer(),
    ),
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS Website-uri: first-screen media, real navigation/contact crops, state/indicator reversal, bounded sticky image, reduced-motion flow, headings/overflow 320-1920px, desktop/mobile axe, contact destination, Home link and pixel-identical hero",
  );
} finally {
  await browser.close();
}
