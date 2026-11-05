import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const base = process.env.SITE_URL || "http://127.0.0.1:3000";
const label = process.env.SIDEBAR_LABEL || "diagnostic";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const reports = [];

function snapshot(phase = "frame") {
  const stage = document.querySelector(".site-stage");
  const menu = document.querySelector(".side-menu");
  const mechanism = document.querySelector(".menu-mechanism");
  const box = (node) => {
    const { x, y, width, height } = node.getBoundingClientRect();
    return { x, y, width, height };
  };
  const stageBox = box(stage);
  const nodes = {};
  for (const selector of [
    ".identity-section",
    ".identity-scene",
    ".showcase-section",
    ".home-work-media .project-media",
    ".website-visual-sticky",
    ".website-project .project-media",
    "[data-gallery-scene]",
    '[data-gallery-project="fason"]',
    '[data-gallery-project="carnet-demo"]',
    '[data-gallery-title="fason"]',
    '[data-gallery-title="carnet-demo"]',
  ]) {
    const node = document.querySelector(selector);
    if (!node) continue;
    const rect = box(node);
    const matrix = new DOMMatrix(getComputedStyle(node).transform);
    nodes[selector] = {
      ...rect,
      relativeX: rect.x - stageBox.x,
      relativeY: rect.y - stageBox.y,
      transform: [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f],
    };
  }
  return {
    phase,
    time: performance.now(),
    scroll: {
      x: scrollX,
      y: scrollY,
      html: document.documentElement.scrollTop,
      body: document.body.scrollTop,
    },
    rootClass: document.documentElement.className,
    htmlOverflow: getComputedStyle(document.documentElement).overflow,
    bodyOverflow: getComputedStyle(document.body).overflow,
    rootWidth: document.documentElement.getBoundingClientRect().width,
    bodyWidth: document.body.getBoundingClientRect().width,
    gutter: innerWidth - document.documentElement.getBoundingClientRect().width,
    stage: stageBox,
    menu: {
      ...box(menu),
      open: mechanism.matches('[data-menu-modal][aria-modal="true"]'),
      hidden: menu.hidden,
      inert: menu.inert,
      scrollTop: document.querySelector(".menu-content")?.scrollTop ?? 0,
    },
    mechanism: {
      ...box(mechanism),
      transform: getComputedStyle(mechanism).transform,
    },
    focus: {
      tag: document.activeElement.tagName,
      class: document.activeElement.className,
      href: document.activeElement.getAttribute("href"),
    },
    nodes,
  };
}

