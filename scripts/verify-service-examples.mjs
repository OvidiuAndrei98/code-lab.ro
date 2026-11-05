import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

// Demonstrations now live on their dedicated service pages. Their full state,
// keyboard and accessibility suites are verify-shop-service/verify-app-service.
// The old poster/day-picker source remains available, but is no longer index UI.
const base = process.env.SITE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/servicii`, { waitUntil: "networkidle" });
  await expect(
    page.locator("[data-services-index] [data-service-entry]"),
  ).toHaveCount(3);
  await expect(
    page.locator(
      "[data-services-index] .project-media, [data-services-index] .shop-demonstration, [data-services-index] .app-demo",
    ),
  ).toHaveCount(0);
  await page.locator("[data-service-entry]#ecommerce a").click();
  await page.waitForURL("**/servicii/magazin-online");
  const shop = page.locator(".shop-demonstration");
  await expect(shop).toBeVisible();
  await expect(shop).toContainText("Demonstrație interactivă");
  await expect(shop.locator(".shop-add-button")).toBeEnabled();
  await expect(shop.locator(".shop-demo-price-note")).toContainText(
    "Fără comenzi reale",
  );
  await page.goBack({ waitUntil: "networkidle" });
  await page.locator("[data-service-entry]#aplicatii a").click();
  await page.waitForURL("**/servicii/aplicatii-web");
  const requests = page.locator(".app-demo");
  await expect(requests).toBeVisible();
  await expect(requests.locator("#app-demo-title")).toHaveText(
    "Demonstrație interactivă · date de exemplu",
  );
  await expect(requests.locator("[data-pending-count]")).toHaveText("3");
  await expect(requests).toContainText("Fără programări reale");
  await page.goBack({ waitUntil: "networkidle" });
  await page.locator("[data-service-entry]#website a").click();
  await page.waitForURL("**/servicii/website-uri");
  await expect(
    page.locator(".website-service-page .project-media").first(),
  ).toBeAttached();
  await expect(page.locator(".website-service-page")).toContainText("În lucru");
  assert.deepEqual(errors, []);
  console.log(
    "PASS service index destinations expose the original in-progress website and clearly labelled local shop/application demonstrations; detailed demo rules remain covered by their dedicated suites",
  );
} finally {
  await browser.close();
}
