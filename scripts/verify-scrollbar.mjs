import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, firefox, webkit } from "@playwright/test";

const base = process.env.SITE_URL || "http://127.0.0.1:3000";
const routes = ["/", "/proiecte", "/servicii", "/studio", "/contact"];
const classicScrollbar = [
  "--disable-features=OverlayScrollbar,OverlayScrollbars,FluentOverlayScrollbar,FluentScrollbar",
];
const report = {
  browsers: [],
  routes: [],
  contact: [],
  mobile: [],
  nativeDrag: [],
  overlay: [],
};
await mkdir("artifacts", { recursive: true });

function readRoot() {
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const body = getComputedStyle(document.body);
  const visibleNested = [...document.querySelectorAll("body *")]
    .filter((node) => {
      const box = node.getBoundingClientRect();
      const overflow = getComputedStyle(node).overflowY;
      return (
        box.width > 0 &&
        box.height > 0 &&
        ["auto", "scroll"].includes(overflow) &&
        node.scrollHeight > node.clientHeight + 2
      );
    })
    .map((node) => ({
      tag: node.tagName,
      id: node.id,
      color: getComputedStyle(node).scrollbarColor,
    }));
  return {
    owner: document.scrollingElement.tagName,
    color: style.scrollbarColor,
    width: style.scrollbarWidth,
    classic: root.hasAttribute("data-classic-scrollbar"),
    nativeSize: style.getPropertyValue("--native-scrollbar-size").trim(),
    nativeThumb: {
      color: getComputedStyle(root, "::-webkit-scrollbar-thumb")
        .backgroundColor,
      radius: getComputedStyle(root, "::-webkit-scrollbar-thumb").borderRadius,
      border: getComputedStyle(root, "::-webkit-scrollbar-thumb").borderWidth,
    },
    nativeTrack: getComputedStyle(root, "::-webkit-scrollbar-track")
      .backgroundColor,
    nativeWidth: getComputedStyle(root, "::-webkit-scrollbar").width,
    gutter: style.scrollbarGutter,
    bodyColor: body.scrollbarColor,
    menuColor: getComputedStyle(document.querySelector("#site-menu"))
      .scrollbarColor,
    bodyOverflow: body.overflowY,
    htmlWidth: root.getBoundingClientRect().width,
    bodyWidth: document.body.getBoundingClientRect().width,
    clientWidth: root.clientWidth,
    viewportWidth: innerWidth,
    horizontalOverflow: root.scrollWidth > innerWidth,
    y: scrollY,
    maxY: root.scrollHeight - innerHeight,
    nested: visibleNested,
  };
}

async function position(page, top) {
  await page.evaluate((value) => {
    window.dispatchEvent(
      new CustomEvent("codelab:scroll-to", { detail: { top: value } }),
    );
  }, top);
  await page.waitForTimeout(80);
}

async function settledNativeScroll(page) {
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        let previous = scrollY;
        let stable = 0;
        const sample = () => {
          setTimeout(() => {
            const current = scrollY;
            stable = Math.abs(current - previous) < 0.5 ? stable + 1 : 0;
            previous = current;
            if (stable >= 4) resolve();
            else sample();
          }, 80);
        };
        sample();
      }),
  );
}

