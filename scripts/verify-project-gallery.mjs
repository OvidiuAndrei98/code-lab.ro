import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";
import { archiveProjects } from "../src/lib/projects.ts";

const base = process.env.SITE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
const report = {
  samples: [],
  wheel: [],
  fallbacks: [],
  protected: [],
  sources: [],
};
const near = (actual, expected, tolerance, label) =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${label}: ${actual} / ${expected}`,
  );
const project = (state, slug) =>
  state.panels.find((panel) => panel.slug === slug);

function snapshot() {
  const root = document.querySelector("[data-project-gallery]");
  const bounds = (node) => {
    const { x, y, width, height, bottom, right } = node.getBoundingClientRect();
    return { x, y, width, height, bottom, right };
  };
  const matrix = (node) => {
    const m = new DOMMatrix(getComputedStyle(node).transform);
    return [m.a, m.b, m.c, m.d, m.e, m.f];
  };
  const panels = [...root.querySelectorAll("[data-gallery-project]")].map(
    (node) => {
      const band =
        node.querySelector("[data-gallery-band]") ||
        node.querySelector("header");
      const media = node.querySelector(".project-media");
      const frame = media.querySelector("iframe");
      const title = node.querySelector("[data-gallery-title]");
      const link = (band || node).querySelector('a[href^="/proiecte/"]');
      const linkBox = bounds(link);
      const linkPoint = {
        x: linkBox.x + linkBox.width / 2,
        y: linkBox.y + linkBox.height / 2,
      };
      const hit =
        linkPoint.y > 0 &&
        linkPoint.y < innerHeight &&
        document.elementFromPoint(linkPoint.x, linkPoint.y)?.closest("a") ===
          link;
      let sticky = node;
      while (
        sticky &&
        sticky !== document.documentElement &&
        getComputedStyle(sticky).position !== "sticky"
      )
        sticky = sticky.parentElement;
      return {
        slug: node.dataset.galleryProject,
        box: bounds(node),
        transform: matrix(node),
        band: band ? bounds(band) : null,
        title: title
          ? {
              ...bounds(title),
              transform: matrix(title),
              opacity: getComputedStyle(title).opacity,
            }
          : null,
        background: getComputedStyle(node).backgroundColor,
        presentationTop: sticky
          ? parseFloat(getComputedStyle(sticky).top)
          : NaN,
        link: {
          ...linkBox,
          href: link.getAttribute("href"),
          text: link.textContent.trim(),
          hit,
          inert: !!link.closest("[inert]"),
          tabIndex: link.tabIndex,
        },
        media: {
          ...bounds(media),
          transform: matrix(media),
          opacity: getComputedStyle(media).opacity,
          filter: getComputedStyle(media).filter,
          clip: getComputedStyle(media).clipPath,
        },
        frame: {
          transform: matrix(frame),
          width: Number(frame.width),
          height: Number(frame.height),
          src: frame.getAttribute("src"),
        },
      };
    },
  );
  return {
    scroll: scrollY,
    width: innerWidth,
    height: innerHeight,
    root: {
      ...bounds(root),
      documentTop: root.getBoundingClientRect().top + scrollY,
    },
    enhanced: root.dataset.enhanced === "true",
    readiness: root.dataset.galleryReady,
    panels,
    closing: root.nextElementSibling ? bounds(root.nextElementSibling) : null,
    owner: document.scrollingElement.tagName,
    overflow: document.documentElement.scrollWidth > innerWidth,
    pinCount: document.querySelectorAll(".pin-spacer").length,
    lenisOwners: document.querySelectorAll(".lenis").length,
  };
}

async function open(options = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    ...options,
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/proiecte`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  return { context, page };
}

async function ready(page) {
  await page.waitForFunction(
    () =>
      document.querySelector("[data-project-gallery]")?.dataset.enhanced ===
      "true",
  );
}

async function scroll(page, top) {
  await page.evaluate((value) => {
    window.dispatchEvent(
      new CustomEvent("codelab:scroll-to", { detail: { top: value } }),
    );
    if (!document.documentElement.classList.contains("lenis"))
      window.scrollTo({ top: value, behavior: "instant" });
  }, top);
  await page.waitForTimeout(45);
  return page.evaluate(snapshot);
}

