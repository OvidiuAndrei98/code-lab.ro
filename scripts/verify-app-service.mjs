import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = process.env.SITE_URL || "http://127.0.0.1:3000";
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
  await page.goto(`${base}/servicii/aplicatii-web`, {
    waitUntil: "networkidle",
  });
  await page.evaluate(() => document.fonts.ready);

  const demo = page.locator(".app-demo");
  const body = demo.locator(".app-workspace-body");
  const detail = demo.locator("#app-selected-title");
  const pending = demo.locator(".app-request-group").nth(0);
  const programmed = demo.locator(".app-request-group").nth(1);
  const undo = demo.locator(".app-undo");
  const reset = demo.locator(".app-reset");
  const back = demo.locator(".app-mobile-back");
  const confirm = demo.locator(".app-confirm");
  const cancel = demo.locator(".app-cancel");
  const row = (id) => demo.locator(`[data-request-id="${id}"]`);
  const slot = (time) =>
    demo.locator(`input[name="request-slot"][value="${time}"]`);
  const isFocused = (locator) =>
    locator.evaluate((node) => document.activeElement === node);
  const audit = async (label) => {
    await page.waitForFunction(() =>
      document
        .querySelector(".app-demo")
        .getAnimations({ subtree: true })
        .every((animation) => animation.playState !== "running"),
    );
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
  const counts = async (expectedPending, expectedScheduled) => {
    await expect(demo.locator("[data-pending-count]")).toHaveText(
      String(expectedPending),
    );
    await expect(demo.locator("[data-scheduled-count]")).toHaveText(
      String(expectedScheduled),
    );
    await expect(pending.locator("[data-request-id]")).toHaveCount(
      expectedPending,
    );
    await expect(programmed.locator("[data-request-id]")).toHaveCount(
      expectedScheduled,
    );
    const ids = await demo
      .locator("[data-request-id]")
      .evaluateAll((rows) => rows.map((item) => item.dataset.requestId));
    assert.equal(ids.length, 3);
    assert.equal(
      new Set(ids).size,
      3,
      "A request appears exactly once across both lists",
    );
  };
  const select = async (id) => {
    if (await back.isVisible()) await back.click();
    await row(id).click();
    await expect(row(id)).toHaveAttribute("aria-pressed", "true");
  };
  const schedule = async (id, time) => {
    await select(id);
    await slot(time).check();
    await confirm.click();
    await expect(
      demo.locator(".app-booked-state #app-action-title"),
    ).toHaveText(time);
    await expect(row(id).locator(".app-row-status")).toHaveText(
      `Programată · ${time}`,
    );
  };
  const fresh = async () => {
    await reset.click();
    await counts(3, 0);
    await expect(undo).toBeDisabled();
    assert.equal(
      await isFocused(reset),
      true,
      "Reset retains a visible, logical focus target",
    );
  };

  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveText("Aplicații web.");
  await expect(demo.locator("#app-demo-title")).toHaveText(
    "Demonstrație interactivă · date de exemplu",
  );
  assert.match(
    await page.locator(".app-introduction").innerText(),
    /Construim interfețe/,
  );
  await counts(3, 0);
  await expect(undo).toBeDisabled();
  await expect(slot("10:00")).toBeDisabled();
  for (const time of ["11:30", "14:00", "15:30"])
    await expect(slot(time)).toBeEnabled();
  await audit("Desktop initial accessibility");

  for (const [id, title, category] of [
    ["discutie", "Discuție inițială", "Discuție"],
    ["prezentare", "Prezentare de proiect", "Prezentare"],
    ["revizuire", "Revizuire de conținut", "Revizuire"],
  ]) {
    await select(id);
    await expect(detail).toHaveText(title);
    await expect(demo.locator(".app-detail-facts dd").first()).toHaveText(
      category,
    );
    await expect(demo.locator(".app-detail-facts dd").last()).toHaveText(
      "30 min",
    );
  }

  // Invalid submission explains the missing choice and changes no booking.
  await confirm.click();
  await counts(3, 0);
  await expect(demo.locator("#app-slot-error")).toHaveAttribute(
    "role",
    "alert",
  );
  await expect(demo.locator("#app-slot-error")).toContainText(
    "Alege un interval",
  );
  assert.equal(await isFocused(slot("11:30")), true);
  await expect(slot("11:30")).toHaveAttribute("aria-invalid", "true");
  await expect(slot("11:30")).toHaveAttribute(
    "aria-describedby",
    "app-slot-error",
  );
  await expect(undo).toBeDisabled();

  // Native radio navigation skips the unavailable interval and keeps real state.
  await slot("11:30").focus();
  await page.keyboard.press("Space");
  await expect(slot("11:30")).toBeChecked();
  await page.keyboard.press("ArrowRight");
  await expect(slot("14:00")).toBeChecked();
  await page.keyboard.press("ArrowLeft");
  await expect(slot("11:30")).toBeChecked();
  await expect(demo.locator("#app-slot-error")).toHaveAttribute(
    "data-error",
    "false",
  );

  await fresh();
  await schedule("discutie", "11:30");
  await counts(2, 1);
  assert.equal(
    await isFocused(detail),
    true,
    "Confirmation focuses the selected request result",
  );
  await expect(programmed.locator('[data-request-id="discutie"]')).toHaveCount(
    1,
  );
  await expect(demo.locator('[role="status"]')).toContainText("11:30");
  await select("prezentare");
  await expect(slot("11:30")).toBeDisabled();
  await expect(slot("10:00")).toBeDisabled();
  await expect(slot("14:00")).toBeEnabled();
  await expect(slot("11:30").locator("..")).toContainText("Ocupat");
  await slot("14:00").check();
  await confirm.click();
  await counts(1, 2);
  await undo.click();
  await counts(2, 1);
  await expect(detail).toHaveText("Prezentare de proiect");
  await expect(slot("14:00")).toBeEnabled();
  await expect(slot("11:30")).toBeDisabled();
  await expect(row("discutie").locator(".app-row-status")).toHaveText(
    "Programată · 11:30",
  );
  assert.equal(await isFocused(detail), true);

  // Cancellation and its undo restore both halves of the same relationship.
  await select("discutie");
  await cancel.click();
  await counts(3, 0);
  await expect(slot("11:30")).toBeEnabled();
  await expect(row("discutie").locator(".app-row-status")).toHaveText(
    "De programat",
  );
  await undo.click();
  await counts(2, 1);
  await expect(demo.locator(".app-booked-state #app-action-title")).toHaveText(
    "11:30",
  );
  await select("revizuire");
  await expect(slot("11:30")).toBeDisabled();
  await schedule("prezentare", "14:00");
  await schedule("revizuire", "15:30");
  await counts(0, 3);
  await expect(pending.locator(".app-list-empty")).toHaveText(
    "Toate solicitările sunt programate.",
  );
  await audit("Desktop all scheduled accessibility");
  await undo.click();
  await counts(1, 2);
  for (const time of ["10:00", "11:30", "14:00"])
    await expect(slot(time)).toBeDisabled();
  await expect(slot("15:30")).toBeEnabled();
  await fresh();

  // Rapid repeated submission must create one reservation, with one undo.
  for (let repeat = 0; repeat < 3; repeat++) {
    await select("discutie");
    await slot("11:30").check();
    await demo.locator("form").evaluate((form) => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });
    await counts(2, 1);
    await select("prezentare");
    await expect(slot("11:30")).toBeDisabled();
    await undo.click();
    await counts(3, 0);
    await expect(slot("11:30")).toBeEnabled();
    await expect(undo).toBeDisabled();
  }

  // Phone navigation uses successive views, never a compressed three-column UI.
  await page.setViewportSize({ width: 390, height: 844 });
  await fresh();
  await expect(body).toHaveAttribute("data-mobile-view", "list");
  await expect(demo.locator(".app-request-list")).toBeVisible();
  await expect(demo.locator(".app-request-detail")).toBeHidden();
  await expect(demo.locator(".app-request-action")).toBeHidden();
  await audit("Mobile list accessibility");
  await row("prezentare").focus();
  await page.keyboard.press("Enter");
  await expect(body).toHaveAttribute("data-mobile-view", "detail");
  await expect(detail).toHaveText("Prezentare de proiect");
  assert.equal(await isFocused(detail), true);
  await expect(demo.locator(".app-request-list")).toBeHidden();
  await expect(demo.locator(".app-request-action")).toBeVisible();
  await back.click();
  assert.equal(await isFocused(row("prezentare")), true);
  await page.keyboard.press("Enter");
  await confirm.click();
  assert.equal(await isFocused(slot("11:30")), true);
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  assert.equal(
    await isFocused(confirm),
    true,
    "Radio group is one natural tab stop before confirmation",
  );
  await page.keyboard.press("Enter");
  await counts(2, 1);
  assert.equal(await isFocused(detail), true);
  await audit("Mobile scheduled detail accessibility");
  await back.click();
  await expect(row("prezentare")).toBeFocused();
  await undo.click();
  await counts(3, 0);
  await expect(body).toHaveAttribute("data-mobile-view", "list");
  await expect(row("prezentare")).toBeFocused();
  await select("discutie");
  await audit("Mobile unscheduled detail accessibility");

  // Reflow includes both mobile views, tablet edges and the broad desktop grid.
  for (const width of [320, 390, 600, 768, 900, 901, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: width <= 900 ? 844 : 1000 });
    await fresh();
    for (const view of width <= 900 ? ["list", "detail"] : ["wide"]) {
      if (view === "detail") await select("discutie");
      const layout = await page.evaluate(() => {
        const clipped = [
          ...document.querySelectorAll(
            ".app-service-page h1, .app-service-page h2, .app-service-page h3, .app-service-page h4",
          ),
        ].flatMap((heading) => {
          if (!heading.getClientRects().length) return [];
          const range = document.createRange();
          range.selectNodeContents(heading);
          return [...range.getClientRects()]
            .filter(
              (rect) =>
                rect.width && (rect.left < -1 || rect.right > innerWidth + 1),
            )
            .map((rect) => ({
              text: heading.textContent,
              left: rect.left,
              right: rect.right,
            }));
        });
        const main = document.querySelector(".app-service-page");
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          contentOverflow: main.scrollWidth > main.clientWidth + 1,
          clipped,
        };
      });
      assert.equal(
        layout.overflow,
        false,
        `Document overflow ${width}px ${view}`,
      );
      assert.equal(
        layout.contentOverflow,
        false,
        `Content overflow ${width}px ${view}`,
      );
      assert.deepEqual(
        layout.clipped,
        [],
        `Clipped headings ${width}px ${view}`,
      );
    }
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await fresh();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await schedule("discutie", "11:30");
  await counts(2, 1);
  const running = await demo.evaluate(
    (element) =>
      element
        .getAnimations({ subtree: true })
        .filter((animation) => animation.playState === "running").length,
  );
  assert.equal(running, 0, "Reduced motion updates the workflow directly");
  await select("prezentare");
  await expect(slot("11:30")).toBeDisabled();
  await undo.click();
  await counts(3, 0);
  await expect(slot("11:30")).toBeEnabled();
  await audit("Reduced-motion restored accessibility");

  const contact = page.locator(".app-contact-button");
  await expect(contact).toHaveAttribute("href", "/contact");
  await expect(page.locator(".app-agency-link")).toHaveAttribute(
    "href",
    "/contact",
  );
  await expect(page.locator(".app-breadcrumb a")).toHaveAttribute(
    "href",
    "/servicii",
  );
  assert.ok(
    submissions.every(({ url }) => new URL(url).pathname.startsWith("/_next/")),
    `Demo sent data outside the development runtime: ${JSON.stringify(submissions)}`,
  );
  await contact.click();
  await page.waitForURL("**/contact");
  await expect(page.locator("#contact-form")).toHaveCount(1);
  assert.deepEqual(errors, []);
  console.log(
    "PASS Aplicații web: three requests and real derived counts, invalid-choice feedback/focus, native radios and keyboard, reservation/availability consistency, cancellation/undo/reset, repeated and rapid submission, phone successive views/focus, reflow 320–1920px, initial/programmed desktop/mobile Axe, reduced motion, real contact/navigation and no backend submission",
  );
} finally {
  await browser.close();
}