async function assertMenu(page, before, label) {
  await page
    .getByRole("button", { name: "Deschide meniul", exact: true })
    .click();
  await page.waitForTimeout(700);
  assert.equal(
    await page
      .locator(".menu-mechanism")
      .evaluate((node) => node.matches('[data-menu-modal][aria-modal="true"]')),
    true,
    `${label}: the menu assembly exposes its active modal state`,
  );
  assert.equal(
    await page
      .locator(".side-menu")
      .evaluate((node) => !node.hidden && !node.inert),
    true,
    `${label}: the actual panel is visible and interactive`,
  );
  if (before.classic)
    assert.equal(
      await page
        .locator("html")
        .evaluate((node) => getComputedStyle(node).backgroundColor),
      "rgb(24, 25, 23)",
      `${label}: the open menu keeps the classic viewport gutter on ink`,
    );
  const open = await page.evaluate(readRoot);
  assert.equal(
    open.htmlWidth,
    before.htmlWidth,
    `${label}: gutter stays reserved`,
  );
  assert.equal(
    open.bodyWidth,
    before.bodyWidth,
    `${label}: page width stays stable`,
  );
  assert.equal(
    open.menuColor,
    "auto",
    `${label}: menu keeps its own native colors`,
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(700);
  assert.equal(
    await page
      .locator(".menu-mechanism")
      .evaluate((node) => node.hasAttribute("data-menu-modal")),
    false,
    `${label}: closing releases the modal assembly`,
  );
  assert.equal(
    await page
      .locator(".side-menu")
      .evaluate((node) => node.hidden && node.inert),
    true,
    `${label}: the closed panel is hidden and inert`,
  );
  const closed = await page.evaluate(readRoot);
  assert.equal(
    closed.htmlWidth,
    before.htmlWidth,
    `${label}: no closing width jump`,
  );
  assert.ok(
    Math.abs(closed.y - before.y) < 2,
    `${label}: menu preserves scroll`,
  );
}

async function contactChecks(page, channel) {
  const message = page.locator("#contact-message");
  await message.fill(
    Array.from({ length: 100 }, (_, i) => `Example line ${i + 1}.`).join("\n"),
  );
  const field = await message.evaluate((node) => ({
    color: getComputedStyle(node).scrollbarColor,
    width: getComputedStyle(node).scrollbarWidth,
    overflow: getComputedStyle(node).overflowY,
    height: node.clientHeight,
    contentHeight: node.scrollHeight,
  }));
  assert.equal(field.color, "auto");
  assert.equal(field.width, "auto");
  assert.ok(field.contentHeight > field.height + 100);
  await message.focus();
  await message.evaluate((node) => {
    node.scrollTop = 0;
  });
  await page.keyboard.press("PageDown");
  await page.waitForTimeout(300);
  assert.ok(
    await message.evaluate((node) => node.scrollTop > 0),
    "textarea scroll remains native",
  );

  const budget = page.locator("#contact-budget");
  await budget.click();
  const list = page.getByRole("listbox");
  await list.waitFor({ state: "visible" });
  const popup = await list.evaluate((node) => ({
    color: getComputedStyle(node).scrollbarColor,
    width: getComputedStyle(node).scrollbarWidth,
  }));
  assert.equal(popup.color, "auto");
  assert.equal(popup.width, "auto");
  await page.keyboard.press("Escape");

  await page.locator('input[name="service"]').first().check();
  await page.locator("#contact-name").fill("Scrollbar check");
  await page.locator("#contact-email").fill("qa@example.test");
  await page.locator('#contact-form button[type="submit"]').click();
  await page.locator(".brief-ready").waitFor({ state: "visible" });
  const result = await page.locator(".brief-result-text").evaluate((node) => ({
    color: getComputedStyle(node).scrollbarColor,
    width: getComputedStyle(node).scrollbarWidth,
    height: node.clientHeight,
    contentHeight: node.scrollHeight,
  }));
  assert.equal(result.color, "auto");
  assert.equal(result.width, "auto");
  assert.ok(result.contentHeight > result.height);
  report.contact.push({ channel, field, popup, result });
}

async function desktop(browser, channel) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of routes) {
    await page.goto(base + route, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1100);
    const initial = await page.evaluate(readRoot);
    assert.equal(initial.owner, "HTML");
    if (initial.classic) {
      assert.equal(
        initial.color,
        "auto",
        "explicit classic WebKit branch owns coloring",
      );
      assert.equal(initial.nativeThumb.color, "rgb(198, 62, 36)");
      assert.equal(initial.nativeTrack, "rgb(24, 25, 23)");
      assert.ok(parseFloat(initial.nativeWidth) >= 10);
      assert.equal(
        parseFloat(initial.nativeWidth),
        parseFloat(initial.nativeSize),
      );
      assert.ok(parseFloat(initial.nativeThumb.radius) > 0);
      assert.ok(parseFloat(initial.nativeThumb.border) >= 2);
    } else {
      assert.equal(initial.color, "rgb(198, 62, 36) rgb(24, 25, 23)");
    }
    assert.equal(
      initial.width,
      "auto",
      "comfortable system scrollbar width retained",
    );
    assert.equal(initial.gutter, "stable");
    assert.equal(
      initial.bodyColor,
      "auto",
      "root color does not leak through body",
    );
    assert.equal(initial.horizontalOverflow, false);
    assert.equal(
      initial.nested.length,
      0,
      "no competing page scroll container",
    );
    await assertMenu(page, initial, `${channel}${route}`);

    await page.mouse.move(600, 400);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(1300);
    const wheel = await page.evaluate(readRoot);
    assert.ok(wheel.y > 100, `${channel}${route}: wheel scrolls the real root`);
    await page.evaluate(() => document.activeElement?.blur());
    await page.keyboard.press("PageDown");
    await page.waitForTimeout(600);
    const keyboard = await page.evaluate(readRoot);
    assert.ok(keyboard.y > wheel.y + 50, `${channel}${route}: PageDown works`);
    await page.keyboard.press("End");
    await page.waitForTimeout(650);
    const end = await page.evaluate(readRoot);
    assert.ok(
      Math.abs(end.y - end.maxY) < 3,
      `${channel}${route}: End reaches page end`,
    );
    await page.keyboard.press("Home");
    await page.waitForTimeout(650);
    assert.ok(
      (await page.evaluate(readRoot)).y < 3,
      `${channel}${route}: Home returns to top`,
    );

    let animation = null;
    if (route === "/") {
      const top = await page
        .locator(".showcase-section")
        .evaluate((node) => node.getBoundingClientRect().top + scrollY);
      await position(page, top - 500);
      animation = await page.evaluate(() => ({
        radius: parseFloat(
          getComputedStyle(document.querySelector(".showcase-section"))
            .borderTopLeftRadius,
        ),
        letterScale: new DOMMatrix(
          getComputedStyle(document.querySelectorAll(".identity-stretch")[3])
            .transform,
        ).d,
        mediaOpacity: getComputedStyle(
          document.querySelector(".home-work-media .project-media"),
        ).opacity,
      }));
      assert.ok(animation.radius > 5 && animation.radius < 24);
      assert.ok(animation.letterScale > 1 && animation.letterScale < 1.44);
      assert.equal(animation.mediaOpacity, "1");
    } else if (route === "/proiecte") {
      await page.waitForFunction(
        () =>
          document.querySelector("[data-project-gallery]")?.dataset.enhanced ===
          "true",
      );
      await page.mouse.move(600, 400);
      await page.mouse.wheel(0, 900);
      await page.waitForTimeout(1300);
      animation = await page.evaluate(() => ({
        panels: [...document.querySelectorAll("[data-gallery-project]")].map(
          (node) => ({
            slug: node.dataset.galleryProject,
            top: node.getBoundingClientRect().top,
            imageClip: getComputedStyle(node.querySelector(".project-media"))
              .clipPath,
          }),
        ),
        y: scrollY,
      }));
      assert.equal(animation.panels.length, 2);
      assert.ok(animation.y > 100);
      assert.ok(animation.panels.every((panel) => panel.imageClip === "none"));
    }
    await position(page, 0);
    if (channel === "msedge") {
      await page.screenshot({
        path: `artifacts/scrollbar-${route === "/" ? "home" : route.slice(1)}-desktop.png`,
      });
    }
    report.routes.push({
      channel,
      route,
      initial,
      wheelY: wheel.y,
      keyboardY: keyboard.y,
      endY: end.y,
      animation,
    });
    console.log(
      `${channel} ${route}: colors, root scroll, keyboard, menu, layout PASS`,
    );
    if (route === "/contact") await contactChecks(page, channel);
  }
  assert.deepEqual(errors, []);
  await page.close();
}

