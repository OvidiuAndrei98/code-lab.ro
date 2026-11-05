import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const base = process.env.SITE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
    { width: 320, height: 480 },
  ]) {
    const page = await browser.newPage({
      viewport,
      reducedMotion: "no-preference",
    });
    await page.goto(base, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1600);
    const initial = await page
      .locator(".showcase-section")
      .evaluate((el) => el.getBoundingClientRect().top + scrollY);
    await page.evaluate((top) => scrollTo(0, top - 120), initial);
    await page.waitForTimeout(900);
    const state = await page.evaluate(() => {
      const hero = document.querySelector(".identity-section");
      const cover = document.querySelector(".showcase-section");
      const link = hero.querySelector(".round-link");
      const r = link.getBoundingClientRect();
      const point = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      const target = document.elementFromPoint(point.x, point.y);
      return {
        heroTop: hero.getBoundingClientRect().top,
        coverTop: cover.getBoundingClientRect().top,
        coverBackground: getComputedStyle(cover).backgroundColor,
        coveredLink: !hero.contains(target),
        sticky: getComputedStyle(hero).position,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    assert.equal(state.sticky, "sticky");
    assert.ok(
      Math.abs(state.heroTop - (viewport.width >= 900 ? -50 : 0)) < 2,
      JSON.stringify(state),
    );
    assert.ok(Math.abs(state.coverTop - 120) < 2, JSON.stringify(state));
    assert.equal(state.coverBackground, "rgb(24, 25, 23)");
    assert.equal(state.coveredLink, true, JSON.stringify(state));
    assert.equal(state.overflow, false);
    await page.screenshot({ path: `artifacts/overlap-${viewport.width}.png` });
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(700);
    assert.ok(
      Math.abs(
        (await page
          .locator(".showcase-section")
          .evaluate((el) => el.getBoundingClientRect().top)) - initial,
      ) < 2,
    );
    await page.close();
  }
  console.log(
    "PASS real opaque overlap, sticky hero, covered controls, reversal and no overflow at desktop and phone widths",
  );
} finally {
  await browser.close();
}