async function settledNativeScroll(page) {
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        let previous = scrollY;
        let stable = 0;
        const sample = () =>
          setTimeout(() => {
            const current = scrollY;
            stable = Math.abs(current - previous) < 0.5 ? stable + 1 : 0;
            previous = current;
            if (stable >= 4) resolve();
            else sample();
          }, 80);
        sample();
      }),
  );
}

function coherent(state, initial, label) {
  assert.equal(state.panels.length, 2);
  assert.equal(state.owner, "HTML");
  assert.equal(state.overflow, false, `${label}: no horizontal overflow`);
  assert.equal(state.pinCount, 0, `${label}: CSS sticky adds no pin spacers`);
  assert.ok(state.lenisOwners <= 1, `${label}: one document scroll owner`);
  for (const panel of state.panels) {
    const original = project(initial, panel.slug);
    const data = archiveProjects.find((item) => item.slug === panel.slug);
    assert.ok(panel.band, `${label}: identifying band belongs to article`);
    assert.equal(
      panel.link.href,
      `/proiecte/${panel.slug}`,
      `${label}: permanent destination`,
    );
    assert.ok(
      panel.link.text.includes(
        data.isDemo ? "Explorează conceptul" : "Vezi proiectul",
      ),
    );
    assert.deepEqual(
      panel.transform.slice(0, 4),
      [1, 0, 0, 1],
      `${label}: panel translation has no zoom/rotation`,
    );
    near(
      panel.transform[4],
      0,
      0.01,
      `${label}: vertical movement has no horizontal drift`,
    );
    near(
      panel.box.x,
      original.box.x,
      1,
      `${label}: common alignment remains fixed`,
    );
    assert.deepEqual(
      panel.title.transform,
      [1, 0, 0, 1, 0, 0],
      `${label}: project title no longer rolls independently`,
    );
    assert.equal(panel.title.opacity, "1");
    assert.deepEqual(
      panel.media.transform,
      [1, 0, 0, 1, 0, 0],
      `${label}: no independent image motion`,
    );
    assert.equal(panel.media.opacity, "1");
    assert.equal(panel.media.filter, "none");
    assert.equal(panel.media.clip, "none", `${label}: lateral reveal removed`);
    near(
      panel.frame.transform[0],
      panel.frame.transform[3],
      0.0001,
      `${label}: original preview keeps uniform proportions`,
    );
    assert.deepEqual(panel.frame.transform.slice(1, 3), [0, 0]);
    assert.equal(panel.frame.width, data.media.width);
    assert.ok(
      panel.frame.height > 0,
      `${label}: inert desktop preview keeps a real viewport`,
    );
    assert.equal(panel.frame.src, data.media.src);
    for (const key of ["width", "height"])
      near(
        panel.media[key],
        original.media[key],
        1,
        `${label}: screenshot dimensions stay stable`,
      );
    near(
      panel.media.y - panel.box.y,
      original.media.y - original.box.y,
      1,
      `${label}: image travels with its identity`,
    );
    near(
      panel.band.y - panel.box.y,
      original.band.y - original.box.y,
      1,
      `${label}: band travels with the article`,
    );
    near(
      panel.frame.transform[0],
      original.frame.transform[0],
      0.0001,
      `${label}: iframe has no scroll zoom`,
    );
  }
}

async function audit(page, label) {
  const result = await new AxeBuilder({ page }).analyze();
  assert.deepEqual(
    result.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map((node) => node.target),
    })),
    [],
    `${label}: Axe`,
  );
}