async function mobile(browser, channel) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const session = await context.newCDPSession(page);
  for (const route of routes) {
    await page.goto(base + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    const initial = await page.evaluate(readRoot);
    assert.equal(
      initial.color,
      "auto",
      "mobile retains system scrollbar colors",
    );
    assert.equal(initial.width, "auto");
    assert.equal(
      initial.classic,
      false,
      "mobile does not acquire classic desktop styling",
    );
    assert.equal(initial.horizontalOverflow, false);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 190, y: 690 }],
    });
    for (const y of [620, 550, 480, 410, 340]) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 190, y }],
      });
      await page.waitForTimeout(20);
    }
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    // Let the browser's real touch momentum settle before comparing menu
    // geometry/position; opening during momentum is a different interaction.
    await settledNativeScroll(page);
    const touched = await page.evaluate(readRoot);
    assert.ok(touched.y > 100, `${channel}${route}: native touch scroll works`);
    await assertMenu(page, touched, `${channel} mobile ${route}`);
    report.mobile.push({ channel, route, color: initial.color, y: touched.y });
  }
  if (channel === "msedge")
    await page.screenshot({ path: "artifacts/scrollbar-contact-mobile.png" });
  await context.close();
}

async function forcedColors(browser, channel) {
  const page = await browser.newPage({ forcedColors: "active" });
  await page.goto(base + "/", { waitUntil: "networkidle" });
  const result = await page.evaluate(readRoot);
  assert.equal(
    result.color,
    "auto",
    "high contrast retains system scrollbar colors",
  );
  assert.equal(result.width, "auto");
  assert.equal(result.classic, false);
  report.browsers.find((entry) => entry.channel === channel).forcedColors =
    result.color;
  await page.close();
}

