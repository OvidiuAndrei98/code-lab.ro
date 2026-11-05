import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = process.env.SITE_URL || "http://127.0.0.1:3000";
const baseline = JSON.parse(
  await readFile("artifacts/menu-interior-before-geometry.json", "utf8"),
);
const report = { layouts: [], motion: [], navigation: [], errors: [] };
const near = (a, b, message, tolerance = 0.15) =>
  assert.ok(Math.abs(a - b) <= tolerance, `${message}: ${a} / ${b}`);

function read() {
  const get = (selector) => document.querySelector(selector);
  const box = (node) => {
    const rect = node.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      right: rect.right,
      bottom: rect.bottom,
    };
  };
  const mechanism = get(".menu-mechanism"),
    tab = get(".menu-tab"),
    face = get(".menu-tab-face"),
    icon = get(".menu-tab-icon"),
    stage = get(".site-stage"),
    panel = get("#site-menu"),
    logo = get(".site-header .logo");
  const rect = box(icon),
    logoRect = box(logo),
    nav = box(get(".header-nav"));
  return {
    time: performance.now(),
    phase: window.__tabPhase || "idle",
    scroll: scrollY,
    width: innerWidth,
    height: innerHeight,
    dpr: devicePixelRatio,
    stageTravel: new DOMMatrix(getComputedStyle(stage).transform).e,
    menuTravel: new DOMMatrix(getComputedStyle(mechanism).transform).e,
    tabOverlap:
      parseFloat(
        getComputedStyle(tab).getPropertyValue("--menu-tab-overlap"),
      ) || 0,
    rootWidth: document.documentElement.getBoundingClientRect().width,
    overflow: document.documentElement.scrollWidth > innerWidth,
    sameButton: tab === window.__originalMenuTab,
    buttonCount: mechanism.querySelectorAll("button").length,
    oldControls: document.querySelectorAll(".menu-trigger,.menu-close").length,
    modal: mechanism.hasAttribute("data-menu-modal"),
    role: mechanism.getAttribute("role"),
    ariaModal: mechanism.getAttribute("aria-modal"),
    expanded: tab.getAttribute("aria-expanded"),
    label: tab.getAttribute("aria-label"),
    panelHidden: panel.hidden,
    panelInert: panel.inert,
    stageInert: stage.inert,
    skipInert: get(".skip-link").inert,
    bodyOverflow: getComputedStyle(document.body).overflow,
    focused: document.activeElement === tab,
    focusVisible: tab.matches(":focus-visible"),
    outline: getComputedStyle(tab).outlineWidth,
    shadow: getComputedStyle(tab).boxShadow,
    faceFill: getComputedStyle(face).fill,
    iconColor: getComputedStyle(icon).stroke,
    activeHref: document.activeElement.getAttribute("href"),
    mechanism: box(mechanism),
    stage: box(stage),
    panel: box(panel),
    tab: box(tab),
    face: box(face),
    icon: rect,
    iconCenter: (() => {
      const point = new DOMPoint(40, 25.5).matrixTransform(
        get(".menu-tab-graphic").getScreenCTM(),
      );
      return { x: point.x, y: point.y };
    })(),
    logoCenter: logoRect.y + logoRect.height / 2,
    navCenter: nav.height ? nav.y + nav.height / 2 : null,
    clip: getComputedStyle(face).clipPath,
    heroY: get(".identity-section")?.getBoundingClientRect().y,
    words: [...panel.querySelectorAll(".menu-word-enter")].map((word) => {
      const matrix = new DOMMatrix(getComputedStyle(word).transform);
      return {
        y: matrix.f,
        height: word.getBoundingClientRect().height,
        scaleX: matrix.a,
        scaleY: matrix.d,
        filter: getComputedStyle(word).filter,
      };
    }),
    lines: [...get(".menu-tab-graphic").querySelectorAll("line")].map(
      (line) => {
        const matrix = get(".menu-tab-graphic")
          .getScreenCTM()
          .inverse()
          .multiply(line.getScreenCTM());
        const a = new DOMPoint(
          +line.getAttribute("x1"),
          +line.getAttribute("y1"),
        ).matrixTransform(matrix);
        const b = new DOMPoint(
          +line.getAttribute("x2"),
          +line.getAttribute("y2"),
        ).matrixTransform(matrix);
        return {
          x1: a.x,
          x2: b.x,
          y1: a.y,
          y2: b.y,
          opacity: +getComputedStyle(line).opacity,
          stroke: getComputedStyle(line).strokeWidth,
        };
      },
    ),
  };
}