async function fallback(page, label) {
  assert.notEqual(
    await page.locator("[data-project-gallery]").getAttribute("data-enhanced"),
    "true",
    `${label}: normal flow`,
  );
  const positions = [];
  for (const item of archiveProjects) {
    const article = page.locator(`[data-gallery-project="${item.slug}"]`);
    await article.scrollIntoViewIfNeeded();
    const data = await article.evaluate((node) => ({
      top: node.getBoundingClientRect().top + scrollY,
      bottom: node.getBoundingClientRect().bottom + scrollY,
      height: node.getBoundingClientRect().height,
      text: node.textContent,
      media: node.querySelector(".project-media").getBoundingClientRect()
        .height,
      inert: node.inert,
    }));
    assert.ok(data.height > data.media && data.media > 100);
    assert.ok(
      data.text.includes(item.title) &&
        data.text.includes(item.status) &&
        data.text.includes(item.serviceLabel),
    );
    if (item.isDemo) assert.match(data.text, /fără client real/i);
    assert.equal(data.inert, false);
    const link = article.locator(`a[href="/proiecte/${item.slug}"]`).first();
    assert.equal(await link.evaluate((node) => node.tabIndex), 0);
    positions.push(data);
  }
  assert.ok(
    positions[1].top >= positions[0].bottom - 1,
    `${label}: complete articles follow each other`,
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  report.fallbacks.push({ label, positions });
}

try {
  const { context, page } = await open();
  await ready(page);
  assert.equal(await page.locator("h1").count(), 1);
  assert.match(await page.locator("h1").innerText(), /PROIECTE/i);
  assert.equal(
    await page
      .locator("[data-gallery-band]")
      .evaluateAll((bands) =>
        bands.every((band) =>
          [...band.querySelectorAll("span")].every(
            (node) => !/^\d{2}$/.test(node.textContent.trim()),
          ),
        ),
      ),
    true,
    "latest correction removes decorative 01/02 labels",
  );
  const initial = await page.evaluate(snapshot);
  const decoded = await page
    .locator("[data-gallery-project] iframe")
    .evaluateAll((frames) =>
      frames.map((frame) => ({
        source: frame.getAttribute("src"),
        url: frame.contentDocument.URL,
        complete: frame.contentDocument.readyState,
        fonts: frame.contentDocument.fonts.status,
        images: [...frame.contentDocument.images].every(
          (image) => image.complete && image.naturalWidth > 0,
        ),
      })),
    );
  for (const frame of decoded) {
    assert.ok(frame.url.endsWith(frame.source));
    assert.equal(frame.complete, "complete");
    assert.equal(frame.fonts, "loaded");
    assert.equal(
      frame.images,
      true,
      "real preview images are ready before sticky enhancement",
    );
  }
  coherent(initial, initial, "opening");
  assert.ok(
    project(initial, "fason").media.y < initial.height * 0.7,
    "first image starts in first screen",
  );
  assert.ok(
    initial.root.height < initial.height * 4,
    "two projects use a bounded scroll sequence",
  );
  await page.screenshot({ path: "artifacts/project-stack-opening-1440.png" });

  const end =
    initial.root.documentTop + initial.root.height + initial.height * 0.25;
  for (
    let top = Math.max(0, initial.root.documentTop - 100);
    top <= end;
    top += initial.height / 24
  ) {
    const state = await scroll(page, top);
    coherent(state, initial, `scroll ${Math.round(top)}`);
    report.samples.push(state);
  }
  const firstHold = report.samples.filter((state) => {
    const first = project(state, "fason");
    const second = project(state, "carnet-demo");
    return (
      Math.abs(first.box.y - first.presentationTop) < 1 &&
      first.box.bottom <= state.height - 8 &&
      second.box.y >= first.box.bottom
    );
  });
  const overlap = report.samples.filter((state) => {
    const first = project(state, "fason");
    const second = project(state, "carnet-demo");
    return (
      Math.abs(first.box.y - first.presentationTop) < 1 &&
      second.box.y < first.box.bottom - 20 &&
      second.box.y > first.box.y + 20
    );
  });
  const lastHold = report.samples.filter((state) => {
    const second = project(state, "carnet-demo");
    return (
      Math.abs(second.box.y - second.presentationTop) < 1 &&
      second.box.bottom <= state.height - 8
    );
  });
  assert.ok(
    firstHold.length >= 2 &&
      firstHold.at(-1).scroll - firstHold[0].scroll >= 60,
    "FASON has a complete quiet hold before cover",
  );
  assert.ok(
    overlap.length >= 3,
    "next whole article rises progressively from below",
  );
  assert.ok(
    lastHold.length >= 2 && lastHold.at(-1).scroll - lastHold[0].scroll >= 60,
    "CARNET remains fully presented before release",
  );
  const first = firstHold[Math.floor(firstHold.length / 2)];
  const middle = overlap[Math.floor(overlap.length / 2)];
  const last = lastHold[Math.floor(lastHold.length / 2)];
  for (let index = 1; index < overlap.length; index++) {
    near(
      project(overlap[index], "fason").box.y,
      project(overlap[0], "fason").box.y,
      1,
      "outgoing project stays stable",
    );
    assert.ok(
      project(overlap[index], "carnet-demo").box.y <
        project(overlap[index - 1], "carnet-demo").box.y + 1,
      "incoming edge rises vertically",
    );
  }
  assert.ok(
    report.samples.some(
      (state) =>
        state.scroll > last.scroll &&
        project(state, "carnet-demo").box.y <
          project(last, "carnet-demo").box.y - 30 &&
        state.closing?.y < state.height,
    ),
    "last article releases naturally toward ending/footer",
  );
  for (const [name, state] of [
    ["fason", first],
    ["overlap", middle],
    ["carnet", last],
  ]) {
    await scroll(page, state.scroll);
    await page.screenshot({ path: `artifacts/project-stack-${name}-1440.png` });
  }

  const stopped = await scroll(page, middle.scroll);
  await page.waitForTimeout(450);
  near(
    project(await page.evaluate(snapshot), "carnet-demo").box.y,
    project(stopped, "carnet-demo").box.y,
    0.2,
    "pause stops the composition",
  );
  await scroll(page, first.scroll);
  const reversed = await scroll(page, middle.scroll);
  near(
    project(reversed, "carnet-demo").box.y,
    project(stopped, "carnet-demo").box.y,
    1,
    "reverse repeats the same physical path",
  );

  // During partial cover FASON's still-visible band keeps its own real URL.
  const clickable = overlap.find((state) => project(state, "fason").link.hit);
  assert.ok(
    clickable,
    "outgoing project link remains available during partial cover",
  );
  await scroll(page, clickable.scroll);
  await page
    .locator('[data-gallery-project="fason"] a[href="/proiecte/fason"]')
    .first()
    .click();
  await page.waitForURL("**/proiecte/fason");
  await page.goBack({ waitUntil: "networkidle" });
  await scroll(page, 0);
  await ready(page);

  await scroll(page, first.scroll);
  await page
    .locator('[data-gallery-project="fason"] a[href="/proiecte/fason"]')
    .first()
    .focus();
  await page.keyboard.press("Tab");
  await page.waitForTimeout(120);
  assert.equal(
    await page.evaluate(() => document.activeElement.getAttribute("href")),
    "/proiecte/carnet-demo",
    "incoming project remains discoverable by keyboard",
  );
  assert.equal(
    project(await page.evaluate(snapshot), "carnet-demo").link.hit,
    true,
    "focused incoming destination is actually visible",
  );
  await page.keyboard.press("Shift+Tab");
  await page.waitForTimeout(120);
  assert.equal(
    await page.evaluate(() => document.activeElement.getAttribute("href")),
    "/proiecte/fason",
    "reverse keyboard navigation reveals the outgoing project again",
  );
  assert.equal(project(await page.evaluate(snapshot), "fason").link.hit, true);
  await scroll(page, last.scroll);
  const covered = await page.evaluate(snapshot);
  assert.equal(project(covered, "fason").link.hit, false);
  assert.ok(
    project(covered, "fason").link.inert ||
      project(covered, "fason").link.tabIndex < 0,
    "covered destination is removed from Tab order",
  );
  await audit(page, "CARNET full presentation");
  await scroll(
    page,
    await page.evaluate(() => document.documentElement.scrollHeight),
  );
  await page.locator("footer nav a").first().focus();
  for (let index = 0; index < 8; index++) {
    await page.keyboard.press("Shift+Tab");
    await page.waitForTimeout(80);
    if (
      await page.evaluate(
        () =>
          document.activeElement.getAttribute("href") ===
          "/proiecte/carnet-demo",
      )
    )
      break;
  }
  assert.equal(
    await page.evaluate(() => document.activeElement.getAttribute("href")),
    "/proiecte/carnet-demo",
    "reverse entry from the footer reaches the last project",
  );
  const footerEntry = project(await page.evaluate(snapshot), "carnet-demo");
  near(
    footerEntry.box.y,
    footerEntry.presentationTop,
    1,
    "footer Shift+Tab restores the complete CARNET hold",
  );
  assert.ok(
    footerEntry.box.bottom <= initial.height - 8 && footerEntry.link.hit,
  );
  await scroll(page, first.scroll);
  await audit(page, "FASON full presentation");

  await page.evaluate((source) => {
    const read = new Function(`return (${source})`)();
    window.__stackFrames = [];
    window.__stackSampling = true;
    const sample = () => {
      if (!window.__stackSampling) return;
      window.__stackFrames.push(read());
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }, snapshot.toString());
  await page.mouse.move(600, 450);
  for (const [delta, pause] of [
    [100, 160],
    [600, 180],
    [-400, 150],
    [1200, 200],
    [-1700, 1000],
  ]) {
    await page.mouse.wheel(0, delta);
    await page.waitForTimeout(pause);
  }
  report.wheel = await page.evaluate(() => {
    window.__stackSampling = false;
    return window.__stackFrames;
  });
  assert.ok(report.wheel.length > 40);
  for (const frame of report.wheel)
    coherent(frame, initial, "real wheel frame");
  assert.ok(
    report.wheel.some((state) => {
      const first = project(state, "fason");
      const second = project(state, "carnet-demo");
      return (
        second.box.y > first.box.y + 30 && second.box.y < first.box.bottom - 30
      );
    }),
    "fast/reversed wheel crosses the overlap",
  );

  for (const [width, height] of [
    [1920, 1080],
    [1024, 768],
    [1440, 600],
    [390, 844],
    [320, 700],
    [768, 1000],
    [1440, 1000],
  ]) {
    await page.setViewportSize({ width, height });
    await scroll(page, 0);
    await page.waitForTimeout(250);
    const state = await page.evaluate(snapshot);
    assert.equal(state.overflow, false);
    if (!state.enhanced) await fallback(page, `live resize ${width}x${height}`);
    else {
      coherent(state, state, `live resize ${width}x${height}`);
      assert.ok(
        state.panels.every(
          (panel) => panel.box.height <= height - panel.presentationTop - 8,
        ),
        "complete panel fits available screen",
      );
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(100);
  await fallback(page, "live reduced motion");
  await context.close();

  for (const [width, height, reducedMotion, javaScriptEnabled] of [
    [390, 844, "no-preference", true],
    [1440, 1000, "reduce", true],
    [1440, 1000, "reduce", false],
    [390, 844, "reduce", false],
  ]) {
    const item = await open({
      viewport: { width, height },
      reducedMotion,
      javaScriptEnabled,
    });
    await fallback(
      item.page,
      `${width}/${reducedMotion}/${javaScriptEnabled ? "JS" : "no-JS"}`,
    );
    if (javaScriptEnabled) await audit(item.page, `${width} static`);
    await item.page.evaluate(() => scrollTo(0, 0));
    await item.page.screenshot({
      path: `artifacts/project-stack-static-${width}-${javaScriptEnabled ? reducedMotion : "nojs"}.png`,
      fullPage: true,
    });
    if (width === 1440 && reducedMotion === "reduce" && javaScriptEnabled) {
      await item.page.screenshot({
        path: "artifacts/project-stack-full-1440.png",
        fullPage: true,
      });
    }
    await item.context.close();
  }

  const delayedContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await delayedContext.route(
    "**/previews/carnet-demo/index.html",
    async (route) => {
      await gate;
      await route.continue();
    },
  );
  const delayed = await delayedContext.newPage();
  await delayed.goto(`${base}/proiecte`, { waitUntil: "domcontentloaded" });
  await delayed.evaluate(() => document.fonts.ready);
  await delayed
    .locator('[data-gallery-project="carnet-demo"]')
    .scrollIntoViewIfNeeded();
  assert.notEqual(
    await delayed
      .locator("[data-project-gallery]")
      .getAttribute("data-enhanced"),
    "true",
  );
  const held = await delayed.evaluate(() => scrollY);
  release();
  await delayed.waitForLoadState("networkidle");
  await delayed.waitForTimeout(200);
  assert.notEqual(
    await delayed
      .locator("[data-project-gallery]")
      .getAttribute("data-enhanced"),
    "true",
    "late readiness does not replace a reader's fallback",
  );
  near(
    await delayed.evaluate(() => scrollY),
    held,
    2,
    "late image load keeps reader position",
  );
  await scroll(delayed, 0);
  await ready(delayed);
  await delayedContext.close();

  const failedContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  await failedContext.route("**/previews/carnet-demo/index.html", (route) =>
    route.abort(),
  );
  const failed = await failedContext.newPage();
  await failed.goto(`${base}/proiecte`, { waitUntil: "networkidle" });
  await failed.waitForTimeout(150);
  assert.notEqual(
    await failed
      .locator("[data-project-gallery]")
      .getAttribute("data-enhanced"),
    "true",
  );
  assert.equal(await failed.locator("[data-gallery-project]").count(), 2);
  await failedContext.close();

  const touch = await open({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await fallback(touch.page, "native touch");
  await scroll(
    touch.page,
    await touch.page.evaluate(() => document.documentElement.scrollHeight),
  );
  await touch.page.waitForTimeout(800);
  await scroll(touch.page, 0);
  await touch.page.screenshot({
    path: "artifacts/project-stack-full-390.png",
    fullPage: true,
  });
  const session = await touch.context.newCDPSession(touch.page);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 190, y: 650 }],
  });
  for (const y of [600, 550, 500, 450, 400, 350]) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 190, y }],
    });
    await touch.page.waitForTimeout(30);
  }
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await touch.page.waitForTimeout(250);
  assert.ok(
    await touch.page.evaluate(() => scrollY > 100),
    "native touch scroll remains available",
  );
  await settledNativeScroll(touch.page);
  const touchLink = touch.page
    .locator(
      '[data-gallery-project="carnet-demo"] a[href="/proiecte/carnet-demo"]',
    )
    .first();
  assert.ok(
    (await touchLink.boundingBox()).height >= 44,
    "touch action retains a generous hit area",
  );
  await touchLink.tap();
  await touch.page.waitForURL("**/proiecte/carnet-demo");
  await touch.context.close();

  // A second installed browser checks the same actual hold/cover geometry.
  const chrome = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await chrome.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/proiecte`, { waitUntil: "networkidle" });
    await ready(page);
    const original = await page.evaluate(snapshot);
    for (const state of [first, middle, last])
      coherent(
        await scroll(page, state.scroll),
        original,
        "Chrome stack position",
      );
    const lastChrome = await scroll(page, last.scroll);
    near(
      project(lastChrome, "carnet-demo").box.y,
      project(lastChrome, "carnet-demo").presentationTop,
      1,
      "Chrome complete CARNET hold",
    );
    await page
      .locator(
        '[data-gallery-project="carnet-demo"] a[href="/proiecte/carnet-demo"]',
      )
      .first()
      .click();
    await page.waitForURL("**/proiecte/carnet-demo");
  } finally {
    await chrome.close();
  }

  // Optional historical guard for the original gallery-only redesign. Later
  // authorized Home/Studio/navigation changes have their own browser suites.
  if (process.env.GALLERY_HISTORICAL_SCOPE === "1") {
    // All other public compositions were captured before this scoped iteration.
    const baseline = JSON.parse(
      await readFile("artifacts/project-stack-source-baseline.json", "utf8"),
    );
    const allowed = new Set([
      "src/components/project-gallery.tsx",
      "src/components/project-gallery.module.css",
      "src/app/proiecte/page.tsx",
      "src/app/proiecte/projects-page.module.css",
    ]);
    for (const [file, hash] of Object.entries(baseline.hashes)) {
      const current = createHash("sha256")
        .update(await readFile(file))
        .digest("hex");
      if (current !== hash) {
        report.sources.push(file);
        assert.ok(
          allowed.has(file),
          `${file} stays outside this page's redesign`,
        );
      }
    }
    const protectedPage = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    for (const [route, name, fullPage] of [
      ["/", "home-hero", false],
      ["/servicii", "services", true],
      ["/studio", "studio", true],
      ["/contact", "contact", true],
    ]) {
      await protectedPage.goto(base + route, { waitUntil: "networkidle" });
      await protectedPage.evaluate(() => document.fonts.ready);
      const current = await protectedPage.screenshot({
        path: `artifacts/project-stack-protected-${name}-after.png`,
        fullPage,
      });
      assert.ok(
        (await sharp(current).raw().toBuffer()).equals(
          await sharp(`artifacts/project-stack-baseline-${name}.png`)
            .raw()
            .toBuffer(),
        ),
        `${name} remains pixel-identical`,
      );
      report.protected.push(name);
    }
    await protectedPage.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS vertical project stack: complete holds, opaque rising panels, stable images, reversal/pause/wheel, fixed project URLs and visible keyboard focus, responsive/reduced/no-JS/load fallback, real destinations and static fallbacks.",
  );
} finally {
  await writeFile(
    "artifacts/project-stack-verification.json",
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
