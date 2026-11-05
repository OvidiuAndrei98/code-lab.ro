import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";
const base = process.env.SITE_URL || "http://127.0.0.1:3000",
  dir = "artifacts/service-ruler-polish";
await mkdir(dir, { recursive: true });
const reports = [],
  errors = [],
  ids = ["website", "ecommerce", "aplicatii"];
const near = (a, b, message, t = 0.06) =>
  assert.ok(Math.abs(a - b) <= t, `${message}: ${a} / ${b}`);
function read() {
  const e = document.querySelector("[data-home-services]"),
    marker = e.querySelector("[data-service-indicator]");
  const box = (n) => {
    const b = n.getBoundingClientRect();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  };
  const styled = (n) => ({
    ...box(n),
    color: getComputedStyle(n).backgroundColor,
    transform: getComputedStyle(n).transform,
    weight: +n.dataset.progressWeight,
  });
  return {
    y: scrollY,
    marks: JSON.parse(e.dataset.serviceMarks),
    p: +e.dataset.servicePosition,
    progress: +e.dataset.serviceProgress,
    local: +e.dataset.serviceLocal,
    segment: +e.dataset.serviceSegment,
    active: e.dataset.serviceActive,
    focus: +e.dataset.serviceFocus,
    visible:
      e.querySelector("[data-service-index]").getClientRects().length > 0,
    marker: styled(marker),
    ticks: [...e.querySelectorAll("[data-service-tick]")].map(styled),
    labels: [...e.querySelectorAll("[data-service-label]")].map((n) => ({
      ...box(n),
      font: getComputedStyle(n).fontSize,
      color: getComputedStyle(n).color,
      current: n.getAttribute("aria-current"),
    })),
    titles: [...e.querySelectorAll("h3 span:first-child")].map(box),
    overflow: document.documentElement.scrollWidth > innerWidth,
  };
}
const scroll = async (p, y) => {
  await p.evaluate(
    (y) =>
      window.dispatchEvent(
        new CustomEvent("codelab:scroll-to", { detail: { top: y } }),
      ),
    y,
  );
  await p.waitForTimeout(55);
  return p.evaluate(read);
};
function verify(s, reduced = false) {
  const active = s.y >= s.marks[2] ? 2 : s.y >= s.marks[1] ? 1 : 0;
  assert.equal(s.active, ids[active]);
  assert.equal(s.labels.filter((l) => l.current).length, 1);
  assert.ok(s.labels[active].current);
  assert.equal(s.overflow, false);
  near(s.progress, s.p / 8, "Same normalized progress", 0.00001);
  if (!s.visible) return;
  const offset = s.marker.y - s.ticks[0].y;
  const expected = reduced
    ? s.ticks[active * 4].y - s.ticks[0].y
    : (s.ticks[(s.segment + 1) * 4].y - s.ticks[s.segment * 4].y) * s.local +
      s.ticks[s.segment * 4].y -
      s.ticks[0].y;
  near(
    offset,
    expected,
    "The same orange line physically follows scroll",
    0.003,
  );
  near(s.marker.x, s.ticks[0].x, "Shared starting axis", 0.01);
  near(s.marker.w, 24, "Constant indicator length");
  near(s.marker.h, 1, "Consistent indicator thickness");
  assert.equal(s.marker.color, "rgb(198, 62, 36)");
  let orange = 1;
  const step = s.ticks[1].y - s.ticks[0].y;
  s.ticks.forEach((tick, i) => {
    near(tick.x, s.marker.x, "Common tick axis", 0.01);
    near(tick.h, 1, "Consistent tick thickness");
    const weight = reduced
      ? 0
      : Math.max(0, 1 - Math.abs(s.marker.y - tick.y) / step);
    near(
      tick.weight,
      weight,
      "Proximity comes from physical distance",
      0.00002,
    );
    near(
      tick.w,
      (i % 4 === 0 ? 16 : 8) + weight * (i % 4 === 0 ? 2 : 3),
      "Small geometric neutral reaction",
      0.01,
    );
    if (tick.color === s.marker.color) orange++;
    const rgb = tick.color.match(/[\d.]+/g).map(Number);
    assert.ok(rgb[0] <= rgb[1], "All graduations stay in the neutral palette");
  });
  assert.equal(
    orange,
    1,
    "Exactly one accent stroke at every intermediate position",
  );
  [0, 4, 8].forEach((i, j) =>
    near(
      s.ticks[i].y,
      s.labels[j].y + s.labels[j].h / 2,
      "Principal marks keep their existing baseline",
      0.01,
    ),
  );
}
for (const channel of ["msedge", "chrome"]) {
  const browser = await chromium.launch({ channel });
  try {
    const profiles =
      channel === "chrome"
        ? [{ width: 1440, height: 1000, dpr: 1 }]
        : [
            { width: 1440, height: 1000, dpr: 1 },
            { width: 1920, height: 912, dpr: 1 },
            { width: 1280, height: 800, dpr: 1.25 },
            { width: 1024, height: 768, dpr: 2 },
            { width: 1001, height: 700, dpr: 1 },
            { width: 1000, height: 700, dpr: 1 },
            { width: 768, height: 900, dpr: 1 },
            { width: 390, height: 844, dpr: 1 },
            { width: 320, height: 568, dpr: 1 },
            { width: 1440, height: 600, dpr: 1 },
          ];
    for (const profile of profiles) {
      const c = await browser.newContext({
          viewport: { width: profile.width, height: profile.height },
          deviceScaleFactor: profile.dpr,
        }),
        p = await c.newPage();
      p.on("pageerror", (e) => errors.push(e.message));
      await p.goto(base, { waitUntil: "networkidle" });
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(200);
      assert.equal(
        await p.locator(".service-trace,[data-trace-node]").count(),
        0,
      );
      assert.equal(await p.locator("[data-service-indicator]").count(), 1);
      assert.equal(await p.locator("[data-service-tick]").count(), 9);
      assert.equal(await p.locator(".home-work-media").count(), 1);
      await p.evaluate(
        () =>
          (window.originalRuler = document.querySelector(
            "[data-service-indicator]",
          )),
      );
      const marks = (await p.evaluate(read)).marks;
      const seek = async (pos) => {
        const seg = Math.min(1, Math.floor(pos / 4));
        return scroll(
          p,
          marks[seg] + ((marks[seg + 1] - marks[seg]) * (pos - seg * 4)) / 4,
        );
      };
      const states = [],
        fine =
          channel === "msedge" &&
          profile.width === 1440 &&
          profile.height === 1000;
      for (let pos = 0; pos <= 8; pos += fine ? 0.125 : 0.5) {
        const s = await seek(pos);
        near(
          s.p,
          pos,
          "Every fractional scroll position is representable",
          0.025,
        );
        verify(s);
        assert.ok(
          await p.evaluate(
            () =>
              window.originalRuler ===
              document.querySelector("[data-service-indicator]"),
          ),
          "The marker is the same DOM node",
        );
        if (states.length && s.visible) {
          near(
            s.marker.x,
            states[0].marker.x,
            "Indicator never shifts horizontally",
          );
          s.labels.forEach((l, i) => {
            near(
              l.x,
              states[0].labels[i].x,
              "Label horizontal alignment remains stable",
            );
            near(l.w, states[0].labels[i].w, "Label width remains stable");
            near(l.h, states[0].labels[i].h, "Label height remains stable");
            assert.equal(l.font, states[0].labels[i].font);
          });
        }
        if (fine && [0, 1, 1.5, 2, 3, 4, 5, 6, 7, 8].includes(pos)) {
          await p.screenshot({ path: `${dir}/page-${pos}.png` });
          await p
            .locator(".offer-context-sticky")
            .screenshot({ path: `${dir}/index-${pos}.png` });
        }
        states.push(s);
      }
      const stopped = await seek(1.375);
      await p.waitForTimeout(300);
      const later = await p.evaluate(read);
      assert.deepEqual(later.marker, stopped.marker);
      assert.deepEqual(
        later.ticks,
        stopped.ticks,
        "No independent tick animations after stopping",
      );
      await seek(8);
      const reverse = await seek(1.375);
      assert.deepEqual(reverse.marker, stopped.marker);
      assert.deepEqual(
        reverse.ticks,
        stopped.ticks,
        "Reverse restores the identical physical state",
      );
      if (fine) {
        const before = JSON.parse(await readFile(`${dir}/before.json`, "utf8"));
        await seek(4);
        const after = await p.locator(".offer-context-sticky").evaluate((e) => {
          const r = (n) => {
            const b = n.getBoundingClientRect(),
              s = getComputedStyle(n);
            return {
              x: b.x,
              y: b.y,
              w: b.width,
              h: b.height,
              font: s.fontSize,
              line: s.lineHeight,
              text: n.textContent,
            };
          };
          return {
            context: r(e),
            children: [...e.querySelectorAll("h2,p,nav,a")].map(r),
          };
        });
        assert.deepEqual(
          after,
          before,
          "Preserve every existing left-column alignment, font size, label and copy",
        );
        for (let i = 0; i < 3; i++) {
          await p.locator("[data-service-label]").nth(i).click();
          await p.waitForFunction(
            (target) => Math.abs(scrollY - target) < 1,
            marks[i],
            { timeout: 6000 },
          );
          await p.waitForTimeout(60);
          const s = await p.evaluate(read);
          verify(s);
          near(
            s.p,
            i * 4,
            "Each real hash click reaches the measured service",
            0.025,
          );
          assert.equal(new URL(p.url()).hash, `#home-${ids[i]}`);
        }
        await p.locator("[data-service-label]").nth(0).focus();
        await p.keyboard.press("Tab");
        await p.keyboard.press("Shift+Tab");
        assert.ok(
          await p
            .locator("[data-service-label]")
            .nth(0)
            .evaluate((e) => e.matches(":focus-visible")),
        );
        await p.keyboard.press("Enter");
        await p.waitForFunction(
          (target) => Math.abs(scrollY - target) < 1,
          marks[0],
          { timeout: 6000 },
        );
        await p.waitForTimeout(60);
        near(
          (await p.evaluate(read)).p,
          0,
          "Keyboard activation keeps existing navigation",
        );
        await seek(0);
        await p.evaluate(() => {
          window.rulerFrames = [];
          window.recordRuler = true;
          function frame() {
            if (!window.recordRuler) return;
            const e = document.querySelector("[data-home-services]"),
              m = e.querySelector("[data-service-indicator]");
            window.rulerFrames.push({
              scroll: scrollY,
              p: +e.dataset.servicePosition,
              y: +e.dataset.rulerPosition,
              transform: m.style.transform,
            });
            requestAnimationFrame(frame);
          }
          requestAnimationFrame(frame);
        });
        await p.mouse.wheel(0, (marks[2] - marks[0]) * 0.85);
        await p.waitForTimeout(1400);
        await p.mouse.wheel(0, -(marks[2] - marks[0]) * 0.6);
        await p.waitForTimeout(1400);
        const frames = await p.evaluate(() => {
          window.recordRuler = false;
          return window.rulerFrames;
        });
        assert.ok(
          new Set(frames.map((f) => f.y)).size > 30,
          "Actual smooth wheel produces continuous movement",
        );
        reports.push({ frames });
        const axe = await new AxeBuilder({ page: p })
          .include("[data-home-services]")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        assert.deepEqual(
          axe.violations.map((v) => v.id),
          [],
        );
        for (const href of [
          "/servicii/website-uri",
          "/servicii/magazin-online",
          "/servicii/aplicatii-web",
        ])
          assert.equal(
            await p.locator(`.offer-title-link[href="${href}"]`).count(),
            1,
          );
      }
      await p.setViewportSize({
        width: profile.width > 1000 ? 980 : 1200,
        height: profile.height,
      });
      await p.waitForTimeout(300);
      await p.setViewportSize({ width: profile.width, height: profile.height });
      await p.waitForTimeout(300);
      const resized = await p.evaluate(read);
      const refreshed = await scroll(p, resized.marks[1]);
      verify(refreshed);
      near(
        refreshed.p,
        4,
        "Resize and hidden/visible index recalibrate correctly",
        0.025,
      );
      reports.push({ channel, profile, states });
      await c.close();
      console.log(
        `PASS ${channel} ${profile.width}x${profile.height} DPR ${profile.dpr}`,
      );
    }
    if (channel === "msedge") {
      const c = await browser.newContext({
          viewport: { width: 1440, height: 1000 },
          reducedMotion: "reduce",
        }),
        p = await c.newPage();
      await p.goto(base, { waitUntil: "networkidle" });
      const marks = (await p.evaluate(read)).marks;
      for (const pos of [0, 2, 4, 6, 8]) {
        const seg = Math.min(1, Math.floor(pos / 4));
        const s = await scroll(
          p,
          marks[seg] + ((marks[seg + 1] - marks[seg]) * (pos - seg * 4)) / 4,
        );
        verify(s, true);
        await p.waitForTimeout(200);
        assert.deepEqual((await p.evaluate(read)).marker, s.marker);
      }
      await p.locator("[data-service-label]").nth(1).focus();
      await p.keyboard.press("Enter");
      await p.waitForTimeout(100);
      near((await p.evaluate(read)).p, 4, "Native reduced-motion hash link");
      await c.close();
      for (const width of [1440, 390]) {
        const c = await browser.newContext({
          viewport: { width, height: 900 },
          reducedMotion: "reduce",
        });
        const p = await c.newPage();
        await p.goto(base, { waitUntil: "networkidle" });
        await p.evaluate(() => document.fonts.ready);
        await p.screenshot({
          path: `${dir}/home-static-${width}.png`,
          fullPage: true,
        });
        await c.close();
      }
      const native = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      const p2 = await native.newPage();
      await p2.goto(base, { waitUntil: "networkidle" });
      const m = (await p2.evaluate(read)).marks;
      await scroll(p2, m[0]);
      const session = await native.newCDPSession(p2);
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: 180, y: 650 }],
      });
      for (let y = 600; y >= 150; y -= 50) {
        await session.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: 180, y }],
        });
        await p2.waitForTimeout(20);
      }
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await p2.waitForTimeout(300);
      const touch = await p2.evaluate(read);
      verify(touch);
      assert.ok(touch.p > 0);
      await native.close();
      const nojs = await browser.newContext({
          viewport: { width: 1440, height: 1000 },
          javaScriptEnabled: false,
        }),
        staticPage = await nojs.newPage();
      await staticPage.goto(base);
      assert.equal(await staticPage.locator("[data-offer]").count(), 3);
      assert.equal(
        await staticPage.locator("[data-service-indicator]").count(),
        1,
      );
      assert.equal(await staticPage.locator(".service-trace").count(), 0);
      await nojs.close();
    }
  } finally {
    await browser.close();
  }
}
assert.deepEqual(errors, []);
await writeFile(`${dir}/verification.json`, JSON.stringify(reports, null, 2));
const pieces = [];
for (const [i, pos] of [0, 1, 1.5, 2, 3, 4, 6, 8].entries())
  pieces.push({
    input: await sharp(`${dir}/index-${pos}.png`)
      .resize(240, 520, { fit: "contain", background: "#eae8e1" })
      .toBuffer(),
    left: (i % 4) * 240,
    top: Math.floor(i / 4) * 520,
  });
await sharp({
  create: { width: 960, height: 1040, channels: 3, background: "#eae8e1" },
})
  .composite(pieces)
  .png()
  .toFile(`${dir}/comparison.png`);
console.log(
  "PASS one persistent accent line, nine neutral proximity marks, preserved left composition, continuous seeking/stopping/reversal, real hash clicks, keyboard, resize, reduced motion, touch, no-JS and Axe.",
);
