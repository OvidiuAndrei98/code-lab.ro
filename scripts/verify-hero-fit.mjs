import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const base = process.env.BASE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const viewports = [
  { width: 1440, height: 1000 },
  { width: 1920, height: 910 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1080 },
  { width: 1366, height: 650 },
  { width: 900, height: 600 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
  { width: 320, height: 480 },
  { width: 1440, height: 1000 },
];

try {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    const page = await browser.newPage({
      viewport: viewports[0],
      reducedMotion,
    });
    await page.goto(base, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForTimeout(350);
      const fit = await page.evaluate(() => {
        const bottom = (selector) =>
          document.querySelector(selector).getBoundingClientRect().bottom;
        return {
          hero: bottom(".identity-section"),
          copy: bottom(".identity-bottom h2"),
          action: bottom(".identity-bottom .round-link"),
          overflow: document.documentElement.scrollWidth > innerWidth,
          glyphs: document.querySelectorAll(".identity-fill svg").length,
        };
      });
      const label = JSON.stringify({ viewport, reducedMotion, fit });
      assert.ok(fit.hero <= viewport.height + 1, label);
      assert.ok(
        fit.copy <= viewport.height && fit.action <= viewport.height,
        label,
      );
      assert.equal(fit.overflow, false, label);
      assert.equal(fit.glyphs, 7, label);
      if (viewport.width === 1920 && viewport.height === 910)
        await page.screenshot({
          path: `artifacts/hero-fit-1920-${reducedMotion}.png`,
        });
    }
    if (reducedMotion === "reduce") {
      const image = await page.locator(".identity-section").screenshot();
      assert.ok(
        (
          await sharp(image)
            .extract({ left: 43, top: 64, width: 1339, height: 515 })
            .raw()
            .toBuffer()
        ).equals(
          await sharp("artifacts/approved-hero-before.png")
            .extract({ left: 43, top: 64, width: 1339, height: 515 })
            .raw()
            .toBuffer(),
        ),
        "The approved 1440 x 1000 glyphs stay pixel identical",
      );
    }
    await page.close();
  }
  const page = await browser.newPage({
    viewport: { width: 1920, height: 910 },
    reducedMotion: "reduce",
    javaScriptEnabled: false,
  });
  await page.goto(base, { waitUntil: "networkidle" });
  assert.ok(
    await page
      .locator(".identity-section")
      .evaluate((el) => el.getBoundingClientRect().bottom <= innerHeight + 1),
    "CSS fits the hero before hydration and without JavaScript",
  );
  console.log(
    "PASS hero fit, live resize, readable copy/action, no overflow, reduced motion, no-JS and unchanged approved hero",
  );
} finally {
  await browser.close();
}
