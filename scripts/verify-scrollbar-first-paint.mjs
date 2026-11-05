import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const base = process.env.SITE_URL || "http://127.0.0.1:3000";
const label = process.env.ARTIFACT_LABEL || "dev";
const report = { base, delay: 1500, reloads: [], nativeProfiles: [] };
await mkdir("artifacts", { recursive: true });

function observeFirstPaint() {
  window.__scrollbarPaint = [];
  new PerformanceObserver((list) => {
    for (const paint of list.getEntries()) {
      const root = document.documentElement;
      const style = getComputedStyle(root);
      window.__scrollbarPaint.push({
        name: paint.name,
        time: paint.startTime,
        classic: root.hasAttribute("data-classic-scrollbar"),
        size: root.style.getPropertyValue("--native-scrollbar-size"),
        rootColor: style.scrollbarColor,
        thumb: getComputedStyle(root, "::-webkit-scrollbar-thumb")
          .backgroundColor,
        track: getComputedStyle(root, "::-webkit-scrollbar-track")
          .backgroundColor,
        gutter: innerWidth - root.getBoundingClientRect().width,
        bodyVisible:
          !document.body ||
          getComputedStyle(document.body).visibility === "visible",
        nextScriptsCompleted: performance
          .getEntriesByType("resource")
          .filter(
            (entry) =>
              entry.name.includes("/_next/") &&
              /\.js(?:\?|$)/.test(entry.name) &&
              entry.responseEnd > 0,
          ).length,
      });
    }
  }).observe({ type: "paint", buffered: true });
}

async function slowNext(page) {
  const session = await page.context().newCDPSession(page);
  await session.send("Network.enable");
  await session.send("Network.setCacheDisabled", { cacheDisabled: true });
  await page.route(/\/_next\/.*\.js(?:\?|$)/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, report.delay));
    await route.continue().catch(() => {});
  });
  await page.addInitScript(observeFirstPaint);
}

async function paint(page) {
  await page.waitForFunction(() =>
    window.__scrollbarPaint?.some(
      (entry) => entry.name === "first-contentful-paint",
    ),
  );
  return page.evaluate(() => {
    const earliest = window.__scrollbarPaint.find(
      (entry) => entry.name === "first-paint",
    );
    const contentful = window.__scrollbarPaint.find(
      (entry) => entry.name === "first-contentful-paint",
    );
    return { ...earliest, contentfulTime: contentful.time };
  });
}

try {
  for (const channel of ["msedge", "chrome"]) {
    const browser = await chromium.launch({
      channel,
      headless: false,
      args: [
        "--window-position=-32000,-32000",
        "--disable-features=OverlayScrollbar,OverlayScrollbars,FluentOverlayScrollbar,FluentScrollbar",
      ],
    });
    try {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await slowNext(page);
      for (let reload = 1; reload <= 3; reload++) {
        if (reload === 1) await page.goto(base + "/", { waitUntil: "commit" });
        else await page.reload({ waitUntil: "commit" });
        const first = await paint(page);
        assert.equal(
          first.classic,
          true,
          "classic bar selected at first contentful paint",
        );
        assert.equal(
          first.thumb,
          "rgb(198, 62, 36)",
          "accent thumb already styled before hydration",
        );
        assert.equal(first.track, "rgb(24, 25, 23)");
        assert.equal(
          first.nextScriptsCompleted,
          0,
          "first-paint styling does not wait for Next scripts",
        );
        assert.equal(
          first.bodyVisible,
          true,
          "page is not hidden to disguise the change",
        );
        assert.equal(parseFloat(first.size), first.gutter);
        assert.ok(first.gutter >= 10);
        if (channel === "msedge" && reload === 1) {
          await page.screenshot({
            path: `artifacts/scrollbar-first-paint-${label}.png`,
            clip: { x: 1390, y: 0, width: 50, height: 700 },
          });
        }
        report.reloads.push({ channel, reload, first });
        await page.waitForLoadState("networkidle");
        assert.equal(
          await page
            .locator("html")
            .evaluate((node) => node.hasAttribute("data-classic-scrollbar")),
          true,
        );
      }
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  }

  for (const mode of ["overlay", "touch", "forced-colors"]) {
    const browser = await chromium.launch({
      channel: "msedge",
      headless: false,
      args: [
        "--window-position=-32000,-32000",
        mode === "overlay"
          ? "--enable-features=OverlayScrollbar,OverlayScrollbars,FluentOverlayScrollbar"
          : "--disable-features=OverlayScrollbar,OverlayScrollbars,FluentOverlayScrollbar,FluentScrollbar",
      ],
    });
    try {
      const page = await browser.newPage({
        viewport: { width: mode === "touch" ? 390 : 1440, height: 844 },
        isMobile: mode === "touch",
        hasTouch: mode === "touch",
        forcedColors: mode === "forced-colors" ? "active" : "none",
      });
      await slowNext(page);
      await page.goto(base + "/", { waitUntil: "commit" });
      const first = await paint(page);
      assert.equal(
        first.classic,
        false,
        `${mode}: native presentation at first paint`,
      );
      assert.equal(first.size, "");
      assert.equal(first.rootColor, "auto");
      assert.equal(first.nextScriptsCompleted, 0);
      report.nativeProfiles.push({ mode, first });
      await page.waitForLoadState("networkidle");
    } finally {
      await browser.close();
    }
  }
  console.log(
    `Scrollbar first-paint PASS: ${label}, 3 cache-disabled reloads in Edge + Chrome with Next JS delayed 1500ms; overlay/touch/forced-colors remain native.`,
  );
} finally {
  await writeFile(
    `artifacts/scrollbar-first-paint-${label}.json`,
    JSON.stringify(report, null, 2),
  );
}
