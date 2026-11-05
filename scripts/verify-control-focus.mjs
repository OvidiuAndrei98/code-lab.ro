import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { inspect, contrast } from "./audit-control-focus.mjs";

const directory = "artifacts/control-focus-audit";
const base = process.env.SITE_URL || "http://127.0.0.1:3000";
await mkdir(directory, { recursive: true });
const report = [];
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
      acceptDownloads: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const states = [];
    const visit = (route) =>
      page.goto(base + route, { waitUntil: "networkidle" });
    async function focus(control, name, image = false) {
      await page.keyboard.press("Tab");
      await control.evaluate((e) => {
        e.scrollIntoView({ block: "center", behavior: "instant" });
        e.focus({ preventScroll: true });
      });
      await expect(control).toBeFocused();
      const state = await control.evaluate(inspect);
      assert.equal(state.focusVisible, true, name);
      assert.deepEqual(state.clipping, [], `${name}: complete focus geometry`);
      assert.equal(state.shadow, "none", `${name}: no shadow ring`);
      if (state.outline !== "none" && state.width > 0)
        assert.ok(
          contrast(state.color, state.background) >= 3,
          `${name}: focus contrast`,
        );
      states.push({ name, ...state });
      if (image) {
        const rect = await control.boundingBox();
        await page.screenshot({
          path: `${directory}/after-${width}-${name}.png`,
          clip: {
            x: Math.max(0, rect.x - 12),
            y: Math.max(0, rect.y - 12),
            width: Math.min(width - Math.max(0, rect.x - 12), rect.width + 24),
            height: rect.height + 24,
          },
        });
      }
    }

    await visit("/");
    for (const selector of [
      ".work-section-heading .quiet-link",
      ".home-work-media",
      ".home-work-destination",
    ])
      await focus(
        page.locator(selector).first(),
        selector === ".home-work-destination" ? "home-project-link" : selector,
      );

    await visit("/servicii/magazin-online");
    const add = page.locator(".shop-add-button");
    await focus(add, "shop-add", true);
    await page.mouse.click(5, 5);
    await add.click();
    assert.equal(await add.evaluate((e) => e.matches(":focus-visible")), false);
    await expect(page.locator(".shop-cart-disclosure")).toHaveAttribute(
      "data-open",
      "true",
    );
    await focus(
      page.locator(".shop-cart-item button").first(),
      "cart-remove",
      true,
    );
    await focus(page.locator(".shop-reset"), "cart-reset", true);
    await focus(page.locator(".shop-cart-toggle"), "cart-toggle");
    await focus(page.locator(".shop-contact-button"), "shop-contact");
    await page.locator(".shop-reset").click();
    await expect(page.locator(".shop-cart-item")).toHaveCount(0);

    await visit("/servicii/aplicatii-web");
    const request = page.locator(".app-request-row").first();
    await request.click();
    const slot = page.locator(".app-slot input:not(:disabled)").first();
    await focus(slot, "app-slot");
    await slot.check();
    await focus(page.locator(".app-confirm"), "app-confirm", true);
    await page.locator(".app-confirm").click();
    const cancel = page.locator(".app-cancel");
    await expect(cancel).toBeVisible();
    await focus(cancel, "app-cancel");
    await cancel.hover();
    const hovered = await cancel.evaluate(inspect);
    assert.ok(
      contrast(hovered.color, hovered.background) >= 3,
      "Cancel retains focus contrast during hover",
    );
    await focus(page.locator(".app-undo"), "app-undo");
    await page.locator(".app-undo").click();
    await expect(page.locator(".app-confirm")).toBeVisible();
    await focus(page.locator(".app-reset"), "app-reset");
    if (width <= 900) {
      await focus(page.locator(".app-mobile-back"), "app-back");
      await page.locator(".app-mobile-back").click();
    }
    await focus(request, "app-selected-row");

    await visit("/studio");
    for (let i = 0; i < 3; i++) {
      const note = page.locator(".studio-note-trigger").nth(i);
      await page.mouse.click(5, 5);
      await note.click();
      assert.equal(
        await note.evaluate((e) => e.matches(":focus-visible")),
        false,
      );
      await focus(note, `studio-note-${i + 1}`);
      await expect(note).toHaveAttribute("aria-pressed", "true");
    }

    await visit("/contact");
    const budget = page.getByRole("combobox");
    await focus(budget, "budget-trigger");
    await page.keyboard.press("Space");
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("ArrowDown");
    const highlighted = page.locator('[role="option"][data-highlighted]');
    await expect(highlighted).toHaveCount(1);
    assert.notEqual(
      await highlighted.evaluate(
        (e) => getComputedStyle(e, "::before").backgroundColor,
      ),
      "rgba(0, 0, 0, 0)",
    );
    await page.keyboard.press("Enter");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await page.locator(".brief-service-option input").first().check();
    await page
      .locator("#contact-message")
      .fill(
        "Exemplu local pentru verificarea stărilor de focus ale formularului.",
      );
    await page.locator("#contact-name").fill("Test local");
    await page.locator("#contact-email").fill("test@example.com");
    const submit = page.locator(".brief-form .brief-primary");
    await focus(submit, "brief-prepare");
    await submit.click();
    await expect(page.locator(".brief-ready")).toBeVisible();
    await focus(page.locator(".brief-ready .brief-primary"), "brief-download");
    await focus(page.locator(".brief-edit"), "brief-edit");
    await page.locator(".brief-edit").click();
    await expect(page.locator("#contact-name")).toHaveValue("Test local");

    assert.deepEqual(errors, []);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    report.push({ width, states });
    await context.close();
    console.log(
      `PASS ${width}: complete visible focus in dynamic cart, booking, studio notes, budget and brief result; pointer state independent`,
    );
  }
} finally {
  await writeFile(
    `${directory}/dynamic-verification.json`,
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
