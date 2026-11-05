import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = process.env.SITE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const choices = [
  "Îl stabilim împreună",
  "Sub 2.000 €",
  "2.000 – 5.000 €",
  "5.000 – 10.000 €",
  "Peste 10.000 €",
];
const report = {
  layouts: [],
  states: [],
  autofill: null,
  downloads: 0,
  focusGuardAuditException: null,
};
await mkdir("artifacts", { recursive: true });

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  });
  const page = await context.newPage();
  const runtimeErrors = [];
  const outbound = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("request", (request) => {
    if (
      !["GET", "HEAD"].includes(request.method()) &&
      !new URL(request.url()).pathname.startsWith("/_next/")
    )
      outbound.push({ method: request.method(), url: request.url() });
  });

  const form = page.locator("#contact-form");
  const name = page.locator("#contact-name");
  const email = page.locator("#contact-email");
  const message = page.locator("#contact-message");
  const budget = page.getByRole("combobox", { name: /Buget orientativ/ });
  const listbox = page.getByRole("listbox");
  const options = page.getByRole("option");
  const submit = form.getByRole("button", { name: "Pregătește brief-ul" });
  const ready = page.locator(".brief-ready");
  const values = () =>
    form.evaluate((element) => Object.fromEntries(new FormData(element)));
  const open = async (width = 1440, height = 1000) => {
    await page.setViewportSize({ width, height });
    await page.goto(`${base}/contact`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await expect(budget).toBeVisible();
  };
  const settled = async () => {
    await page.waitForFunction(() =>
      document
        .getAnimations()
        .every(
          (animation) =>
            animation.playState !== "running" ||
            animation.effect?.getTiming().iterations === Infinity,
        ),
    );
  };
  const fieldMetrics = async () =>
    page.locator("#contact-form .brief-field").evaluateAll((fields) =>
      fields.map((field) => {
        const control = field.querySelector(
          'input:not([type="hidden"]), textarea, [role="combobox"]',
        );
        const label = field.querySelector("label");
        const style = getComputedStyle(control);
        const box = control.getBoundingClientRect();
        const labelBox = label.getBoundingClientRect();
        return {
          id: control.id,
          fontSize: parseFloat(style.fontSize),
          lineHeight: style.lineHeight,
          padding: style.padding,
          border: style.border,
          borderTop: style.borderTopWidth,
          borderRight: style.borderRightWidth,
          borderBottom: style.borderBottom,
          borderLeft: style.borderLeftWidth,
          outline: style.outline,
          outlineStyle: style.outlineStyle,
          boxShadow: style.boxShadow,
          color: style.color,
          backgroundColor: style.backgroundColor,
          labelPosition: getComputedStyle(label).position,
          labelGap: box.top - labelBox.bottom,
          height: box.height,
          width: box.width,
          x: box.x,
          y: box.y + scrollY,
          labelY: labelBox.y + scrollY,
          focused: document.activeElement === control,
          invalid: control.getAttribute("aria-invalid"),
        };
      }),
    );
  const audit = async (label) => {
    await settled();
    // Base UI's visually clipped, empty sentinels transfer focus immediately;
    // keyboard checks below cover both directions instead of treating them as UI.
    const builder = new AxeBuilder({ page })
      .include(".contact-editorial")
      .exclude("[data-base-ui-focus-guard]")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]);
    if (await listbox.isVisible()) builder.include('[role="listbox"]');
    const results = await builder.analyze();
    assert.deepEqual(
      results.violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map((node) => node.target),
      })),
      [],
      label,
    );
  };
  const assertViewport = async () => {
    const geometry = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      rootWidth: document.documentElement.clientWidth,
      viewportWidth: innerWidth,
      bodyOverflow: getComputedStyle(document.body).overflow,
      scrollLocks: document.querySelectorAll("[data-scroll-locked]").length,
    }));
    assert.equal(geometry.overflow, false, "No horizontal overflow");
    return geometry;
  };
  const assertPopup = async () => {
    await expect(listbox).toBeVisible();
    await expect(options).toHaveCount(choices.length);
    assert.deepEqual(await options.allTextContents(), choices);
    const bounds = await listbox.boundingBox();
    const trigger = await budget.boundingBox();
    const viewport = page.viewportSize();
    assert.ok(bounds.x >= -1 && bounds.y >= -1, "Popup stays in viewport");
    assert.ok(bounds.x + bounds.width <= viewport.width + 1);
    assert.ok(bounds.y + bounds.height <= viewport.height + 1);
    assert.ok(
      Math.abs(bounds.width - trigger.width) <= 2,
      "Popup follows trigger width",
    );
    for (const option of await options.all()) {
      const box = await option.boundingBox();
      assert.ok(box.height >= 44, "Options have comfortable hit targets");
    }
    await assertViewport();
    return bounds;
  };

  await open();
  await expect(form.locator('[aria-invalid="true"]')).toHaveCount(0);
  await expect(name).not.toHaveAttribute("placeholder", "Numele tău");
  await expect(name).toHaveAttribute("autocomplete", "name");
  await expect(email).toHaveAttribute("autocomplete", "email");
  assert.equal((await values()).budget, choices[0]);
  const empty = await fieldMetrics();
  report.states.push({ state: "empty", fields: empty });
  for (const field of empty) {
    assert.equal(field.labelPosition, "static");
    assert.ok(field.labelGap >= 8, `${field.id}: label clear of fill area`);
    assert.ok(field.fontSize >= 18, `${field.id}: comfortable desktop type`);
    assert.ok(field.height >= 48, `${field.id}: generous control height`);
  }
  await page.screenshot({
    path: "artifacts/contact-fields-empty-desktop.png",
    fullPage: true,
  });
  await audit("Empty desktop fields accessibility");

  // A coherent line state must not bring back the old offset rectangle.
  await name.focus();
  await settled();
  const focus = await fieldMetrics();
  report.states.push({ state: "name-focus", fields: focus });
  const nameFocus = focus.find((field) => field.id === "contact-name");
  assert.equal(nameFocus.focused, true);
  assert.equal(
    nameFocus.outlineStyle,
    "none",
    "Scoped field focus replaces offset rectangle",
  );
  assert.equal(nameFocus.boxShadow, "none", "No stacked focus ring shadow");
  const nameEmpty = empty.find((field) => field.id === "contact-name");
  for (const property of ["height", "width", "x", "y", "labelY"])
    assert.ok(
      Math.abs(nameFocus[property] - nameEmpty[property]) <= 1,
      `${property} stable at focus`,
    );
  await page
    .locator(".brief-identity")
    .screenshot({ path: "artifacts/contact-fields-focus-desktop.png" });

  // Keyboard selection, cancellation, focus restoration and ordinary Tab exit.
  await budget.focus();
  await page.keyboard.press("Enter");
  await assertPopup();
  const sentinels = await page
    .locator("[data-base-ui-focus-guard]")
    .evaluateAll((elements) =>
      elements.map((element) => {
        const bounds = element.getBoundingClientRect();
        return {
          type: element.getAttribute("data-type"),
          hidden: element.getAttribute("aria-hidden"),
          text: element.textContent,
          width: bounds.width,
          height: bounds.height,
          clipped: getComputedStyle(element).clipPath,
        };
      }),
    );
  assert.ok(sentinels.length > 0);
  for (const sentinel of sentinels) {
    assert.equal(sentinel.hidden, "true");
    assert.equal(sentinel.text.trim(), "");
    assert.ok(sentinel.width <= 1 && sentinel.height <= 1);
    assert.equal(sentinel.clipped, "inset(50%)");
  }
  report.focusGuardAuditException = {
    selector: "[data-base-ui-focus-guard]",
    reason:
      "Only Base UI's empty, clipped 1px focus-transfer sentinels are excluded from Axe; actual popup controls remain audited. Forward Tab and reverse Tab are tested explicitly without trapping focus.",
    sentinels,
  };
  await audit("Open desktop budget select accessibility");
  await page.screenshot({
    path: "artifacts/contact-fields-select-open-desktop.png",
  });
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(listbox).toBeHidden();
  await expect(budget).toBeFocused();
  assert.equal((await values()).budget, choices[1]);
  await expect(budget).toContainText(choices[1]);
  await budget.press("Enter");
  await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");
  await expect(budget).toBeFocused();
  assert.equal((await values()).budget, choices[1]);
  await budget.press("Enter");
  await page.keyboard.press("Tab");
  await expect(listbox).toBeHidden();
  await expect(name).toBeFocused();
  assert.equal((await values()).budget, choices[1]);
  await budget.focus();
  await budget.press("Enter");
  await page.keyboard.press("Shift+Tab");
  await expect(listbox).toBeHidden();
  await expect(budget).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(message).toBeFocused();
  await budget.click();
  await expect(listbox).toBeVisible();
  await page.locator('label[for="contact-name"]').click();
  await expect(listbox).toBeHidden();

  // Popup positioning follows available viewport space without moving the form.
  await page.evaluate(() => {
    const trigger = document.querySelector("#contact-budget");
    const top = trigger.getBoundingClientRect().top + scrollY;
    window.dispatchEvent(
      new CustomEvent("codelab:scroll-to", {
        detail: { top: top - innerHeight + 120 },
      }),
    );
  });
  await budget.click();
  const flipped = await assertPopup();
  const triggerAtBottom = await budget.boundingBox();
  assert.ok(
    flipped.y + flipped.height <= triggerAtBottom.y + 2,
    "Popup flips above low trigger",
  );
  await page.keyboard.press("Escape");

  // Error and focused-error keep labels, values and geometry stable.
  await page.locator('[name="service"]').first().check();
  await message.fill("O aplicație pentru un proces de lucru.");
  await name.fill("");
  await email.fill("incomplet");
  const beforeError = await fieldMetrics();
  await submit.click();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(name).toBeFocused();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#contact-name-error")).toContainText(
    "Scrie cum te numești.",
  );
  await settled();
  const invalid = await fieldMetrics();
  report.states.push({ state: "focused-error", fields: invalid });
  for (const id of ["contact-name", "contact-email"]) {
    const before = beforeError.find((field) => field.id === id);
    const after = invalid.find((field) => field.id === id);
    for (const property of ["height", "width", "x", "y", "labelY"])
      assert.ok(
        Math.abs(after[property] - before[property]) <= 1,
        `${id} ${property} stable on error`,
      );
    const ids = (
      await page.locator(`#${id}`).getAttribute("aria-describedby")
    ).split(/\s+/);
    assert.ok(ids.includes(`${id}-error`));
  }
  await page
    .locator(".brief-identity")
    .screenshot({ path: "artifacts/contact-fields-error-desktop.png" });
  await audit("Desktop focused error accessibility");
  await name.fill("Ștefăniță-Mălin");
  await email.fill("atelier@example.test");
  await expect(name).toHaveAttribute("aria-invalid", "false");
  await expect(email).toHaveAttribute("aria-invalid", "false");
  await expect(name).toHaveValue("Ștefăniță-Mălin");

  // Browser Autofill, rather than synthetic JS assignment, exercises platform styling.
  await name.fill("");
  await email.fill("");
  const cdp = await context.newCDPSession(page);
  await cdp.send("Autofill.enable");
  const documentNode = await cdp.send("DOM.getDocument");
  const nameNode = await cdp.send("DOM.querySelector", {
    nodeId: documentNode.root.nodeId,
    selector: "#contact-name",
  });
  const describedNode = await cdp.send("DOM.describeNode", {
    nodeId: nameNode.nodeId,
  });
  await name.focus();
  await cdp.send("Autofill.trigger", {
    fieldId: describedNode.node.backendNodeId,
    address: {
      fields: [
        { name: "NAME_FULL", value: "Ana-Maria Șerban" },
        { name: "NAME_FIRST", value: "Ana-Maria" },
        { name: "NAME_LAST", value: "Șerban" },
        { name: "EMAIL_ADDRESS", value: "ana@example.test" },
      ],
    },
  });
  await expect(name).toHaveValue("Ana-Maria Șerban");
  await expect(email).toHaveValue("ana@example.test");
  report.autofill = await name.evaluate((element) => ({
    value: element.value,
    actualAutofill: element.matches(":-webkit-autofill"),
    color: getComputedStyle(element).color,
    fillColor: getComputedStyle(element).webkitTextFillColor,
    background: getComputedStyle(element).backgroundColor,
  }));
  assert.equal(
    report.autofill.actualAutofill,
    true,
    "Actual browser autofill applied",
  );
  await page
    .locator(".brief-identity")
    .screenshot({ path: "artifacts/contact-fields-autofill-desktop.png" });

  // Every sample budget remains optional and the submitted local file uses its real value.
  for (const choice of choices) {
    await budget.click();
    await page.getByRole("option", { name: choice, exact: true }).click();
    assert.equal((await values()).budget, choice);
    await expect(budget).toContainText(choice);
  }
  const intended = await values();
  await submit.click();
  await expect(ready).toBeVisible();
  await expect(ready.getByRole("heading")).toBeFocused();
  const pending = page.waitForEvent("download");
  await ready.getByRole("button", { name: /^Descarcă/ }).click();
  const file = await pending;
  assert.equal(file.suggestedFilename(), "brief-codelab.txt");
  assert.equal(await file.failure(), null);
  const text = await readFile(await file.path(), "utf8");
  for (const value of Object.values(intended)) assert.ok(text.includes(value));
  report.downloads++;
  await ready.getByRole("button", { name: /edit/i }).click();
  assert.deepEqual(
    await values(),
    intended,
    "Edit preserves all fields, including Select",
  );

  // Narrow, intermediate and short screens retain readable text and popup containment.
  for (const [width, height] of [
    [320, 640],
    [390, 430],
    [390, 844],
    [600, 700],
    [768, 800],
    [1024, 760],
    [1440, 1000],
  ]) {
    await page.setViewportSize({ width, height });
    const layout = await assertViewport();
    const fields = await fieldMetrics();
    for (const field of fields) {
      assert.ok(
        field.fontSize >= 16,
        `${width}: ${field.id} minimum text size`,
      );
      assert.ok(field.height >= 48, `${width}: ${field.id} touch target`);
      assert.ok(field.labelGap >= 8, `${width}: ${field.id} label gap`);
      assert.ok(
        field.x >= -1 && field.x + field.width <= width + 1,
        `${width}: ${field.id} no clipping`,
      );
    }
    await budget.click();
    const popup = await assertPopup();
    await page.keyboard.press("Escape");
    report.layouts.push({ width, height, ...layout, popup });
  }

  // Capture a clean filled state with selected and highlighted options distinct.
  await budget.click();
  await page.getByRole("option", { name: choices[1], exact: true }).hover();
  await settled();
  await page.screenshot({
    path: "artifacts/contact-fields-select-open-desktop.png",
  });
  await page.keyboard.press("Escape");

  // Touch and reduced motion preserve the same explicit selection and inline feedback.
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
  });
  const touch = await mobile.newPage();
  await touch.goto(`${base}/contact`, { waitUntil: "networkidle" });
  await touch.evaluate(() => document.fonts.ready);
  const touchBudget = touch.getByRole("combobox", { name: /Buget orientativ/ });
  await touchBudget.tap();
  await expect(touch.getByRole("listbox")).toBeVisible();
  await touch.screenshot({
    path: "artifacts/contact-fields-select-open-mobile.png",
  });
  assert.equal(
    await touch
      .getByRole("listbox")
      .evaluate((element) =>
        element
          .getAnimations({ subtree: true })
          .some((animation) => animation.playState === "running"),
      ),
    false,
    "Reduced motion has no running dropdown entrance",
  );
  await touch.getByRole("option", { name: choices[2], exact: true }).tap();
  await expect(touchBudget).toContainText(choices[2]);
  await touch.setViewportSize({ width: 390, height: 430 });
  await touchBudget.tap();
  await expect(touch.getByRole("listbox")).toBeVisible();
  const shortPopup = await touch.getByRole("listbox").boundingBox();
  assert.ok(shortPopup.y >= -1 && shortPopup.y + shortPopup.height <= 431);
  await touch.getByRole("option", { name: choices[4], exact: true }).tap();
  await expect(touchBudget).toContainText(choices[4]);
  await touch.locator("#contact-name").focus();
  const activeField = await touch.locator("#contact-name").boundingBox();
  assert.ok(
    activeField.y >= -1 && activeField.y + activeField.height <= 431,
    "Focused mobile field remains visible with 430px available height",
  );
  await touch.setViewportSize({ width: 390, height: 844 });
  await touch.locator('#contact-form button[type="submit"]').tap();
  await touch.locator("#contact-name").focus();
  await touch
    .locator(".brief-identity")
    .screenshot({ path: "artifacts/contact-fields-error-mobile.png" });
  assert.equal(
    await touch.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
    false,
  );
  const touchAudit = await new AxeBuilder({ page: touch })
    .include(".contact-editorial")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  assert.deepEqual(
    touchAudit.violations.map((violation) => violation.id),
    [],
    "Mobile reduced-motion validation accessibility",
  );
  await mobile.close();

  assert.deepEqual(runtimeErrors, [], "No browser exceptions");
  assert.deepEqual(
    outbound,
    [],
    "Brief remains local with no remote submission",
  );
  await writeFile(
    "artifacts/contact-fields-verification.json",
    JSON.stringify(report, null, 2),
  );
  console.log(
    "PASS Contact fields: stable labels/line focus/error geometry; accessible Select mouse/keyboard/Tab/Escape/outside/flip; exact FormData and downloaded brief; real browser Autofill; responsive320–1440; touch/reduced-motion; desktop/mobile Axe; screenshots saved.",
  );
} finally {
  await browser.close();
}
