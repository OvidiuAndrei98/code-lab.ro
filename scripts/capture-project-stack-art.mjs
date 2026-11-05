import { chromium } from "@playwright/test";

const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await page.goto("http://127.0.0.1:3000/proiecte");
  await page.waitForSelector('[data-project-gallery][data-enhanced="true"]', {
    timeout: 25000,
  });
  await page.screenshot({ path: "artifacts/project-stack-art-opening.png" });
  const measures = await page
    .locator("[data-project-gallery]")
    .evaluate((element) => ({
      start: Number(element.dataset.galleryStart),
      distance: Number(element.dataset.galleryDistance),
      rise: Number(element.dataset.galleryRise),
      hold: Number(element.dataset.galleryHoldDistance),
    }));
  const scrollTo = async (top) => {
    await page.evaluate(
      (top) =>
        window.dispatchEvent(
          new CustomEvent("codelab:scroll-to", { detail: { top } }),
        ),
      top,
    );
    await page.waitForTimeout(160);
  };
  const stops = {
    first: measures.start + measures.hold / 2,
    mid: measures.start + measures.hold + measures.rise / 2,
    last: measures.start + measures.hold + measures.rise + measures.hold / 2,
    release: measures.start + measures.distance + 400,
  };
  for (const [name, top] of Object.entries(stops)) {
    await scrollTo(top);
    await page.screenshot({ path: `artifacts/project-stack-art-${name}.png` });
  }
  await page.setViewportSize({ width: 1000, height: 760 });
  await page.goto("http://127.0.0.1:3000/proiecte");
  await page.waitForSelector('[data-project-gallery][data-enhanced="true"]');
  const smallStart = await page
    .locator("[data-project-gallery]")
    .evaluate(
      (element) =>
        Number(element.dataset.galleryStart) +
        Number(element.dataset.galleryHoldDistance) / 2,
    );
  await scrollTo(smallStart);
  await page.screenshot({ path: "artifacts/project-stack-art-1000.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:3000/proiecte");
  await page.waitForSelector(
    '[data-project-gallery][data-gallery-ready="ready"]',
  );
  await scrollTo(
    await page.evaluate(() => document.documentElement.scrollHeight),
  );
  await page.waitForTimeout(800);
  await scrollTo(0);
  await page.waitForTimeout(300);
  await page.screenshot({
    path: "artifacts/project-stack-art-mobile-full.png",
    fullPage: true,
  });
  console.log(JSON.stringify({ measures, stops }));
} finally {
  await browser.close();
}
