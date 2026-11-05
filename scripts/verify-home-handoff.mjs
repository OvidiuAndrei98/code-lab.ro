import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
const base = process.env.SITE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const reports = [],
  errors = [];
await mkdir("artifacts/refinement-oct26", { recursive: true });
function read() {
  const el = (s) => document.querySelector(s),
    rect = (n) => {
      const r = n.getBoundingClientRect();
      return {
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        bottom: r.bottom,
      };
    };
  const word = el(".identity-lockup"),
    hero = el(".identity-section"),
    panel = el(".showcase-section");
  const letters = [...word.querySelectorAll("svg")].map(rect);
  const top = Math.min(...letters.map((r) => r.y)),
    bottom = Math.max(...letters.map((r) => r.bottom));
  return {
    scroll: scrollY,
    hero: rect(hero),
    panel: rect(panel),
    letters,
    ink: { top, bottom, height: bottom - top },
    scale: new DOMMatrix(getComputedStyle(word).transform).d,
    opacity: +getComputedStyle(el(".identity-scene")).opacity,
    round: parseFloat(getComputedStyle(panel).borderTopLeftRadius),
    phase: hero.dataset.pressPhase,
    sticky: getComputedStyle(hero).position === "sticky",
    overflow: document.documentElement.scrollWidth > innerWidth,
    pins: document.querySelectorAll(".pin-spacer").length,
    media: rect(el(".home-work-media")),
    mediaTransform: getComputedStyle(el(".home-work-media .project-media"))
      .transform,
  };
}
const near = (a, b, m, t = 0.8) =>
  assert.ok(Math.abs(a - b) < t, `${m}: ${a} / ${b}`);