async function openPage(
  browser,
  viewport,
  touch = false,
  reducedMotion = "no-preference",
  route = "/",
) {
  const context = await browser.newContext({
    viewport,
    isMobile: touch,
    hasTouch: touch,
    reducedMotion,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => report.errors.push(error.message));
  await page.goto(base + route, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    window.__originalMenuTab = document.querySelector(".menu-tab");
  });
  return { context, page };
}

async function closed(page) {
  await page.waitForFunction(
    () =>
      !document
        .querySelector(".menu-mechanism")
        .hasAttribute("data-menu-modal"),
  );
  await expect(page.locator(".menu-tab")).toHaveAccessibleName(
    "Deschide meniul",
  );
}

async function opened(page, wait = 600) {
  await page.waitForFunction(
    () =>
      document.querySelector(".menu-mechanism").getAttribute("role") ===
      "dialog",
  );
  if (wait) await page.waitForTimeout(wait);
  await expect(page.locator(".menu-tab")).toHaveAccessibleName(
    "Închide meniul",
  );
}

function geometry(state, axis = null) {
  assert.equal(state.sameButton, true);
  assert.equal(state.buttonCount, 1);
  assert.equal(state.oldControls, 0);
  assert.equal(state.overflow, false);
  for (const travel of [state.stageTravel, state.menuTravel])
    near(
      travel * state.dpr,
      Math.round(travel * state.dpr),
      "Menu/page translation follows the physical pixel grid",
      0.0005,
    );
  assert.ok(state.tab.width >= 44 && state.tab.height >= 44);
  assert.ok(
    state.tab.x >= -0.5 && state.tab.right <= state.rootWidth + 0.5,
    "The entire44px hit rectangle stays on screen",
  );
  assert.ok(
    state.face.x >= -0.5 && state.face.right <= state.rootWidth + 0.5,
    "The whole tab face remains within the useful viewport",
  );
  near(
    state.face.y + (state.face.width * 25.5) / 72,
    state.iconCenter.y,
    "SVG (40,25.5) stays on the icon/header axis",
  );
  assert.ok(state.face.y >= 4, "The larger face retains a small top gap");
  near(state.face.width, state.width <= 700 ? 44 : 52, "Responsive face width");
  near(
    state.face.height,
    (state.face.width * 116) / 72,
    "The face keeps its taller upper cap in the 72:116 profile",
  );
  assert.equal(state.shadow, "none", "The hit rectangle draws no shadow ring");
  for (const line of state.lines.filter((line) => line.opacity > 0.01)) {
    for (const [x, y] of [
      [line.x1, line.y1],
      [line.x2, line.y2],
    ]) {
      assert.ok(
        x > 6.125 && x < 65.875 && y > 6.125 && x + 44 - y > 8.9,
        "Each visible stroke stays inside the clean silhouette during its morph",
      );
    }
  }
  if (state.focusVisible) {
    assert.equal(state.outline, "0px");
    assert.equal(
      state.faceFill,
      "rgb(24, 25, 23)",
      "Keyboard focus changes the filled silhouette without a frame",
    );
  }
  if (axis !== null)
    near(state.iconCenter.y, axis, "Icon follows the approved header axis");
  if (state.modal) {
    assert.equal(state.role, "dialog");
    assert.equal(state.ariaModal, "true");
    assert.equal(state.panelHidden, false);
    assert.equal(state.stageInert, true);
    assert.equal(state.skipInert, true);
    assert.equal(state.bodyOverflow, "clip");
    near(
      state.panel.x,
      state.mechanism.x,
      "Panel starts at the mechanism seam",
    );
    assert.ok(
      state.face.right >= state.panel.x - 0.5,
      "There is no gap between tab and panel",
    );
    if (state.tabOverlap < 0.001)
      near(
        state.face.right,
        state.panel.x,
        "The tab face does not overlap the panel when there is enough room",
      );
  } else {
    assert.equal(
      state.role,
      null,
      "Closed control is not announced as a dialog",
    );
    assert.equal(state.panelHidden, true);
    assert.equal(state.panelInert, true);
    assert.equal(state.stageInert, false);
    assert.equal(state.skipInert, false);
  }
}

