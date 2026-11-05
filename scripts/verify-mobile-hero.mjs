import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const base = process.env.SITE_URL || "http://127.0.0.1:3000";
const reports = [];

function read() {
  const matrix = (node) => new DOMMatrix(getComputedStyle(node).transform);
  const hero = document.querySelector(".identity-section");
  const panel = document.querySelector(".showcase-section");
  const media = document.querySelector(".home-work-media > .project-media");
  const scene = document.querySelector(".identity-scene");
  return {
    scroll: scrollY,
    viewport: [innerWidth, innerHeight],
    heroY: hero.getBoundingClientRect().y,
    heroPosition: getComputedStyle(hero).position,
    panelOrigin: panel.getBoundingClientRect().y + scrollY,
    scales: [...document.querySelectorAll(".identity-stretch")].map(
      (node) => matrix(node).d,
    ),
    opacity: +getComputedStyle(scene).opacity,
    imageY: matrix(media).f,
    pins: document.querySelectorAll(".pin-spacer").length,
    overflow: document.documentElement.scrollWidth > innerWidth,
  };
}

const near = (a, b, message) =>
  assert.ok(Math.abs(a - b) < 0.001, `${message}: ${a} / ${b}`);
const initial = (state) => {
  assert.deepEqual(
    state.scales,
    [1, 1, 1, 1, 1, 1, 1],
    "Initial letters retain their original proportions",
  );
  near(state.opacity, 1, "Initial hero contrast");
  near(state.imageY, 0, "Mobile project media stays still");
  assert.equal(state.pins, 0);
  assert.equal(state.overflow, false);
};

async function open(viewport, reducedMotion = "no-preference", mobile = true) {
  const context = await browser.newContext({
    viewport,
    isMobile: mobile,
    hasTouch: mobile,
    deviceScaleFactor: 1,
    reducedMotion,
  });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1300);
  return { context, page };
}

async function gesture(page, context, distance) {
  const session = await context.newCDPSession(page);
  const viewport = page.viewportSize();
  const x = Math.round(viewport.width / 2);
  const y = Math.min(viewport.height - 65, 650);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let step = 1; step <= 10; step++) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y: y - (distance * step) / 10 }],
    });
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(220);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.waitForTimeout(200);
  await session.detach();
  return page.evaluate(read);
}

