import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";

const base = process.env.SITE_URL || "http://127.0.0.1:3000";
const directory = "artifacts/menu-parallel-burger";
await mkdir(directory, { recursive: true });
const report = [];

function snapshot() {
  const button = document.querySelector(".menu-tab");
  const face = document.querySelector(".menu-tab-face");
  const svg = document.querySelector(".menu-tab-graphic");
  const icon = document.querySelector(".menu-tab-icon");
  const reference = new DOMPoint(40, 25.5).matrixTransform(svg.getScreenCTM());
  const diagonal = [
    [0, 44],
    [72, 116],
  ].map(([x, y]) => {
    const point = new DOMPoint(x, y).matrixTransform(svg.getScreenCTM());
    return { x: point.x, y: point.y };
  });
  const style = getComputedStyle(button);
  const rect = (node) => node.getBoundingClientRect().toJSON();
  return {
    button: rect(button),
    face: rect(face),
    svg: rect(svg),
    icon: rect(icon),
    axis: reference.y,
    diagonal,
    viewport: innerWidth,
    path: face.getAttribute("d"),
    viewBox: svg.getAttribute("viewBox"),
    focusFrames: document.querySelectorAll(".menu-tab-focus").length,
    contourCount: svg.querySelectorAll(".menu-tab-contour").length,
    pathCount: svg.querySelectorAll("path").length,
    focused: button.matches(":focus-visible"),
    expanded: button.getAttribute("aria-expanded"),
    outline: style.outlineStyle,
    offset: style.outlineOffset,
    shadow: style.boxShadow,
    border: style.borderWidth,
    faceColor: getComputedStyle(face).fill,
    faceStroke: getComputedStyle(face).stroke,
    iconColor: getComputedStyle(icon).stroke,
    transform: getComputedStyle(icon).transform,
    opacity: getComputedStyle(icon).opacity,
    strokes: [...svg.querySelectorAll("line")].map((line) => ({
      width: getComputedStyle(line).strokeWidth,
      effect: getComputedStyle(line).vectorEffect,
      x1: +line.getAttribute("x1"),
      y1: +line.getAttribute("y1"),
      x2: +line.getAttribute("x2"),
      y2: +line.getAttribute("y2"),
      screenStart: (() => {
        const point = new DOMPoint(
          +line.getAttribute("x1"),
          +line.getAttribute("y1"),
        ).matrixTransform(line.getScreenCTM());
        return { x: point.x, y: point.y };
      })(),
      screenEnd: (() => {
        const point = new DOMPoint(
          +line.getAttribute("x2"),
          +line.getAttribute("y2"),
        ).matrixTransform(line.getScreenCTM());
        return { x: point.x, y: point.y };
      })(),
    })),
    overflow: document.documentElement.scrollWidth > innerWidth,
  };
}

function verify(state, keyboard = false) {
  assert.equal(state.shadow, "none");
  assert.equal(state.border, "0px");
  assert.equal(state.overflow, false);
  assert.ok(state.button.width >= 44 && state.button.height >= 44);
  assert.ok(state.face.y >= 4);
  assert.ok(
    Math.abs(state.face.width - (state.viewport <= 700 ? 44 : 52)) < 0.02,
  );
  assert.ok(Math.abs(state.face.height - (state.face.width * 116) / 72) < 0.02);
  assert.ok(
    Math.abs(state.axis - (state.face.y + (state.face.width * 25.5) / 72)) <
      0.02,
  );
  assert.equal(state.path, "M0 0H72V116L0 44Z");
  assert.equal(state.viewBox, "0 0 72 116");
  assert.equal(state.contourCount, 0);
  assert.equal(state.pathCount, 1);
  assert.equal(state.strokes.length, 3);
  assert.equal(state.focusFrames, 0);
  assert.equal(state.faceStroke, "none");
  assert.equal(new Set(state.strokes.map((line) => line.width)).size, 1);
  assert.ok(
    state.strokes.every((line) => line.effect === "non-scaling-stroke"),
  );
  if (keyboard) {
    assert.equal(state.focused, true);
    assert.equal(state.outline, "none");
    assert.equal(state.offset, "0px");
  }
}

