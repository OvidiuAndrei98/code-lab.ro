import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const base = process.env.SITE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "no-preference",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  async function open() {
    await page.goto(base, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.querySelector(".pin-spacer"));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1100);
    return page.locator(".pin-spacer").evaluate((el) => ({
      start: el.getBoundingClientRect().top + scrollY,
      travel: parseFloat(getComputedStyle(el).paddingBottom),
    }));
  }
  async function pose(metrics, progress) {
    await page.evaluate(
      (y) => scrollTo(0, y),
      metrics.start + metrics.travel * progress,
    );
    await page.waitForTimeout(550);
    return page.evaluate(() => {
      const rect = (selector) =>
        document.querySelector(selector).getBoundingClientRect();
      const glyph = rect(".identity-stretch");
      return {
        hero: rect(".identity-section").top,
        gap: glyph.top - rect(".hydraulic-head").bottom,
        base: glyph.bottom,
        scale: new DOMMatrix(
          getComputedStyle(document.querySelector(".identity-stretch"))
            .transform,
        ).m22,
        work: rect(".showcase-section").top,
        height: innerHeight,
      };
    });
  }
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const metrics = await open();
    const approaching = await pose(metrics, 0.2);
    assert.equal(approaching.scale, 1, "Letters stay intact before contact");
    assert.ok(approaching.gap > 5, "The platen approaches before pressing");
    let baseline;
    for (const progress of [0.3, 0.48, 0.7, 0.82, 0.95]) {
      const state = await pose(metrics, progress);
      baseline ??= state.base;
      assert.ok(Math.abs(state.hero) < 1, "Hero stays pinned");
      assert.ok(
        Math.abs(state.gap) < 1.2,
        "The platen must stay in contact with the letter tops",
      );
      assert.ok(
        Math.abs(state.base - baseline) < 1,
        "Letter baseline stays still",
      );
      assert.ok(
        state.work >= state.height - 1,
        "Projects wait until compression finishes",
      );
      if (progress >= 0.82) assert.ok(Math.abs(state.scale - 0.22) < 0.001);
    }
    const mid = await pose(metrics, 0.6);
    await page.getByRole("button", { name: "Meniu", exact: true }).click();
    await page.waitForTimeout(500);
    const menu = await page.evaluate(() => ({
      seam: Math.abs(
        document.querySelector("dialog").getBoundingClientRect().left -
          document.querySelector(".site-stage").getBoundingClientRect().right,
      ),
      y: scrollY,
    }));
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(() => scrollY), menu.y);
    assert.ok(menu.seam < 1);
    await page.keyboard.press("Escape");
    await page.locator("dialog").waitFor({ state: "hidden" });
    const resumed = await pose(metrics, 0.6);
    assert.ok(
      Math.abs(resumed.scale - mid.scale) < 0.001,
      "Menu must not reset the press",
    );
    const released = await pose(metrics, 1.15);
    assert.ok(released.hero < -20 && released.work < released.height);
    const reverse = await pose(metrics, 0.48);
    assert.ok(
      Math.abs(reverse.gap) < 1.2 && reverse.scale > 0.22 && reverse.scale < 1,
    );
    const restored = await pose(metrics, 0);
    assert.ok(
      Math.abs(restored.scale - 1) < 0.001,
      "Reverse scrolling restores full-height type",
    );
    await page.screenshot({ path: `artifacts/hydraulic-ready-${width}.png` });
    await pose(metrics, 0.7);
    await page.screenshot({ path: `artifacts/hydraulic-pressed-${width}.png` });
    await page.setViewportSize({
      width: width === 1440 ? 1024 : 390,
      height: width === 1440 ? 900 : 740,
    });
    await page.waitForTimeout(500);
    const resizedMetrics = await page.locator(".pin-spacer").evaluate((el) => ({
      start: el.getBoundingClientRect().top + scrollY,
      travel: parseFloat(getComputedStyle(el).paddingBottom),
    }));
    const resized = await pose(resizedMetrics, 0.6);
    assert.ok(
      Math.abs(resized.gap) < 1.2,
      "Live resizing must preserve platen contact",
    );
    console.log(
      `PASS hydraulic contact, pin/release, reversal and menu at ${width}px`,
    );
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => !document.querySelector(".pin-spacer"));
  assert.equal(
    await page
      .locator(".identity-stretch")
      .first()
      .evaluate((el) => getComputedStyle(el).transform),
    "none",
  );
  assert.equal(
    await page
      .locator(".hydraulic-machine")
      .evaluate((el) => getComputedStyle(el).visibility),
    "hidden",
  );
  await page.setViewportSize({ width: 844, height: 390 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForTimeout(500);
  assert.equal(
    await page.locator(".pin-spacer").count(),
    0,
    "Short viewports use the normal entrance",
  );
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  assert.deepEqual(errors, []);
  console.log("PASS reduced-motion cleanup and short-screen fallback");
} finally {
  await browser.close();
}
