import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const base = process.env.SITE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
const reports = [];
try {
  for (const [width, height] of [
    [500, 750],
    [500, 865],
    [390, 844],
    [650, 900],
    [1440, 1000],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1000);
    const preview = page.locator(".home-work-media .project-media").first();
    const geometry = await preview.evaluate((el) => {
      const box = el.getBoundingClientRect();
      return { top: box.top + scrollY, height: box.height };
    });
    const mediaState = () =>
      preview.evaluate((el) => {
        const style = getComputedStyle(el);
        const transform = new DOMMatrix(style.transform);
        return {
          clip: style.clipPath,
          opacity: +style.opacity,
          scale: transform.a,
          y: transform.f,
        };
      });
    const scroll = async (y) => {
      await page.evaluate((value) => scrollTo(0, value), Math.max(0, y));
      await page.waitForTimeout(850);
    };
    if (geometry.top + geometry.height <= height) {
      assert.ok(
        (await mediaState()).clip === "none",
        `${width}×${height}: an initially visible preview needs no extra scroll`,
      );
    }

    // This is the first scroll position where the complete preview fits.
    // The old fixed mask end left short previews partly black at this position.
    const fullImageAt = Math.max(
      0,
      geometry.top + geometry.height - height + 1,
    );
    await scroll(fullImageAt);
    const fullyVisible = await preview.boundingBox();
    assert.ok(fullyVisible.y >= -1, `${width}×${height}: image top is visible`);
    assert.ok(
      fullyVisible.y + fullyVisible.height <= height + 1,
      `${width}×${height}: the complete image fits in the viewport`,
    );
    assert.equal(
      (await mediaState()).clip,
      "none",
      `${width}×${height}: the whole image is revealed as soon as it fits`,
    );
    assert.equal(
      (await mediaState()).opacity,
      1,
      "No independent fade blanks the image",
    );
    assert.equal((await mediaState()).scale, 1, "The project keeps its scale");
    await page.screenshot({
      path: `artifacts/home-visible-project-${width}-${height}.png`,
    });
    await scroll(fullImageAt + 100);
    assert.equal(
      (await mediaState()).clip,
      "none",
      "The project stays unmasked",
    );

    const panelTop = await page
      .locator(".showcase-section")
      .evaluate((el) => el.getBoundingClientRect().top + scrollY);
    await scroll(panelTop + 1);
    const settled = await mediaState();
    assert.ok(
      Math.abs(settled.y) < 0.01,
      "Media reaches its stable position when entry completes",
    );
    await scroll(panelTop + 200);
    assert.deepEqual(
      await mediaState(),
      settled,
      "The completed image stays stable",
    );
    await scroll(0);
    assert.equal(
      (await mediaState()).clip,
      "none",
      "Reverse scrolling never hides the image",
    );
    await scroll(fullImageAt);
    assert.equal(
      (await mediaState()).clip,
      "none",
      "Returning still shows the complete preview",
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(100);
    assert.equal(
      await preview.evaluate((el) => getComputedStyle(el).clipPath),
      "none",
      "Reduced motion restores the unmasked media",
    );
    assert.equal(await page.locator(".pin-spacer").count(), 0);
    if (width === 1440) {
      await scroll(0);
      const path = "artifacts/hero-after-project-handoff.png";
      await page.locator(".identity-section").screenshot({ path });
      assert.ok(
        (
          await sharp("artifacts/approved-hero-before.png")
            .extract({ left: 43, top: 64, width: 1339, height: 515 })
            .raw()
            .toBuffer()
        ).equals(
          await sharp(path)
            .extract({ left: 43, top: 64, width: 1339, height: 515 })
            .raw()
            .toBuffer(),
        ),
        "The approved glyphs remain pixel identical",
      );
    }
    reports.push({ width, height, fullImageAt, imageHeight: geometry.height });
    await context.close();
  }
  const resizeContext = await browser.newContext({
    viewport: { width: 500, height: 750 },
    reducedMotion: "no-preference",
  });
  const resizePage = await resizeContext.newPage();
  resizePage.on("pageerror", (error) => errors.push(error.message));
  await resizePage.goto(base, { waitUntil: "networkidle" });
  await resizePage.evaluate(() => document.fonts.ready);
  for (const [width, height] of [
    [390, 844],
    [650, 900],
    [1440, 1000],
    [500, 750],
  ]) {
    await resizePage.evaluate(() => scrollTo(0, 0));
    await resizePage.setViewportSize({ width, height });
    await resizePage.waitForTimeout(1000);
    const preview = resizePage
      .locator(".home-work-media .project-media")
      .first();
    const geometry = await preview.evaluate((el) => {
      const box = el.getBoundingClientRect();
      return { top: box.top + scrollY, height: box.height };
    });
    const mediaState = () =>
      preview.evaluate((el) => ({
        clip: getComputedStyle(el).clipPath,
        scale: new DOMMatrix(getComputedStyle(el).transform).a,
      }));
    const fullAt = Math.max(0, geometry.top + geometry.height - height + 1);
    if (fullAt === 0) {
      assert.ok(
        (await mediaState()).clip === "none",
        "Live resize reveals a preview that already fits",
      );
    }
    await resizePage.evaluate((y) => scrollTo(0, y), fullAt);
    await resizePage.waitForTimeout(850);
    assert.ok(
      (await mediaState()).clip === "none",
      `Live resize ${width}×${height}: the fitting image remains fully visible`,
    );
    assert.equal(
      (await mediaState()).scale,
      1,
      "Live resize preserves the media surface scale",
    );
    if (fullAt > 0) {
      await resizePage.evaluate(() => scrollTo(0, 0));
      await resizePage.waitForTimeout(850);
      assert.ok(
        (await mediaState()).clip === "none",
        "Refreshed handoff keeps media visible when reversing",
      );
    }
  }
  await resizeContext.close();
  assert.deepEqual(errors, []);
  console.log(
    "PASS Home project stays visible when media fits at narrow desktop, mobile and desktop; reversal, stable media scale/end state, reduced motion and approved hero pixels.",
  );
  console.log(JSON.stringify(reports));
} finally {
  await browser.close();
}
