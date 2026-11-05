import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
const base = process.env.SITE_URL || "http://127.0.0.1:3000";
const report = { raster: [], motion: [], errors: [] };
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  ignoreDefaultArgs: ["--hide-scrollbars"],
  args: [
    "--disable-features=OverlayScrollbar,OverlayScrollbars,FluentOverlayScrollbar,FluentScrollbar",
  ],
});
function snapshot() {
  const q = (s) => document.querySelector(s),
    box = (s) => {
      const r = q(s).getBoundingClientRect();
      return { x: r.x, y: r.y, right: r.right, width: r.width };
    };
  return {
    time: performance.now(),
    dpr: devicePixelRatio,
    scroll: scrollY,
    root: box("html"),
    stage: box(".site-stage"),
    panel: box("#site-menu"),
    face: box(".menu-tab-face"),
    mechanism: box(".menu-mechanism"),
    travel: new DOMMatrix(getComputedStyle(q(".menu-mechanism")).transform).e,
    stageTravel: new DOMMatrix(getComputedStyle(q(".site-stage")).transform).e,
    modal: q(".menu-mechanism").hasAttribute("data-menu-modal"),
    overlap:
      parseFloat(
        getComputedStyle(q(".menu-tab")).getPropertyValue("--menu-tab-overlap"),
      ) || 0,
    overflow: document.documentElement.scrollWidth > innerWidth,
    bodyOverflow: getComputedStyle(document.body).overflow,
    heroY: q(".identity-section").getBoundingClientRect().y,
  };
}
function geometry(s, reduced = false) {
  for (const x of [s.travel, s.stageTravel])
    assert.ok(
      Math.abs(x * s.dpr - Math.round(x * s.dpr)) < 0.0006,
      "Physical-pixel-aligned translation",
    );
  assert.equal(s.overflow, false);
  if (s.modal) {
    assert.equal(s.bodyOverflow, "clip");
    assert.ok(Math.abs(s.panel.x - s.mechanism.x) < 0.001);
    if (!reduced)
      assert.ok(
        Math.abs(s.stage.right - s.panel.x) < 0.001,
        "Stage and menu remain attached",
      );
    if (!s.overlap)
      assert.ok(
        Math.abs(s.face.right - s.panel.x) < 0.001,
        "No unwanted tab overlap",
      );
  }
}
async function pageFor(dpr, scene, freeze = false) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 912 },
    deviceScaleFactor: dpr,
  });
  if (freeze)
    await context.addInitScript(() => {
      const original = requestAnimationFrame.bind(window);
      window.__heldFrames = [];
      window.__pauseMotion = false;
      window.requestAnimationFrame = (callback) =>
        original((time) => {
          if (window.__pauseMotion) window.__heldFrames.push(callback);
          else callback(time);
        });
      window.__resumeMotion = () => {
        window.__pauseMotion = false;
        for (const callback of window.__heldFrames.splice(0))
          original(callback);
      };
    });
  const page = await context.newPage();
  page.on("pageerror", (e) => report.errors.push(e.message));
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  if (scene === "fason")
    await page.evaluate(() => {
      const e = document.querySelector(".showcase-section");
      dispatchEvent(
        new CustomEvent("codelab:scroll-to", {
          detail: {
            top: e.getBoundingClientRect().top + scrollY + 110,
            immediate: true,
          },
        }),
      );
    });
  await page.waitForTimeout(150);
  return { context, page };
}
try {
  for (const dpr of [1, 1.25])
    for (const scene of ["paper", "fason"])
      for (const target of [-1 / dpr, 0]) {
        const { context, page } = await pageFor(dpr, scene, true);
        // Under concurrent browser/build load a single final rounded position
        // may be skipped. Retry the real transition instead of waiting forever.
        let captured = false;
        for (let attempt = 0; attempt < 3 && !captured; attempt++) {
          await page.locator(".menu-tab").click();
          await page.waitForTimeout(650);
          captured = await page.evaluate(
            (target) =>
              new Promise((resolve) => {
                const started = performance.now();
                const tick = () => {
                  const e = document.querySelector(".menu-mechanism"),
                    x = new DOMMatrix(getComputedStyle(e).transform).e;
                  if (
                    Math.abs(x - target) < 0.0005 &&
                    e.hasAttribute("data-menu-modal")
                  ) {
                    window.__pauseMotion = true;
                    resolve(true);
                  } else if (
                    performance.now() - started > 2500 ||
                    (!e.hasAttribute("data-menu-modal") &&
                      performance.now() - started > 200)
                  ) {
                    resolve(false);
                  } else requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
                document.querySelector(".menu-tab").click();
              }),
            target,
          );
        }
        assert.equal(
          captured,
          true,
          `Real terminal frame sampled: ${scene}/${dpr}/${target}`,
        );
        const state = await page.evaluate(snapshot);
        geometry(state);
        assert.equal(
          state.modal,
          true,
          "Capture is before final modal teardown",
        );
        assert.equal(
          await page.locator(".menu-seam").count(),
          0,
          "No painted cover hides the regression",
        );
        const cdp = await context.newCDPSession(page);
        const capture = await cdp.send("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: false,
          clip: { x: 0, y: 0, width: 1920, height: 912, scale: dpr },
        });
        const png = Buffer.from(capture.data, "base64");
        const { data, info } = await sharp(png)
          .removeAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        assert.equal(info.width, 1920 * dpr);
        assert.equal(info.height, 912 * dpr);
        const pixels = [];
        for (const y of [350, 500, 700, 850])
          for (
            let x = Math.floor(state.panel.x * dpr) - 3;
            x <= Math.floor(state.panel.x * dpr) + 3;
            x++
          ) {
            const offset = (Math.round(y * dpr) * info.width + x) * 3;
            const rgb = [...data.subarray(offset, offset + 3)];
            pixels.push({ x, y, rgb });
            if (scene === "fason" && x < Math.floor(state.root.right * dpr))
              assert.ok(
                Math.max(...rgb) <= 25,
                `No pale seam ${scene}/${dpr}/${target} @${x},${y} root${state.root.right} seam${state.panel.x}: ${rgb}`,
              );
            else if (target === 0)
              assert.ok(
                (rgb[0] > 225 && rgb[1] > 225) || Math.max(...rgb) <= 25,
                "No extra dark line left on paper at zero",
              );
          }
        await writeFile(
          `artifacts/menu-seam-real-${scene}-dpr${dpr}-${target === 0 ? "zero" : "last-step"}.png`,
          png,
        );
        report.raster.push({ dpr, scene, target, state, pixels });
        await page.evaluate(() => window.__resumeMotion());
        await page.waitForFunction(
          () =>
            !document
              .querySelector(".menu-mechanism")
              .hasAttribute("data-menu-modal"),
        );
        await context.close();
      }
  const { context, page } = await pageFor(1.25, "fason");
  const initial = await page.evaluate(snapshot);
  await page.evaluate((source) => {
    const read = new Function(`return (${source})`)();
    window.__seamFrames = [];
    window.__seamRecording = true;
    const tick = () => {
      window.__seamFrames.push(read());
      if (window.__seamRecording) requestAnimationFrame(tick);
    };
    tick();
  }, snapshot.toString());
  await page.locator(".menu-tab").evaluate((e) => e.click());
  await page.waitForTimeout(85);
  await page.locator(".menu-tab").evaluate((e) => e.click());
  await page.waitForTimeout(35);
  await page.locator(".menu-tab").evaluate((e) => e.click());
  await page.waitForTimeout(600);
  const frames = await page.evaluate(() => {
    window.__seamRecording = false;
    return window.__seamFrames;
  });
  for (const frame of frames) {
    geometry(frame);
    assert.equal(frame.scroll, initial.scroll);
    assert.equal(frame.heroY, initial.heroY);
  }
  report.motion.push({ kind: "rapid-reverse-dpr1.25", frames });
  await page.setViewportSize({ width: 1439, height: 912 });
  await page.waitForTimeout(120);
  const resized = await page.evaluate(snapshot);
  geometry(resized);
  report.motion.push({ kind: "resize-dpr1.25", state: resized });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(150);
  const reduced = await page.evaluate(snapshot);
  geometry(reduced, true);
  assert.equal(reduced.stageTravel, 0);
  report.motion.push({ kind: "reduced-dpr1.25", state: reduced });
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () =>
      !document
        .querySelector(".menu-mechanism")
        .hasAttribute("data-menu-modal"),
  );
  await context.close();
  assert.deepEqual(report.errors, []);
  console.log(
    `Menu seam PASS: ${report.raster.length} real closing rasters; ${frames.length} reversal frames; DPR1.25 resize/reduced; exact tab-panel attachment.`,
  );
} finally {
  await browser.close();
  await writeFile(
    "artifacts/menu-seam-verification.json",
    JSON.stringify(report, null, 2),
  );
}