async function sample(page, phase) {
  await page.evaluate(
    ({ source, phase }) => {
      const snapshot = new Function(`return (${source})`)();
      window.__tabPhase = phase;
      window.__tabFrames = [];
      window.__tabRecording = true;
      const tick = () => {
        window.__tabFrames.push(snapshot());
        if (window.__tabRecording) requestAnimationFrame(tick);
      };
      tick();
    },
    { source: read.toString(), phase },
  );
}

async function stopSampling(page) {
  return page.evaluate(() => {
    window.__tabRecording = false;
    return window.__tabFrames;
  });
}

try {
  for (const channel of ["msedge", "chrome"]) {
    const browser = await chromium.launch({ channel, headless: true });
    try {
      const profiles =
        channel === "msedge"
          ? [
              [1440, 1000, false],
              [1920, 1080, false],
              [1024, 768, false],
              [768, 1024, true],
              [390, 844, true],
              [320, 568, true],
              [844, 390, true],
              [1440, 420, false],
              [320, 568, false],
            ]
          : [
              [1440, 1000, false],
              [390, 844, true],
              [320, 568, false],
            ];
      for (const [width, height, touch] of profiles) {
        const { context, page } = await openPage(
          browser,
          { width, height },
          touch,
        );
        const start = await page.evaluate(read);
        geometry(start, height && (width <= 800 ? 40 : 45));
        assert.equal(
          await page
            .locator(".menu-tab-face")
            .evaluate((node) => getComputedStyle(node).userSelect),
          "none",
        );
        assert.equal(
          await page.locator(".menu-tab-face").evaluate((node) => {
            const event = new DragEvent("dragstart", {
              bubbles: true,
              cancelable: true,
            });
            node.dispatchEvent(event);
            return event.defaultPrevented;
          }),
          true,
          "Dragging the tab is prevented",
        );
        if (start.navCenter !== null)
          near(
            start.navCenter,
            start.iconCenter.y,
            "Header links and icon share the same axis",
          );
        assert.equal(
          await page.locator("#site-menu").getByRole("link").count(),
          0,
        );
        near(
          start.lines[0].x2,
          start.lines[1].x2,
          "Burger right endpoints align",
        );
        assert.equal(start.lines.length, 3);
        start.lines.forEach((line, i) =>
          near(
            line.x2 - line.x1,
            [45, 30, 15][i],
            "The lower bars keep their refined descending lengths",
          ),
        );
        assert.equal(new Set(start.lines.map((line) => line.stroke)).size, 1);
        if (channel === "msedge" && [1440, 390, 320].includes(width))
          await page.screenshot({
            path: `artifacts/menu-tab-closed-${width}-${touch ? "touch" : "classic"}.png`,
          });
        const point = start.iconCenter;
        if (touch) {
          const session = await context.newCDPSession(page);
          await session.send("Input.dispatchTouchEvent", {
            type: "touchStart",
            touchPoints: [point],
          });
          await page.waitForTimeout(65);
          const held = await page.evaluate(read);
          near(
            held.mechanism.x,
            start.mechanism.x,
            "Touch start does not move the control",
          );
          assert.equal(held.modal, false);
          await session.send("Input.dispatchTouchEvent", {
            type: "touchEnd",
            touchPoints: [],
          });
          await session.detach();
        } else {
          await page.mouse.move(point.x, point.y);
          await page.mouse.down();
          await page.waitForTimeout(65);
          const held = await page.evaluate(read);
          near(
            held.mechanism.x,
            start.mechanism.x,
            "Pointer down does not move the control",
          );
          assert.equal(held.modal, false);
          await page.mouse.up();
        }
        await opened(page);
        const full = await page.evaluate(read);
        geometry(full, start.iconCenter.y);
        for (const [label, href] of [
          ["Acasă", "/"],
          ["Proiecte", "/proiecte"],
          ["Servicii", "/servicii"],
          ["Studio", "/studio"],
          ["Contact", "/contact"],
        ]) {
          const link = page
            .locator("#site-menu nav")
            .getByRole("link", { name: label, exact: true });
          await expect(link).toHaveAccessibleName(label);
          await expect(link).toHaveAttribute("href", href);
        }
        const content = page.locator("#site-menu .menu-content");
        if (
          await content.evaluate(
            (node) => node.scrollHeight > node.clientHeight + 2,
          )
        ) {
          const bounds = await content.boundingBox();
          if (touch) {
            const session = await context.newCDPSession(page);
            const x = Math.round(bounds.x + bounds.width / 2),
              y = Math.round(bounds.y + bounds.height - 20);
            await session.send("Input.dispatchTouchEvent", {
              type: "touchStart",
              touchPoints: [{ x, y }],
            });
            for (let n = 1; n <= 8; n++) {
              await session.send("Input.dispatchTouchEvent", {
                type: "touchMove",
                touchPoints: [{ x, y: y - 14 * n }],
              });
              await page.waitForTimeout(25);
            }
            await session.send("Input.dispatchTouchEvent", {
              type: "touchEnd",
              touchPoints: [],
            });
            await session.detach();
            await page.waitForTimeout(150);
          } else {
            await content.hover();
            await page.mouse.wheel(0, 400);
            await page.waitForTimeout(100);
          }
          assert.ok(
            await content.evaluate((node) => node.scrollTop > 0),
            "Short-screen content scrolls using native input",
          );
          await page.locator('#site-menu a[href="/contact"]').focus();
          near(
            (await page.evaluate(read)).scroll,
            start.scroll,
            "Inner scrolling does not move the page",
          );
          full.innerScrollVerified = true;
        }
        const old = baseline.find(
          (item) =>
            item.width === width &&
            item.height === height &&
            (touch || width > 844),
        );
        if (old && width > 700) {
          near(full.panel.width, old.menuWidth, "Panel width stays approved");
          near(full.stage.x, old.stageX, "Page push stays approved");
        }
        if (width <= 700) {
          near(
            full.panel.width,
            Math.min(width * 0.88, full.rootWidth - 44 - 12),
            "Mobile panel reserves the full face",
            0.5,
          );
          near(full.face.right, full.panel.x, "No mobile overlap or gap");
          assert.ok(
            full.face.x >= 11.4,
            "The full mobile face has breathing room at the viewport edge",
          );
        }
        [full.lines[0], full.lines[2]].forEach((line, i) => {
          near((line.x1 + line.x2) / 2, 40, "X arms share horizontal center");
          near((line.y1 + line.y2) / 2, 25.5, "X arms share vertical center");
          near(
            Math.hypot(line.x2 - line.x1, line.y2 - line.y1),
            36,
            "X arms have equal length",
          );
          near(
            (Math.atan2(line.y2 - line.y1, line.x2 - line.x1) * 180) / Math.PI,
            i ? -45 : 45,
            "X diagonals are symmetric",
          );
          near(line.opacity, 1, "Both original strokes remain visible");
        });
        near(full.lines[1].opacity, 0, "The middle stroke disappears");
        const hit = await page.evaluate(() => {
          const b = document.querySelector(".menu-tab").getBoundingClientRect();
          return Boolean(
            document
              .elementFromPoint(b.right - 2, b.top + 22)
              ?.closest(".menu-tab"),
          );
        });
        assert.equal(
          hit,
          true,
          "The full44px hit area remains interactive above the backdrop",
        );
        if (channel === "msedge" && [1440, 390, 320].includes(width))
          await page.screenshot({
            path: `artifacts/menu-tab-open-${width}-${touch ? "touch" : "classic"}.png`,
          });
        await page.locator(".menu-tab").focus();
        await page.keyboard.press("Shift+Tab");
        await expect(
          page.locator('#site-menu a[href="/contact"]'),
        ).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(page.locator(".menu-tab")).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(page.locator('#site-menu a[href="/"]')).toBeFocused();
        await page.keyboard.press("Escape");
        await closed(page);
        await expect(page.locator(".menu-tab")).toBeFocused();
        geometry(await page.evaluate(read), start.iconCenter.y);
        await page.locator(".menu-tab").click();
        await opened(page);
        assert.equal(
          await content.evaluate((node) => node.scrollTop),
          0,
          "A fresh opening starts at the first destination",
        );
        await page.locator(".menu-tab").click();
        await closed(page);
        if (
          channel === "msedge" &&
          ((width === 1440 && height === 1000) || width === 390)
        ) {
          for (const shouldOpen of [true, false]) {
            const current = await page.evaluate(read);
            const point = {
              x: current.face.right - current.face.width / 8,
              y: current.face.bottom - current.face.width / 4,
            };
            if (touch) {
              const session = await context.newCDPSession(page);
              await session.send("Input.dispatchTouchEvent", {
                type: "touchStart",
                touchPoints: [point],
              });
              await page.waitForTimeout(60);
              const held = await page.evaluate(read);
              near(
                held.mechanism.x,
                current.mechanism.x,
                "The exposed tail stays still until confirmed touch",
              );
              assert.equal(held.modal, current.modal);
              await session.send("Input.dispatchTouchEvent", {
                type: "touchEnd",
                touchPoints: [],
              });
              await session.detach();
            } else {
              await page.mouse.move(point.x, point.y);
              await page.mouse.down();
              await page.waitForTimeout(60);
              const held = await page.evaluate(read);
              near(
                held.mechanism.x,
                current.mechanism.x,
                "The exposed tail stays still until confirmed click",
              );
              assert.equal(held.modal, current.modal);
              await page.mouse.up();
            }
            if (shouldOpen) await opened(page);
            else await closed(page);
            assert.equal(
              (await page.evaluate(read)).modal,
              shouldOpen,
              "One click on the exposed tail toggles exactly once",
            );
          }
          full.tailHitVerified = true;
        }
        report.layouts.push({ channel, width, height, touch, start, full });
        await context.close();
      }

      const { context, page } = await openPage(browser, {
        width: 1440,
        height: 1000,
      });
      await page.evaluate(() =>
        window.dispatchEvent(
          new CustomEvent("codelab:scroll-to", { detail: { top: 200 } }),
        ),
      );
      await page.waitForTimeout(80);
      const initial = await page.evaluate(read);
      geometry(initial, 45);
      await page.locator(".menu-tab").focus();
      await sample(page, "opening");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(90);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(40);
      await page.keyboard.press("Enter");
      await opened(page);
      await page.mouse.move(10, 300);
      await page.mouse.wheel(0, 500);
      await page.keyboard.press("PageDown");
      await page.waitForTimeout(80);
      await page.keyboard.press("Escape");
      await closed(page);
      const frames = await stopSampling(page);
      assert.ok(frames.length > 50);
      for (const frame of frames) {
        geometry(frame, 45);
        near(
          frame.scroll,
          200,
          "The background stays at its real reading position",
        );
        near(frame.heroY, initial.heroY, "Sticky hero does not jump");
        near(
          frame.iconCenter.x - frame.face.x,
          initial.iconCenter.x - initial.face.x,
          "Icon center remains fixed within the face",
        );
        near(
          frame.iconCenter.y - frame.face.y,
          initial.iconCenter.y - initial.face.y,
          "Icon center remains fixed within the face",
        );
        near(frame.face.width, initial.face.width, "Face width is rigid");
        near(frame.face.height, initial.face.height, "Face height is rigid");
        assert.equal(frame.clip, initial.clip);
        if (frame.modal)
          near(
            frame.panel.x,
            frame.stage.right,
            "Panel and page move together",
          );
        for (const word of frame.words) {
          near(word.scaleX, 1, "Reveal does not stretch the words");
          near(word.scaleY, 1, "Reveal does not stretch the words");
          assert.equal(word.filter, "none");
        }
      }
      assert.ok(
        frames.some(
          (frame) =>
            frame.modal &&
            frame.stage.x < -5 &&
            frame.stage.x > -480 &&
            frame.words[0].y > 0.1 &&
            frame.words[0].y < frame.words[0].height,
        ),
        "Word reveal overlaps the panel push",
      );
      assert.ok(
        frames.some(
          (frame) => frame.modal && frame.words[0].y < frame.words[4].y - 2,
        ),
        "The existing top-to-bottom word stagger is retained",
      );
      assert.ok(
        frames.some(
          (frame) => frame.modal && frame.stage.x < -20 && frame.stage.x > -480,
        ),
        "Intermediate opening/closing frames were observed",
      );
      await page.locator(".menu-tab").click();
      await opened(page);
      const hoverLink = page.locator('#site-menu a[href="/proiecte"]');
      const hoverBefore = await hoverLink.boundingBox();
      await hoverLink.hover();
      for (let prefix = 0; prefix < 8; prefix++) {
        const order = await hoverLink.evaluate(
          (link, time) => {
            const chars = [...link.querySelectorAll("[data-footer-character]")];
            for (const char of chars) {
              const a = char.getAnimations()[0];
              a.pause();
              a.currentTime = time;
            }
            return chars
              .map((node, index) => ({
                index,
                x: node.getBoundingClientRect().x,
              }))
              .sort((a, b) => a.x - b.x)
              .map((v) => v.index);
          },
          40 + prefix * 30 - (prefix === 7 ? 0.01 : 0),
        );
        assert.deepEqual(
          order,
          [
            ...Array(prefix).keys(),
            ...Array.from({ length: 8 - prefix }, (_, i) => 7 - i),
          ],
          "The approved footer-style hover sequence is preserved",
        );
      }
      assert.deepEqual(await hoverLink.boundingBox(), hoverBefore);
      await expect(hoverLink).toHaveAccessibleName("Proiecte");
      await page.mouse.move(10, 300);
      await page.waitForTimeout(120);
      const openAudit = await new AxeBuilder({ page })
        .include(".menu-mechanism")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      assert.deepEqual(
        openAudit.violations.map((item) => item.id),
        [],
      );
      await page.mouse.click(10, 300);
      await closed(page);
      near(
        (await page.evaluate(read)).scroll,
        200,
        "Backdrop close preserves scroll",
      );
      await page.locator(".menu-tab").click();
      await opened(page);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(150);
      geometry(await page.evaluate(read), 40);
      await page.keyboard.press("Escape");
      await closed(page);
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.waitForTimeout(80);
      await page.evaluate(() => scrollTo({ top: 200, behavior: "instant" }));
      await page.locator(".menu-tab").click();
      await opened(page, 0);
      const reduced = await page.evaluate(read);
      geometry(reduced, 45);
      near(reduced.stage.x, 0, "Reduced motion does not push the page");
      await page.mouse.move(10, 300);
      await page.mouse.wheel(0, 500);
      await page.keyboard.press("PageDown");
      await page.waitForTimeout(100);
      near(
        (await page.evaluate(read)).scroll,
        200,
        "Reduced motion still locks native background scrolling",
      );
      await page.keyboard.press("Escape");
      await closed(page);
      const axe = await new AxeBuilder({ page })
        .include(".menu-mechanism")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      assert.deepEqual(
        axe.violations.map((item) => item.id),
        [],
      );
      report.motion.push({ channel, frames, reduced });
      await context.close();

      const route = await openPage(
        browser,
        { width: 1440, height: 1000 },
        false,
        "no-preference",
        "/studio",
      );
      await route.page.evaluate(() =>
        window.addEventListener(
          "pageswap",
          (event) =>
            sessionStorage.setItem(
              "tab-route",
              JSON.stringify({
                x: document.querySelector(".site-stage").getBoundingClientRect()
                  .x,
                modal: document
                  .querySelector(".menu-mechanism")
                  .hasAttribute("data-menu-modal"),
                vt: !!event.viewTransition,
              }),
            ),
          { once: true },
        ),
      );
      await route.page.locator(".menu-tab").click();
      await route.page.waitForTimeout(80);
      const row = await route.page
        .locator('#site-menu a[href="/servicii"]')
        .boundingBox();
      await route.page.mouse.click(
        Math.min(1420, row.x + row.width / 2),
        row.y + row.height / 2,
      );
      await route.page.waitForURL("**/servicii");
      const swap = await route.page.evaluate(() =>
        JSON.parse(sessionStorage.getItem("tab-route")),
      );
      near(swap.x, 0, "Outgoing route snapshot is settled");
      assert.equal(swap.modal, false);
      report.navigation.push({ channel, swap });
      await route.context.close();
    } finally {
      await browser.close();
    }
  }
  assert.deepEqual(report.errors, []);
  console.log(
    "Menu tab PASS: persistent control, header axis, real pointer/touch confirmation, angular geometry, morph, modal semantics/focus, frame-level interruption, sticky scroll, resize, reduced motion and native navigation.",
  );
} finally {
  await writeFile(
    "artifacts/menu-tab-verification.json",
    JSON.stringify(report, null, 2),
  );
}
