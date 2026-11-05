import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "no-preference",
  });
  await context.addInitScript(() => {
    window.heroEntry = [];
    window.heroSheet = false;
    addEventListener("pagereveal", (event) => {
      window.heroSheet = !!event.viewTransition;
    });
    const sample = () => {
      const glyphs = [
        ...document.querySelectorAll(".identity-lockup .identity-fill"),
      ];
      if (
        glyphs.length &&
        getComputedStyle(document.documentElement).getPropertyValue("--paper")
      ) {
        window.heroEntry.push(
          glyphs.map(
            (el) =>
              new DOMMatrix(getComputedStyle(el).transform).m42 /
              el.offsetHeight,
          ),
        );
      }
      if (performance.now() < 6000) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  const page = await context.newPage();
  const errors = [];
  let phase = "initial contact page";
  page.on("pageerror", (error) => errors.push(`${phase}: ${error.message}`));
  await page.goto(`${base}/contact`, { waitUntil: "networkidle" });
  // Reproduce a new document appearing before its React/GSAP bundle arrives.
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() === "script")
      await new Promise((resolve) => setTimeout(resolve, 1000));
    await route.continue();
  });
  const documents = [];
  page.on("request", (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame())
      documents.push(request.url());
  });
  phase = "navigation to hero";
  await page.locator(".site-header .logo").click();
  await page.waitForURL(`${base}/`);
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("lenis"),
  );
  await page.waitForTimeout(1700);
  const entry = await page.evaluate(() => window.heroEntry);
  assert.ok(
    entry.length > 30,
    "Capture the initial server render and hydration",
  );
  let rewind = 0;
  for (let index = 1; index < entry.length; index++)
    entry[index].forEach((position, glyph) => {
      rewind = Math.max(rewind, position - entry[index - 1][glyph]);
    });
  console.log({ frames: entry.length, rewind, documents: documents.length });
  assert.equal(
    documents.length,
    1,
    "One click must load only one page document",
  );
  assert.ok(
    rewind < 0.03,
    "Hero must not disappear and restart after its first paint",
  );
  assert.ok(entry.at(-1).every((position) => Math.abs(position) < 0.001));
  assert.equal(
    await page.evaluate(() => window.heroSheet),
    true,
    "The incoming page sheet must survive delayed JavaScript",
  );
  phase = "menu interaction";
  await page.getByRole("button", { name: "Meniu", exact: true }).click();
  await page.getByRole("button", { name: "Închide meniul" }).click();
  await page.locator("dialog").waitFor({ state: "hidden" });
  assert.ok(
    (await page.evaluate(() => window.heroEntry))
      .at(-1)
      .every((position) => Math.abs(position) < 0.001),
  );
  phase = "reduced motion preference";
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page
      .locator(".identity-lockup .identity-fill")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
    "none",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS one continuous hero entrance with delayed JavaScript, page navigation, menu and reduced motion",
  );
} finally {
  await browser.close();
}
