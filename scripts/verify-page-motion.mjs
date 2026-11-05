import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const b = await chromium.launch({ channel: "msedge", headless: true });
const base = process.env.SITE_URL || "http://127.0.0.1:3000",
  reports = [],
  errors = [];
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(base, { waitUntil: "networkidle" });
  await p.waitForTimeout(1000);
  const state = () =>
    p.evaluate(() => {
      const tab = document.querySelector(".menu-tab");
      const r = tab.getBoundingClientRect();
      return {
        tabs: document.querySelectorAll(".menu-tab").length,
        name: getComputedStyle(tab).viewTransitionName,
        old: getComputedStyle(
          document.documentElement,
          "::view-transition-old(menu-control)",
        ).display,
        newAnimation: getComputedStyle(
          document.documentElement,
          "::view-transition-new(menu-control)",
        ).animationName,
        rootAnimation: getComputedStyle(
          document.documentElement,
          "::view-transition-new(root)",
        ).animationName,
        active: !!document.activeViewTransition,
        expanded: tab.getAttribute("aria-expanded"),
        x: r.x,
        y: r.y,
        w: r.width,
      };
    });
  const change = async (selector, path) => {
    await Promise.all([
      p.waitForURL(`${base}${path}`),
      p.locator(selector).click(),
    ]);
    await p.waitForLoadState("domcontentloaded");
    await p.waitForTimeout(80);
    return state();
  };
  const initial = await state();
  let during = await change('.header-nav a[href="/servicii"]', "/servicii");
  reports.push({ source: "header", during });
  assert.equal(during.tabs, 1);
  assert.equal(during.name, "menu-control");
  assert.equal(during.old, "none");
  assert.equal(during.newAnimation, "none");
  assert.equal(during.rootAnimation, "incoming-sheet");
  assert.equal(during.active, true);
  assert.equal(during.x, initial.x);
  assert.equal(during.y, initial.y);
  await p.screenshot({
    path: "artifacts/refinement-oct26/navigation-single-tab.png",
  });
  // Interaction interrupts the snapshot instead of freezing the physical button.
  await p.locator(".menu-tab").click();
  await p.waitForTimeout(500);
  assert.equal((await state()).expanded, "true");
  assert.equal((await state()).active, false);
  await p.locator(".menu-tab").click();
  await p.waitForTimeout(80);
  await p.locator(".menu-tab").click();
  await p.waitForTimeout(80);
  await p.locator(".menu-tab").click();
  await p.waitForTimeout(500);
  assert.equal((await state()).expanded, "false");
  // A second real route may start before the current sheet finishes.
  await change('.header-nav a[href="/studio"]', "/studio");
  await change('.header-nav a[href="/proiecte"]', "/proiecte");
  await p.waitForTimeout(850);
  assert.equal((await state()).tabs, 1);
  await p.locator(".menu-tab").click();
  await p.waitForTimeout(550);
  await change('#site-menu a[href="/contact"]', "/contact");
  await p.waitForTimeout(850);
  assert.equal((await state()).expanded, "false");
  assert.equal(await p.locator("#contact-form").count(), 1);
  await p.goBack({ waitUntil: "domcontentloaded" });
  await p.waitForTimeout(850);
  assert.ok(p.url().endsWith("/proiecte"));
  assert.equal((await state()).tabs, 1);
  await p.locator('footer a[href="/studio"]').click();
  await p.waitForURL("**/studio");
  await p.waitForTimeout(850);
  assert.equal((await state()).tabs, 1);
  assert.equal((await state()).expanded, "false");
  reports.push({ source: "drawer/back/footer", final: await state() });
  // Same native control and real navigation on touch/reduced motion.
  const context = await b.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
  });
  const mobile = await context.newPage();
  await mobile.goto(`${base}/servicii`, { waitUntil: "networkidle" });
  await mobile.locator(".menu-tab").tap();
  await mobile.waitForTimeout(80);
  assert.equal(
    await mobile.locator(".menu-tab").getAttribute("aria-expanded"),
    "true",
  );
  await mobile.locator('#site-menu a[href="/studio"]').tap();
  await mobile.waitForURL("**/studio");
  await mobile.waitForLoadState("networkidle");
  assert.equal(await mobile.locator(".menu-tab").count(), 1);
  assert.equal(
    await mobile.locator(".menu-tab").getAttribute("aria-expanded"),
    "false",
  );
  await context.close();
  assert.deepEqual(errors, []);
  await writeFile(
    "artifacts/refinement-oct26/navigation-report.json",
    JSON.stringify(reports, null, 2),
  );
  console.log(
    "PASS page sheets: retained incoming root animation, one stable named tab, interaction interrupts snapshot, rapid reversals, consecutive routes, drawer/footer/header, Back, direct route and phone/reduced touch.",
  );
} finally {
  await b.close();
}