async function nativeDrag(channel) {
  const browser = await chromium.launch({
    channel,
    headless: false,
    args: [...classicScrollbar, "--window-position=-32000,-32000"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    await page.goto(base + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const before = await page.evaluate(readRoot);
    const gutter = before.viewportWidth - before.clientWidth;
    assert.ok(
      gutter >= 10,
      "native system scrollbar has a usable mouse target",
    );
    await page.mouse.move(before.viewportWidth - gutter / 2, 65);
    await page.mouse.down();
    await page.mouse.move(before.viewportWidth - gutter / 2, 470, {
      steps: 15,
    });
    await page.mouse.up();
    await page.waitForTimeout(400);
    const after = await page.evaluate(readRoot);
    assert.ok(
      after.y > before.y + 500,
      "dragging native thumb scrolls actual document",
    );
    assert.equal(after.htmlWidth, before.htmlWidth);
    await page.screenshot({
      path: `artifacts/scrollbar-${channel}-native-drag.png`,
    });
    report.nativeDrag.push({ channel, gutter, from: before.y, to: after.y });
  } finally {
    await browser.close();
  }
}

async function overlayScrollbar(channel) {
  const browser = await chromium.launch({
    channel,
    headless: false,
    args: [
      "--window-position=-32000,-32000",
      "--enable-features=OverlayScrollbar,OverlayScrollbars,FluentOverlayScrollbar",
    ],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    await page.goto(base + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    const initial = await page.evaluate(readRoot);
    assert.equal(
      initial.viewportWidth - initial.htmlWidth,
      0,
      "browser really uses an overlay scrollbar",
    );
    assert.equal(initial.classic, false);
    assert.equal(initial.color, "auto", "overlay colors stay system-owned");
    assert.equal(initial.width, "auto");
    assert.equal(initial.nativeSize, "");
    await page.mouse.move(500, 400);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(1300);
    const moved = await page.evaluate(readRoot);
    assert.ok(moved.y > 100);
    assert.equal(moved.classic, false);
    await assertMenu(page, moved, `${channel} overlay`);
    await page.setViewportSize({ width: 1250, height: 850 });
    await page.waitForTimeout(200);
    const resized = await page.evaluate(readRoot);
    assert.equal(resized.classic, false);
    assert.equal(resized.color, "auto");
    report.overlay.push({ channel, initial, resized });
  } finally {
    await browser.close();
  }
}

try {
  for (const channel of ["msedge", "chrome"]) {
    const browser = await chromium.launch({
      channel,
      headless: true,
      args: classicScrollbar,
    });
    report.browsers.push({
      channel,
      available: true,
      version: browser.version(),
    });
    try {
      await desktop(browser, channel);
      await mobile(browser, channel);
      await forcedColors(browser, channel);
    } finally {
      await browser.close();
    }
    await nativeDrag(channel);
    await overlayScrollbar(channel);
  }
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
    ["webkit", webkit],
  ]) {
    try {
      const browser = await engine.launch({ headless: true });
      report.browsers.push({
        channel: name,
        available: true,
        version: browser.version(),
      });
      await browser.close();
    } catch (error) {
      report.browsers.push({
        channel: name,
        available: false,
        reason: error.message.split("\n")[0],
      });
    }
  }
  console.log(
    "Native scrollbar checks PASS (Edge + Chrome; desktop, touch emulation and forced colors).",
  );
} finally {
  await writeFile(
    "artifacts/scrollbar-verification.json",
    JSON.stringify(report, null, 2),
  );
}