function sampler(source) {
  const read = new Function(`return (${source})`)();
  window.__sidebarFrames = [read("before")];
  window.__sidebarSampling = true;
  const tick = () => {
    if (!window.__sidebarSampling) return;
    window.__sidebarFrames.push(read());
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  // Capture the custom modal's real visibility/lock boundaries as well as
  // animation frames. The persistent assembly itself never becomes hidden.
  window.__sidebarObserver = new MutationObserver((records) => {
    if (!window.__sidebarSampling) return;
    window.__sidebarFrames.push(
      read(
        `boundary-${records.map((record) => record.attributeName).join("-")}`,
      ),
    );
  });
  for (const selector of [".menu-mechanism", ".side-menu"])
    window.__sidebarObserver.observe(document.querySelector(selector), {
      attributes: true,
      attributeFilter: ["data-menu-modal", "aria-modal", "hidden", "inert"],
    });
}

function summarize(frames) {
  const initial = frames[0];
  const nodes = {};
  for (const [selector, node] of Object.entries(initial.nodes)) {
    const values = frames.map((frame) => frame.nodes[selector]).filter(Boolean);
    nodes[selector] = {
      maxYShift: Math.max(...values.map((value) => Math.abs(value.y - node.y))),
      maxLocalYShift: Math.max(
        ...values.map((value) => Math.abs(value.relativeY - node.relativeY)),
      ),
      maxLocalXShift: Math.max(
        ...values.map((value) => Math.abs(value.relativeX - node.relativeX)),
      ),
      maxWidthShift: Math.max(
        ...values.map((value) => Math.abs(value.width - node.width)),
      ),
      maxHeightShift: Math.max(
        ...values.map((value) => Math.abs(value.height - node.height)),
      ),
    };
  }
  return {
    frames: frames.length,
    scrollYRange: [
      Math.min(...frames.map((frame) => frame.scroll.y)),
      Math.max(...frames.map((frame) => frame.scroll.y)),
    ],
    gutterRange: [
      Math.min(...frames.map((frame) => frame.gutter)),
      Math.max(...frames.map((frame) => frame.gutter)),
    ],
    maxAttachmentGap: Math.max(
      ...frames
        .filter((frame) => frame.menu.open)
        .map((frame) =>
          Math.abs(frame.menu.x - frame.stage.x - frame.stage.width),
        ),
    ),
    nodes,
  };
}

try {
  for (const route of ["/proiecte", "/", "/servicii/website-uri"]) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    await page.goto(base + route, { waitUntil: "networkidle" });
    if (route === "/proiecte")
      await page.waitForFunction(
        () =>
          document.querySelector("[data-project-gallery]")?.dataset.enhanced ===
          "true",
      );
    await page.evaluate((route) => {
      let top;
      if (route === "/proiecte") {
        const gallery = document.querySelector("[data-project-gallery]");
        top =
          +gallery.dataset.galleryStart +
          +gallery.dataset.galleryHoldDistance +
          +gallery.dataset.galleryRise / 2;
      } else if (route === "/")
        top =
          document.querySelector(".showcase-section").getBoundingClientRect()
            .top +
          scrollY -
          innerHeight / 2;
      else
        top =
          document
            .querySelector(".website-visual-sticky")
            .getBoundingClientRect().top +
          scrollY -
          110 +
          160;
      window.dispatchEvent(
        new CustomEvent("codelab:scroll-to", { detail: { top } }),
      );
    }, route);
    await page.waitForTimeout(100);
    await page.evaluate(sampler, snapshot.toString());
    const stem = `artifacts/sidebar-${label}-${route === "/" ? "home" : route === "/proiecte" ? "projects" : "website"}`;
    await page.screenshot({ path: `${stem}-before.png` });
    await page
      .getByRole("button", { name: "Deschide meniul", exact: true })
      .click();
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.screenshot({ path: `${stem}-first-open.png` });
    await page.waitForTimeout(500);
    const lockedY = await page.evaluate(() => scrollY);
    await page.mouse.move(10, 500);
    await page.mouse.wheel(0, 600);
    await page.keyboard.press("PageDown");
    await page.waitForTimeout(100);
    assert.equal(
      await page.evaluate(() => scrollY),
      lockedY,
      "outside wheel and keyboard do not scroll the background",
    );
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${stem}-after-close.png` });
    // Closing during the opening animation exercises reversal without a timer
    // being mistaken for a scroll-driven content movement.
    await page
      .getByRole("button", { name: "Deschide meniul", exact: true })
      .click();
    await page.waitForTimeout(100);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(550);
    await page
      .getByRole("button", { name: "Deschide meniul", exact: true })
      .click();
    await page.waitForTimeout(500);
    const outside = await page.locator(".side-menu").boundingBox();
    await page.mouse.click(Math.max(2, outside.x / 2), 400);
    await page.waitForTimeout(550);
    const frames = await page.evaluate(() => {
      window.__sidebarSampling = false;
      window.__sidebarObserver.disconnect();
      return window.__sidebarFrames;
    });
    const summary = summarize(frames);
    assert.ok(
      frames.some(
        (frame) => frame.phase.startsWith("boundary-") && frame.menu.open,
      ),
      `${route}: sample the actual modal opening boundary`,
    );
    assert.ok(
      frames.some(
        (frame) => frame.phase.startsWith("boundary-") && !frame.menu.open,
      ),
      `${route}: sample the actual modal closing boundary`,
    );
    assert.equal(
      summary.scrollYRange[1] - summary.scrollYRange[0],
      0,
      `${route}: root position stays stable throughout every boundary`,
    );
    assert.equal(
      summary.gutterRange[1] - summary.gutterRange[0],
      0,
      `${route}: stable scrollbar gutter`,
    );
    assert.ok(
      summary.maxAttachmentGap < 0.5,
      `${route}: menu remains attached to the stage`,
    );
    for (const [selector, node] of Object.entries(summary.nodes)) {
      assert.ok(
        node.maxYShift < 0.5 && node.maxLocalYShift < 0.5,
        `${route} ${selector}: no vertical jump in any frame`,
      );
      assert.ok(
        node.maxLocalXShift < 0.5 &&
          node.maxWidthShift < 0.5 &&
          node.maxHeightShift < 0.5,
        `${route} ${selector}: only the intended shared horizontal movement`,
      );
    }
    await page.mouse.move(600, 450);
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(1100);
    assert.ok(
      (await page.evaluate(() => scrollY)) > lockedY + 100,
      `${route}: root scrolling resumes after close`,
    );
    reports.push({ route, summary, frames });
    console.log(JSON.stringify({ route, summary }));
    await page.close();
  }
} finally {
  await browser.close();
  await writeFile(
    `artifacts/sidebar-motion-${label}.json`,
    JSON.stringify(reports, null, 2),
  );
}