async function open(viewport, options = {}) {
  const context = await browser.newContext({ viewport, ...options });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1150);
  return { context, page };
}
const scroll = async (p, y) => {
  await p.evaluate((y) => scrollTo(0, y), y);
  await p.waitForTimeout(110);
  return p.evaluate(read);
};
try {
  for (const [width, height] of [
    [1440, 1000],
    [1920, 912],
    [390, 844],
    [320, 568],
  ]) {
    const { context, page } = await open({ width, height });
    const initial = await page.evaluate(read);
    near(initial.scale, 1, "Initial wordmark unchanged");
    assert.equal(initial.opacity, 1);
    assert.equal(initial.overflow, false);
    assert.equal(initial.pins, 0);
    const inkOffset = initial.ink.top - initial.hero.y;
    const contact =
      initial.panel.y + initial.scroll - inkOffset - initial.ink.height;
    const samples = [];
    for (const portion of [
      -0.08, 0, 0.15, 0.35, 0.55, 0.7, 0.85, 0.7, 0.35, 0.15, -0.08,
    ]) {
      const state = await scroll(
        page,
        Math.max(0, contact + initial.ink.height * portion),
      );
      samples.push(state);
      assert.equal(state.overflow, false);
      assert.equal(state.opacity, 1);
      state.letters.forEach((r, i) => {
        near(r.x, initial.letters[i].x, "Stable glyph x", 0.02);
        near(r.width, initial.letters[i].width, "Stable glyph width", 0.02);
      });
      const min = width < 700 ? 0.32 : 0.25;
      near(
        state.scale,
        Math.max(
          min,
          Math.min(1, (state.panel.y - state.ink.top) / initial.ink.height),
        ),
        "Whole word vertical press",
        0.002,
      );
      if (state.phase === "press") {
        near(state.ink.bottom, state.panel.y, "Ink contacts panel");
        near(state.ink.top, inkOffset + state.hero.y, "Anchored top");
        near(state.round, 0, "Corners straight at contact", 0.02);
      }
      if (portion > 0.8) near(state.scale, min, "Compressed minimum", 0.002);
    }
    await scroll(page, contact + initial.ink.height * 0.4);
    await page.screenshot({
      path: `artifacts/refinement-oct26/press-${width}.png`,
    });
    await scroll(page, 0);
    near((await page.evaluate(read)).scale, 1, "Reverse returns to initial");
    const media = await page
      .locator(".home-work-media")
      .evaluate((el) => ({
        node: el.getBoundingClientRect().top + scrollY,
        h: el.getBoundingClientRect().height,
      }));
    await scroll(page, media.node);
    const after = await page.evaluate(read);
    near(
      after.media.width / after.media.height,
      1.5,
      "Original project proportions",
      0.002,
    );
    assert.equal(after.mediaTransform, "none");
    assert.equal(
      await page.locator(".home-project-bridge,.home-service-evidence").count(),
      0,
      "Rejected previews and shrinking removed",
    );
    assert.equal(
      await page.locator("[data-offer]").count(),
      3,
      "All three service chapters restored",
    );
    assert.equal(
      await page.locator('[data-offer="website"] h3 a').getAttribute("href"),
      "/servicii/website-uri",
    );
    assert.equal(
      await page.locator(".home-work-media iframe").count(),
      1,
      "One FASON source",
    );
    // Same scroll source must remain coherent after a real responsive resize.
    await page.setViewportSize({
      width: width > 700 ? 1280 : width + 40,
      height,
    });
    await page.waitForTimeout(450);
    const resized = await scroll(page, 0);
    near(resized.scale, 1, "Resize returns correct initial geometry");
    assert.equal(resized.overflow, false);
    reports.push({ viewport: { width, height }, initial, samples });
    await context.close();
  }
  const { context, page } = await open({ width: 1440, height: 1000 });
  await page.evaluate(() => {
    window.pressFrames = [];
    window.capturePress = true;
    const step = () => {
      if (!window.capturePress) return;
      const p = document
        .querySelector(".showcase-section")
        .getBoundingClientRect();
      const h = document.querySelector(".identity-section");
      const rs = [...document.querySelectorAll(".identity-lockup svg")].map(
        (s) => s.getBoundingClientRect(),
      );
      window.pressFrames.push({
        phase: h.dataset.pressPhase,
        panel: p.top,
        ink: Math.max(...rs.map((r) => r.bottom)),
      });
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  await page.mouse.wheel(0, 650);
  await page.waitForTimeout(900);
  await page.mouse.wheel(0, -500);
  await page.waitForTimeout(900);
  const frames = await page.evaluate(() => {
    window.capturePress = false;
    return window.pressFrames;
  });
  const pressed = frames.filter((r) => r.phase === "press");
  assert.ok(pressed.length > 15, "Wheel and reversal exercise press frames");
  pressed.forEach((r) =>
    near(r.panel, r.ink, "Smoothed scroll maintains contact"),
  );
  reports.push({ wheelFrames: frames.length, pressedFrames: pressed.length });
  await context.close();
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
    { width: 1440, height: 450 },
  ]) {
    const { context, page } = await open(viewport, { reducedMotion: "reduce" });
    await scroll(page, 400);
    const state = await page.evaluate(read);
    near(state.scale, 1, "Static/reduced wordmark");
    assert.equal(state.opacity, 1);
    assert.equal(state.phase, undefined);
    await scroll(page, 0);
    await page.screenshot({
      path: `artifacts/refinement-oct26/home-static-${viewport.width}x${viewport.height}.png`,
      fullPage: true,
    });
    await context.close();
  }
  const nojs = await open(
    { width: 390, height: 844 },
    { javaScriptEnabled: false, reducedMotion: "reduce" },
  );
  assert.equal(await nojs.page.locator("[data-offer]").count(), 3);
  assert.equal(
    await nojs.page.locator(".home-work-media").getAttribute("href"),
    "/proiecte/fason",
  );
  await nojs.context.close();
  assert.deepEqual(errors, []);
  await writeFile(
    "artifacts/home-handoff-after.json",
    JSON.stringify(reports, null, 2),
  );
  console.log(
    "PASS whole-word press: visual contact, anchored top, constant widths/x, 25% desktop / 32% phone, no fade, reversible wheel, resize, static reduced/no-JS, restored three text-led services and one stable FASON source.",
  );
} finally {
  await browser.close();
}