function contrast(a, b) {
  const luminance = (rgb) => {
    const c = rgb
      .match(/[\d.]+/g)
      .slice(0, 3)
      .map(Number)
      .map((v) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
    return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
  };
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

for (const profile of [
  { name: "desktop", channel: "msedge", width: 1440, height: 1000 },
  { name: "mobile", channel: "msedge", width: 390, height: 844, touch: true },
  { name: "narrow", channel: "msedge", width: 320, height: 568 },
  {
    name: "reduced",
    channel: "msedge",
    width: 1440,
    height: 1000,
    reduced: true,
  },
  {
    name: "forced",
    channel: "msedge",
    width: 1440,
    height: 1000,
    forced: true,
  },
  { name: "chrome", channel: "chrome", width: 1440, height: 1000 },
]) {
  const browser = await chromium.launch({
    channel: profile.channel,
    headless: true,
  });
  try {
    const context = await browser.newContext({
      viewport: { width: profile.width, height: profile.height },
      deviceScaleFactor: 2,
      isMobile: !!profile.touch,
      hasTouch: !!profile.touch,
      reducedMotion: profile.reduced ? "reduce" : "no-preference",
      forcedColors: profile.forced ? "active" : "none",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base, { waitUntil: "networkidle" });
    const button = page.locator(".menu-tab");
    const capture = async (name) => {
      const face = await page.locator(".menu-tab-face").boundingBox();
      const x = Math.max(0, face.x - 14);
      await page.screenshot({
        path: `${directory}/${profile.name}-${name}.png`,
        clip: {
          x,
          y: 8,
          width: Math.min(profile.width - x, face.width + 28),
          height: 160,
        },
      });
    };
    const states = { initial: await page.evaluate(snapshot) };
    verify(states.initial);
    // Validate the actual painted coordinates, including SVG viewport scaling.
    assert.deepEqual(
      states.initial.strokes.map(({ x1, y1, x2, y2 }) => [x1, y1, x2, y2]),
      [
        [13, 15.5, 58, 15.5],
        [28, 30.5, 58, 30.5],
        [43, 45.5, 58, 45.5],
      ],
    );
    const [a, b] = states.initial.diagonal;
    const dx = b.x - a.x,
      dy = b.y - a.y,
      length = Math.hypot(dx, dy);
    const visibleGaps = states.initial.strokes.map((line) => {
      const cap = line.screenStart;
      // The lower corner of each square cap is the ink nearest to the cut.
      return (
        (dx * (a.y - cap.y - parseFloat(line.width) / 2) - dy * (a.x - cap.x)) /
        length
      );
    });
    assert.ok(
      Math.max(...visibleGaps) - Math.min(...visibleGaps) < 0.02,
      "All three visible caps have the same perpendicular clearance to the diagonal",
    );
    assert.ok(
      visibleGaps.every((gap) => gap > 4),
      "All three bars remain comfortably inside the unchanged orange face",
    );
    await capture("closed");
    await page.screenshot({
      path: `${directory}/${profile.name}-page-closed.png`,
    });

    // Observe the real click-driven transform, including intermediate strokes.
    await page.evaluate(() => {
      window.__iconFrames = [];
      document.querySelector(".menu-tab").addEventListener(
        "click",
        () => {
          const start = performance.now();
          const tick = () => {
            const time = performance.now() - start;
            window.__iconFrames.push({
              time,
              lines: [...document.querySelectorAll(".menu-tab-icon line")].map(
                (line) => ({
                  transform: line.getAttribute("transform"),
                  opacity: +getComputedStyle(line).opacity,
                  stroke: getComputedStyle(line).strokeWidth,
                }),
              ),
            });
            if (time < 400) requestAnimationFrame(tick);
          };
          tick();
        },
        { once: true },
      );
    });

    if (!profile.touch) {
      await button.hover();
      await page.waitForTimeout(180);
      states.hover = await page.evaluate(snapshot);
      assert.deepEqual(states.hover.face, states.initial.face);
      if (!profile.reduced)
        assert.ok(states.hover.icon.width > states.initial.icon.width);
      else assert.equal(states.hover.transform, "none");
      await page.mouse.down();
      await page.waitForTimeout(180);
      states.press = await page.evaluate(snapshot);
      assert.equal(states.press.expanded, "false");
      assert.deepEqual(states.press.face, states.initial.face);
      assert.ok(Number(states.press.opacity) < 1);
      await capture("pressed");
      await page.mouse.up();
    } else await button.tap();
    await page.waitForTimeout(650);
    states.pointerOpen = await page.evaluate(snapshot);
    verify(states.pointerOpen);
    assert.equal(states.pointerOpen.expanded, "true");
    assert.equal(
      states.pointerOpen.faceColor,
      states.initial.faceColor,
      "Open state alone does not activate keyboard focus colors",
    );
    await capture("open");
    await page.screenshot({
      path: `${directory}/${profile.name}-page-open.png`,
    });
    states.morph = await page.evaluate(() => window.__iconFrames);
    if (!profile.reduced) {
      const frames = states.morph;
      assert.ok(
        frames.every((f) => f.lines.length === 3),
        "The original three strokes stay mounted",
      );
      assert.ok(
        frames.some((f) => f.lines[1].opacity > 0 && f.lines[1].opacity < 1),
        "The middle stroke retracts and disappears smoothly",
      );
      assert.ok(
        new Set(frames.map((f) => f.lines[0].transform)).size >= 3,
        "The same top stroke moves through intermediate transforms",
      );
      const final = frames.at(-1).lines[0].transform;
      const settled = frames.findIndex((f) => f.lines[0].transform === final);
      assert.ok(
        frames[settled].time >= 260 && frames[settled].time <= 370,
        "The morph settles in approximately 300ms",
      );
      assert.ok(
        frames.every((f) =>
          f.lines.every((l) => l.stroke === frames[0].lines[0].stroke),
        ),
        "Stroke weight is constant throughout rotation and scaling",
      );
    }

    await button.click();
    await page.waitForTimeout(650);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(button).toBeFocused();
    states.keyboardClosed = await page.evaluate(snapshot);
    verify(states.keyboardClosed, true);
    states.focusContrast = contrast(
      states.keyboardClosed.iconColor,
      states.keyboardClosed.faceColor,
    );
    assert.ok(states.focusContrast >= 3);
    assert.ok(
      contrast(states.keyboardClosed.faceColor, states.initial.faceColor) >= 3,
    );
    assert.notEqual(states.keyboardClosed.iconColor, states.initial.iconColor);
    await capture("keyboard-focus");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(650);
    states.keyboardOpen = await page.evaluate(snapshot);
    verify(states.keyboardOpen, true);
    await capture("keyboard-open");
    await page.keyboard.press("Space");
    await page.waitForTimeout(650);
    verify(await page.evaluate(snapshot), true);
    await page.keyboard.press("Space");
    await page.waitForTimeout(650);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(650);
    await expect(button).toBeFocused();
    assert.deepEqual(errors, []);
    report.push({ profile, states });
    console.log(
      `PASS ${profile.name}: shared SVG geometry, pointer/press, independent open/focus states, Tab/Enter/Space/Escape, filled focus contrast`,
    );
  } finally {
    await browser.close();
  }
}

await writeFile(
  `${directory}/verification.json`,
  JSON.stringify(report, null, 2),
);

const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 540, height: 550 },
    deviceScaleFactor: 2,
  });
  const groups = [];
  for (const [profile, label] of [
    ["desktop", "Desktop"],
    ["mobile", "Mobil"],
  ]) {
    const cells = [];
    for (const [state, title] of [
      ["closed", "Închis"],
      ["open", "Deschis"],
      ["keyboard-focus", "Focus · Tab"],
    ]) {
      const png = (
        await readFile(`${directory}/${profile}-${state}.png`)
      ).toString("base64");
      cells.push(
        `<figure><figcaption>${title}</figcaption><div><img src="data:image/png;base64,${png}"></div></figure>`,
      );
    }
    groups.push(
      `<section><h2>${label}</h2><main>${cells.join("")}</main></section>`,
    );
  }
  await page.setContent(
    `<style>*{box-sizing:border-box}body{margin:0;padding:20px;background:#eae8e1;color:#181917;font:14px Arial}h2{font-size:14px;margin:0 0 12px;font-weight:600}section+section{margin-top:20px}main{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}figure{margin:0}figcaption{margin-bottom:8px}figure div{height:200px;background:#deddd5;display:flex;justify-content:center;align-items:center}img{display:block;height:180px;width:auto}</style>${groups.join("")}`,
  );
  await page.screenshot({ path: `${directory}/details.png`, fullPage: true });
} finally {
  await browser.close();
}
