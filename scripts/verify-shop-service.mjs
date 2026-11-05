import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = process.env.SITE_URL || "http://127.0.0.1:3000";
const path = "/servicii/magazin-online";
const browser = await chromium.launch({ channel: "msedge", headless: true });

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  const submissions = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (!["GET", "HEAD"].includes(request.method())) {
      submissions.push({ method: request.method(), url: request.url() });
    }
  });
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".shop-product-visual img").evaluate(async (image) => {
    await image.decode();
  });

  const demo = page.locator(".shop-demonstration");
  const a5 = demo.locator('input[type="radio"][value="A5"]');
  const a4 = demo.locator('input[type="radio"][value="A4"]');
  const quantity = demo.locator(".shop-quantity-control output");
  const less = demo.getByRole("button", { name: "Scade cantitatea" });
  const more = demo.getByRole("button", { name: "Crește cantitatea" });
  const add = demo.locator(".shop-add-button");
  const toggle = demo.locator(".shop-cart-toggle");
  const summary = demo.locator("#shop-cart-summary");
  const reset = demo.locator(".shop-reset");
  const total = demo.locator(".shop-cart-total strong");

  const disclosure = async (open) => {
    await page.waitForFunction((expected) => {
      const toggle = document.querySelector(".shop-cart-toggle");
      const summary = document.querySelector("#shop-cart-summary");
      return (
        toggle?.getAttribute("aria-expanded") === String(expected) &&
        summary?.getAttribute("aria-hidden") === String(!expected) &&
        summary.inert === !expected
      );
    }, open);
    assert.equal(
      await toggle.getAttribute("aria-controls"),
      "shop-cart-summary",
    );
  };
  const audit = async (label) => {
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    assert.deepEqual(
      result.violations.map((violation) => ({
        id: violation.id,
        nodes: violation.nodes.map((node) => node.target),
      })),
      [],
      label,
    );
  };
  const imageBounds = () =>
    page.locator(".shop-product-visual img").evaluate((image) => {
      const rect = image.getBoundingClientRect();
      return {
        x: rect.x + scrollX,
        y: rect.y + scrollY,
        width: rect.width,
        height: rect.height,
      };
    });
  const stageBounds = () =>
    page.locator(".shop-product-stage").evaluate((stage) => {
      const rect = stage.getBoundingClientRect();
      return {
        x: rect.x + scrollX,
        y: rect.y + scrollY,
        width: rect.width,
        height: rect.height,
      };
    });
  const assertImageStable = (before, after, label) => {
    for (const property of ["x", "y", "width", "height"]) {
      assert.ok(
        Math.abs(before[property] - after[property]) <= 1,
        `${label}: image ${property} changed (${before[property]} → ${after[property]})`,
      );
    }
  };

  assert.equal(await page.locator("h1").count(), 1);
  assert.equal(await a5.isChecked(), true);
  assert.equal(await a4.isChecked(), false);
  assert.equal(await quantity.textContent(), "1");
  assert.equal(await less.isDisabled(), true);
  assert.match(await demo.locator(".shop-selection-price").textContent(), /60/);
  await disclosure(false);
  assert.equal(
    await reset.evaluate((button) => {
      button.focus();
      return document.activeElement === button;
    }),
    false,
    "Collapsed cart controls must be excluded from keyboard focus",
  );
  await audit("Desktop initial accessibility");
  await page.setViewportSize({ width: 390, height: 844 });
  await audit("Mobile initial accessibility");
  await page.setViewportSize({ width: 1440, height: 1000 });

  // Native radios retain their arrow-key behavior and update the real price.
  await a5.focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await a4.isChecked(), true);
  assert.match(await demo.locator(".shop-selection-price").textContent(), /90/);
  await page.keyboard.press("ArrowLeft");
  assert.equal(await a5.isChecked(), true);
  assert.match(await demo.locator(".shop-selection-price").textContent(), /60/);
  await page.keyboard.press("ArrowRight");

  for (let step = 1; step < 20; step++) await more.click();
  assert.equal(await quantity.textContent(), "20");
  assert.equal(await more.isDisabled(), true);
  assert.match(
    await demo.locator(".shop-selection-total").textContent(),
    /1800 lei/,
  );
  for (let step = 20; step > 2; step--) await less.click();
  assert.equal(await quantity.textContent(), "2");
  assert.match(
    await demo.locator(".shop-selection-total").textContent(),
    /180 lei/,
  );
  const beforeCart = await imageBounds();
  const beforeStage = await stageBounds();
  await add.click();
  await disclosure(true);
  assert.equal(await total.textContent(), "180 lei");
  assert.equal(await demo.locator(".shop-cart-item").count(), 1);
  assert.match(
    await demo.locator(".shop-announcement").textContent(),
    /2 carnete A4 adăugate/,
  );
  await add.click();
  assert.equal(await total.textContent(), "360 lei");
  assert.equal(await demo.locator(".shop-cart-item").count(), 1);
  assert.match(
    await demo.locator(".shop-cart-item").textContent(),
    /4 bucăți × 90 lei/,
  );
  await a5.check();
  await add.click();
  assert.equal(await demo.locator(".shop-cart-item").count(), 2);
  assert.equal(await total.textContent(), "480 lei");
  assert.match(await toggle.textContent(), /6 produse/);
  await page.waitForFunction(() =>
    document
      .querySelector(".shop-cart-disclosure")
      .getAnimations()
      .every((animation) => animation.playState === "finished"),
  );
  assertImageStable(beforeCart, await imageBounds(), "Opening the mixed cart");
  const afterStage = await stageBounds();
  console.log(
    `Desktop product stage: ${beforeStage.width}×${beforeStage.height} before cart; ${afterStage.width}×${afterStage.height} with both formats`,
  );
  assertImageStable(beforeStage, afterStage, "Desktop stage with both formats");
  assert.equal(
    await demo
      .locator('button, a, input[type="submit"]')
      .evaluateAll((elements) =>
        elements.some((element) =>
          /checkout|plătește|finalizează|cumpără/i.test(
            element.textContent || element.getAttribute("aria-label") || "",
          ),
        ),
      ),
    false,
    "The local demonstration must not offer a real order or checkout",
  );
  assert.equal(await demo.locator("form, a").count(), 0);
  assert.match(
    await demo.locator(".shop-demo-price-note").textContent(),
    /Fără comenzi reale/,
  );

  for (const width of [
    320, 390, 600, 700, 768, 800, 900, 1024, 1280, 1440, 1920,
  ]) {
    await page.setViewportSize({ width, height: width < 800 ? 844 : 1000 });
    await page.evaluate(() => scrollTo(0, 0));
    const layout = await page.evaluate(() => {
      const headings = [
        ...document.querySelectorAll(
          ".shop-service-page h1, .shop-service-page h2, .shop-service-page h3",
        ),
      ];
      const clipped = headings.flatMap((heading) => {
        const range = document.createRange();
        range.selectNodeContents(heading);
        return [...range.getClientRects()]
          .filter(
            (rect) =>
              rect.width && (rect.left < -1 || rect.right > innerWidth + 1),
          )
          .map((rect) => ({
            heading: heading.textContent,
            left: rect.left,
            right: rect.right,
          }));
      });
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        clipped,
      };
    });
    assert.equal(layout.overflow, false, `Horizontal overflow at ${width}px`);
    assert.deepEqual(layout.clipped, [], `Clipped heading at ${width}px`);
    const initial = await imageBounds();
    assert.ok(initial.width > 0 && initial.height > 0);
    assert.ok(
      initial.x >= -1 && initial.x + initial.width <= width + 1,
      `Product image fits ${width}px viewport`,
    );
    await toggle.click();
    await disclosure(false);
    await toggle.click();
    await disclosure(true);
    assert.equal(
      await total.textContent(),
      "480 lei",
      `Cart persists at ${width}px`,
    );
    assertImageStable(initial, await imageBounds(), `Disclosure at ${width}px`);
    if ([390, 1440].includes(width))
      await audit(`Populated accessibility at ${width}px`);
  }

  await demo
    .getByRole("button", { name: "Elimină formatul A4", exact: true })
    .click();
  assert.equal(await demo.locator(".shop-cart-item").count(), 1);
  assert.equal(await total.textContent(), "120 lei");
  assert.match(await toggle.textContent(), /2 produse/);
  assert.equal(
    await toggle.evaluate((button) => document.activeElement === button),
    true,
  );
  assert.match(
    await demo.locator(".shop-announcement").textContent(),
    /A4 a fost eliminat/,
  );
  await toggle.click();
  await disclosure(false);
  await toggle.click();
  await disclosure(true);
  assert.equal(await total.textContent(), "120 lei");
  await demo
    .getByRole("button", { name: "Elimină formatul A5", exact: true })
    .click();
  assert.equal(await demo.locator(".shop-cart-item").count(), 0);
  assert.match(await demo.locator(".shop-empty-cart").textContent(), /gol/);
  assert.match(await toggle.textContent(), /0 produse/);
  await a4.check();
  await add.click();
  await reset.click();
  await disclosure(false);
  assert.equal(
    await add.evaluate((button) => document.activeElement === button),
    true,
  );
  assert.equal(await a5.isChecked(), true);
  assert.equal(await quantity.textContent(), "1");
  assert.equal(await less.isDisabled(), true);
  assert.match(
    await demo.locator(".shop-announcement").textContent(),
    /resetată.*gol/,
  );
  await toggle.click();
  await disclosure(true);
  assert.match(await demo.locator(".shop-empty-cart").textContent(), /gol/);

  // Reduced motion keeps this local summary usable with no animated height.
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await demo
      .locator(".shop-cart-disclosure")
      .evaluate((element) => getComputedStyle(element).transitionDuration),
    "0s",
  );
  await add.click();
  assert.equal(await total.textContent(), "60 lei");
  await reset.click();
  await disclosure(false);
  const contact = page.locator(".shop-contact-button");
  assert.equal(await contact.getAttribute("href"), "/contact");
  assert.equal(
    await page.locator(".shop-agency-link").getAttribute("href"),
    "/contact",
  );
  assert.equal(
    await page.locator(".shop-contact-secondary").getAttribute("href"),
    "/servicii",
  );
  assert.equal(
    await contact.evaluate((link) => !!link.closest(".shop-demonstration")),
    false,
  );
  assert.ok(
    submissions.every(({ url }) => new URL(url).pathname.startsWith("/_next/")),
    `Demo sent a non-development request: ${JSON.stringify(submissions)}`,
  );
  await contact.click();
  await page.waitForURL("**/contact");
  assert.equal(await page.locator("#contact-form").count(), 1);
  assert.deepEqual(errors, []);
  console.log(
    "PASS Magazin online: native keyboard formats/prices, quantity bounds, aggregate/mixed totals, inert disclosure and persistence, variant removal, reset focus, stable real image, responsive headings 320–1920px, initial/populated desktop/mobile Axe, reduced motion, separate contact route and no order submissions",
  );
} finally {
  await browser.close();
}