try {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 768, height: 1024 },
  ]) {
    const { context, page } = await open(viewport);
    const start = await page.evaluate(read);
    initial(start);
    const screenshot = `artifacts/mobile-hero-after-${viewport.width}.png`;
    await page.locator(".identity-section").screenshot({
      path: screenshot,
      // Compare the approved hero underneath the separate persistent menu tab.
      style: ".menu-tab { visibility: hidden !important; }",
    });
    const beforePixels = await sharp(
      `artifacts/mobile-hero-before-${viewport.width}.png`,
    )
      .raw()
      .toBuffer();
    const afterPixels = await sharp(screenshot).raw().toBuffer();
    assert.deepEqual(
      afterPixels,
      beforePixels,
      "Protected initial mobile hero is pixel-identical",
    );

    const forward = await gesture(page, context, 125);
    assert.ok(forward.scroll > 70, "Native touch advances the document");
    assert.ok(
      forward.scales.every((scale) => scale > 1),
      "Every letter stretches with touch scroll",
    );
    assert.ok(
      new Set(forward.scales).size > 3,
      "Letters retain varied stretch amplitudes",
    );
    assert.ok(forward.opacity < 1 && forward.opacity >= 0.72);
    near(forward.imageY, 0, "Touch does not move the project image");
    await page.waitForTimeout(350);
    const stopped = await page.evaluate(read);
    assert.deepEqual(
      stopped.scales,
      forward.scales,
      "No independent letter drift after touch stops",
    );
    near(stopped.opacity, forward.opacity, "Contrast stops with the scroll");

    await page.evaluate(() => {
      window.__heroMenuFrames = [];
      window.__heroMenuSampling = true;
      const frame = () => {
        window.__heroMenuFrames.push({
          y: scrollY,
          heroY: document
            .querySelector(".identity-section")
            .getBoundingClientRect().y,
          scales: [...document.querySelectorAll(".identity-stretch")].map(
            (node) => new DOMMatrix(getComputedStyle(node).transform).d,
          ),
        });
        if (window.__heroMenuSampling) requestAnimationFrame(frame);
      };
      frame();
    });
    await page
      .getByRole("button", { name: "Deschide meniul", exact: true })
      .tap();
    await page.waitForTimeout(700);
    assert.equal(
      await page
        .getByRole("dialog", { name: "Meniu principal", exact: true })
        .count(),
      1,
      "The assembly exposes the active modal semantics",
    );
    await page.keyboard.press("Escape");
    await page.waitForTimeout(700);
    assert.equal(
      await page.locator(".menu-mechanism").getAttribute("data-menu-modal"),
      null,
      "Closing releases the modal assembly",
    );
    assert.equal(
      await page
        .locator(".side-menu")
        .evaluate((node) => node.hidden && node.inert),
      true,
      "The closed menu panel remains hidden and inert",
    );
    const menuFrames = await page.evaluate(() => {
      window.__heroMenuSampling = false;
      return window.__heroMenuFrames;
    });
    for (const frame of menuFrames) {
      near(frame.y, forward.scroll, "Menu preserves native document position");
      near(frame.heroY, forward.heroY, "Menu preserves sticky hero position");
      assert.deepEqual(
        frame.scales,
        forward.scales,
        "Menu preserves the scroll-driven letter state",
      );
    }

    const reversed = await gesture(page, context, -85);
    assert.ok(
      reversed.scroll < forward.scroll - 30,
      "Native touch reversal moves back",
    );
    assert.ok(
      reversed.scales.every((scale, i) => scale < forward.scales[i]),
      "All letters follow the reversed scroll",
    );
    assert.ok(reversed.opacity > forward.opacity);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(200);
    initial(await page.evaluate(read));
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height + 72,
    });
    await page.waitForTimeout(400);
    const resized = await page.evaluate(read);
    initial(resized);
    reports.push({
      viewport,
      start,
      pixelIdentical: true,
      forward,
      stopped,
      menuFrames: menuFrames.length,
      reversed,
      resized,
    });
    await context.close();
  }

  for (const profile of [
    { viewport: { width: 844, height: 390 }, reduced: "no-preference" },
    { viewport: { width: 390, height: 844 }, reduced: "reduce" },
  ]) {
    const { context, page } = await open(profile.viewport, profile.reduced);
    const start = await page.evaluate(read);
    initial(start);
    const scrolled = await gesture(page, context, 125);
    initial(scrolled);
    assert.equal(
      scrolled.heroPosition,
      "relative",
      "Short/reduced hero stays in normal flow",
    );
    reports.push({ profile, start, scrolled });
    await context.close();
  }

  const { context, page } = await open(
    { width: 1440, height: 1000 },
    "no-preference",
    false,
  );
  await page.locator(".identity-section").screenshot({
    path: "artifacts/mobile-hero-after-1440.png",
    style: ".menu-tab { visibility: hidden !important; }",
  });
  const beforePixels = await sharp("artifacts/mobile-hero-before-1440.png")
    .raw()
    .toBuffer();
  const afterPixels = await sharp("artifacts/mobile-hero-after-1440.png")
    .raw()
    .toBuffer();
  assert.deepEqual(
    afterPixels,
    beforePixels,
    "Protected desktop hero is pixel-identical",
  );
  reports.push({ desktopInitialPixelIdentical: true });
  await context.close();
  await writeFile(
    "artifacts/mobile-hero-independent-verification.json",
    JSON.stringify(reports, null, 2),
  );
  console.log(
    JSON.stringify({ pass: true, profiles: reports.length, reports }, null, 2),
  );
} finally {
  await browser.close();
}
