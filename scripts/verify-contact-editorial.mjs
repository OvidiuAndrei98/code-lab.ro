import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = process.env.SITE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  });
  const page = await context.newPage();
  const errors = [];
  const outbound = [];
  const downloads = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (
      !["GET", "HEAD"].includes(request.method()) &&
      !new URL(request.url()).pathname.startsWith("/_next/")
    ) {
      outbound.push({
        method: request.method(),
        pathname: new URL(request.url()).pathname,
      });
    }
  });
  page.on("download", (download) => downloads.push(download));

  const form = page.locator("#contact-form");
  const service = form.locator('[name="service"]');
  const name = form.locator('[name="name"]');
  const email = form.locator('[name="email"]');
  const message = form.locator('[name="message"]');
  const budget = form.locator('[name="budget"]');
  const budgetTrigger = form.getByRole("combobox", {
    name: /Buget orientativ/,
  });
  const submit = form.locator('button[type="submit"]');
  const ready = page.locator(".brief-ready");
  const result = ready.getByRole("heading");
  const download = ready.getByRole("button", { name: /^Descarcă/ });
  const edit = ready.getByRole("button", { name: /edit/i });
  const hint = page.locator("#contact-service-hint");
  const values = () =>
    form.evaluate((element) => Object.fromEntries(new FormData(element)));
  const focused = (locator) =>
    locator.evaluate((element) => document.activeElement === element);
  const open = async (suffix = "") => {
    await page.goto(`${base}/contact${suffix}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
  };
  const audit = async (label) => {
    await page.waitForFunction(() =>
      document
        .getAnimations()
        .every(
          (animation) =>
            animation.playState !== "running" ||
            animation.effect?.getTiming().iterations === Infinity,
        ),
    );
    const findings = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    assert.deepEqual(
      findings.violations.map((violation) => ({
        id: violation.id,
        nodes: violation.nodes.map((node) =>
          node.target.map((selector) =>
            String(selector)
              .replace(/mailto:[^'"\]\s]+/g, "mailto:[configured]")
              .replace(
                /[\w.+%-]+@[\w.-]+\.[A-Za-z]{2,}/g,
                "[configured-email]",
              ),
          ),
        ),
      })),
      [],
      label,
    );
  };
  const assertValues = async (expected) =>
    assert.deepEqual(await values(), expected);
  const getBrief = async () => {
    const pending = page.waitForEvent("download");
    await download.click();
    const file = await pending;
    assert.equal(file.suggestedFilename(), "brief-codelab.txt");
    assert.equal(await file.failure(), null);
    return readFile(await file.path(), "utf8");
  };
  const initialBudget = [
    "Îl stabilim împreună",
    "Sub 2.000 €",
    "2.000 – 5.000 €",
    "5.000 – 10.000 €",
    "Peste 10.000 €",
  ];
  const synthetic = { name: "Test Editorial", email: "editorial@example.test" };

  await open();
  await expect(form).toHaveCount(1);
  await expect(submit).toHaveAccessibleName("Pregătește brief-ul");
  await expect(service).toHaveCount(4);
  await expect(form.locator('[name="service"]:checked')).toHaveCount(0);
  for (const control of [name, email, message])
    await expect(control).toHaveValue("");
  await expect(form.locator('[aria-invalid="true"]')).toHaveCount(0);
  await expect(budget).toHaveValue(initialBudget[0]);
  await budgetTrigger.click();
  assert.deepEqual(
    await page.getByRole("option").allTextContents(),
    initialBudget,
    "Keep existing budget ranges without invented minimums",
  );
  await page.keyboard.press("Escape");
  assert.equal(await budget.getAttribute("required"), null);
  await expect(name).toHaveAttribute("autocomplete", "name");
  await expect(email).toHaveAttribute("autocomplete", "email");
  await expect(email).toHaveAttribute("type", "email");
  assert.ok(
    ((await message.getAttribute("aria-describedby")) || "")
      .split(/\s+/)
      .includes("contact-service-hint"),
  );
  assert.equal(
    await name.getAttribute("minlength"),
    null,
    "Names have no arbitrary minimum length",
  );
  const positions = await form.evaluate((element) => {
    const y = (selector) =>
      element.querySelector(selector).getBoundingClientRect().top;
    return [
      y('[name="service"]'),
      y('[name="message"]'),
      y('[role="combobox"]'),
      y('[name="name"]'),
      y('button[type="submit"]'),
    ];
  });
  assert.ok(
    positions.every((y, index) => index === 0 || y >= positions[index - 1]),
    "Form follows project, message, budget, contact, final action order",
  );
  await audit("Initial desktop contact accessibility");

  for (const [query, expected] of [
    ["website", "Website"],
    ["ecommerce", "Magazin online"],
    ["aplicatii", "Aplicație web"],
    ["indecis", "Nu știu încă"],
  ]) {
    await open(`?service=${query}`);
    await expect(form.locator('[name="service"]:checked')).toHaveValue(
      expected,
    );
    await expect(message).toHaveValue("");
  }
  await open("?service=necunoscut");
  await expect(form.locator('[name="service"]:checked')).toHaveCount(0);
  await open();
  // Service-specific copy must fit the reserved helper space at every wrap edge.
  for (const width of [320, 390, 701, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 800 ? 844 : 1000 });
    const positions = [];
    for (let index = 0; index < 4; index++) {
      await service.nth(index).check();
      await page.waitForFunction(() =>
        document
          .querySelector("#contact-service-hint")
          .getAnimations()
          .every((animation) => animation.playState !== "running"),
      );
      positions.push(
        await message.evaluate(
          (element) => element.getBoundingClientRect().top + scrollY,
        ),
      );
    }
    assert.ok(
      Math.max(...positions) - Math.min(...positions) <= 1,
      `Textarea keeps its position across all service hints at ${width}px: ${positions.join(", ")}`,
    );
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open();
  const directContactConfigured =
    (await page.locator('a[href^="mailto:"]').count()) > 0;

  // Browser autofill fills both fields through their actual autocomplete hints.
  const cdp = await context.newCDPSession(page);
  await cdp.send("Autofill.enable");
  const documentNode = await cdp.send("DOM.getDocument");
  const nameNode = await cdp.send("DOM.querySelector", {
    nodeId: documentNode.root.nodeId,
    selector: '#contact-form input[name="name"]',
  });
  const describedNode = await cdp.send("DOM.describeNode", {
    nodeId: nameNode.nodeId,
  });
  await name.focus();
  await cdp.send("Autofill.trigger", {
    fieldId: describedNode.node.backendNodeId,
    address: {
      fields: [
        { name: "NAME_FULL", value: synthetic.name },
        { name: "NAME_FIRST", value: "Test" },
        { name: "NAME_LAST", value: "Editorial" },
        { name: "EMAIL_ADDRESS", value: synthetic.email },
      ],
    },
  });
  await expect(name).toHaveValue(synthetic.name);
  await expect(email).toHaveValue(synthetic.email);

  const draft =
    "Un proces simplu, cu informațiile păstrate între pași.\nÎncepem de la ce există deja.";
  await message.fill(draft);
  const serviceValues = await service.evaluateAll((radios) =>
    radios.map((radio) => radio.value),
  );
  const hints = [];
  for (const value of serviceValues) {
    await form.locator(`[name="service"][value="${value}"]`).check();
    await expect(message).toHaveValue(draft);
    await expect(name).toHaveValue(synthetic.name);
    await expect(email).toHaveValue(synthetic.email);
    hints.push(await hint.innerText());
  }
  assert.equal(
    new Set(hints).size,
    4,
    "Each service gets its own useful hint without changing user input",
  );
  assert.ok(hints.every((text) => text.trim().length > 15));

  // Native radios and the accessible Select preserve the complete keyboard path.
  await service.first().focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowRight");
  await expect(service.nth(1)).toBeChecked();
  await expect(message).toHaveValue(draft);
  await page.keyboard.press("Tab");
  await expect(message).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(budgetTrigger).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(name).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(email).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(submit).toBeFocused();
  await budgetTrigger.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(budget).toHaveValue(initialBudget[1]);

  // Invalid email keeps all entered values and focuses the relevant field.
  await email.fill("incomplet");
  const invalidData = await values();
  await submit.click();
  await expect(ready).toBeHidden();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  assert.equal(await focused(email), true);
  const emailErrorIds = ((await email.getAttribute("aria-describedby")) || "")
    .split(/\s+/)
    .filter(Boolean);
  const emailErrorText = await page.evaluate(
    (ids) =>
      ids.map((id) => document.getElementById(id)?.textContent || "").join(" "),
    emailErrorIds,
  );
  assert.match(emailErrorText, /email|e-mail/i);
  await assertValues(invalidData);
  await audit("Invalid email contact accessibility");
  await email.fill(synthetic.email);
  await name.fill("A");
  await message.fill("Un site.");
  const shortValidData = await values();

  // Exercise an actual browser resource failure, rather than a simulated timeout.
  await page.evaluate(() => {
    window.__contactOriginalCreateURL = URL.createObjectURL;
    URL.createObjectURL = () => {
      throw new Error("TEST: local object URL unavailable");
    };
  });
  await submit.click();
  await expect(submit).toBeEnabled();
  await expect(ready).toBeHidden();
  await expect(
    page.locator('.brief-generation-error[role="alert"]'),
  ).toContainText(/pregăt|gener|încerc/i);
  await assertValues(shortValidData);
  await page.evaluate(() => {
    URL.createObjectURL = window.__contactOriginalCreateURL;
  });

  // Hold real Blob processing so duplicate clicks and in-progress layout can be checked.
  const beforeBusy = await submit.boundingBox();
  await page.evaluate(() => {
    window.__contactOriginalArrayBuffer = Blob.prototype.arrayBuffer;
    window.__contactCreateCount = 0;
    Blob.prototype.arrayBuffer = function () {
      const blob = this;
      return new Promise((resolve, reject) => {
        window.__contactReleaseGeneration = () =>
          window.__contactOriginalArrayBuffer.call(blob).then(resolve, reject);
      });
    };
    URL.createObjectURL = function (blob) {
      window.__contactCreateCount += 1;
      return window.__contactOriginalCreateURL.call(URL, blob);
    };
    const form = document.querySelector("#contact-form");
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  });
  await expect(submit).toBeDisabled();
  await expect(form).toHaveAttribute("aria-busy", "true");
  const duringBusy = await submit.boundingBox();
  for (const dimension of ["width", "height"])
    assert.ok(
      Math.abs(beforeBusy[dimension] - duringBusy[dimension]) <= 1,
      `Main action retains ${dimension} while processing`,
    );
  for (const [key, value] of Object.entries(shortValidData)) {
    if (key !== "service")
      await expect(form.locator(`[name="${key}"]`)).toHaveValue(value);
  }
  await expect(form.locator('[name="service"]:checked')).toHaveValue(
    shortValidData.service,
  );
  await page.evaluate(async () => {
    await window.__contactReleaseGeneration();
    Blob.prototype.arrayBuffer = window.__contactOriginalArrayBuffer;
  });
  await expect(ready).toBeVisible();
  await expect(form).toBeHidden();
  await expect(form).toHaveAttribute("aria-busy", "false");
  assert.equal(
    await page.evaluate(() => window.__contactCreateCount),
    1,
    "Repeated submit prepares one real object URL",
  );
  await page.evaluate(() => {
    URL.createObjectURL = window.__contactOriginalCreateURL;
  });
  await expect(result).toContainText("Brief-ul e pregătit");
  await expect(result).toBeFocused();
  assert.equal(
    await name.evaluate((element) => {
      element.focus();
      return document.activeElement === element;
    }),
    false,
    "The hidden form is excluded from keyboard/programmatic focus",
  );
  assert.doesNotMatch(
    await ready.innerText(),
    /mesaj trimis|răspundem în|revenim în/i,
  );
  assert.equal(
    (await ready.locator('a[href^="mailto:"]').count()) > 0,
    directContactConfigured,
    "Ready state offers the same real contact configuration",
  );
  if (directContactConfigured)
    await expect(ready.locator('a[href^="mailto:"]')).toContainText(
      /email|e-mail/i,
    );
  await page.evaluate(() => {
    window.__contactOriginalAnchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download) throw new Error("TEST: local download unavailable");
      return window.__contactOriginalAnchorClick.call(this);
    };
  });
  await download.click();
  await expect(ready).toBeVisible();
  await expect(
    page.locator('.brief-generation-error[role="alert"]'),
  ).toContainText(/descărc/i);
  await assertValues(shortValidData);
  await page.evaluate(() => {
    HTMLAnchorElement.prototype.click = window.__contactOriginalAnchorClick;
  });
  const firstBrief = await getBrief();
  for (const value of Object.values(shortValidData))
    assert.ok(
      firstBrief.includes(String(value)),
      "Prepared brief includes the exact entered value",
    );
  const repeatedBrief = await getBrief();
  assert.equal(
    repeatedBrief,
    firstBrief,
    "Repeated download does not change or clear the brief",
  );
  await audit("Prepared brief desktop accessibility");
  await edit.click();
  await expect(form).toBeVisible();
  await expect
    .poll(
      () =>
        form.evaluate((element) => element.contains(document.activeElement)),
      { message: "Editing returns focus into the existing form" },
    )
    .toBe(true);
  await assertValues(shortValidData);

  // A long message remains complete through service changes and regeneration.
  const longMessage = Array.from(
    { length: 30 },
    (_, index) =>
      `Paragraf ${index + 1}: cerințe și observații pentru o interfață clară.`,
  ).join("\n");
  await message.fill(longMessage);
  await service.last().check();
  await expect(message).toHaveValue(longMessage);
  await name.fill(synthetic.name);
  const editedData = await values();
  await submit.click();
  await expect(ready).toBeVisible();
  const editedBrief = await getBrief();
  assert.ok(editedBrief.includes(longMessage));
  assert.ok(editedBrief.includes(synthetic.name));
  assert.notEqual(editedBrief, firstBrief);
  await edit.click();
  await assertValues(editedData);

  // The same page remains usable in short and narrow viewports.
  for (const width of [320, 390, 600, 768, 900, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: width < 800 ? 844 : 1000 });
    const layout = await page.evaluate(() => {
      const headings = [
        ...document.querySelectorAll(
          ".contact-editorial h1, .contact-editorial h2, .contact-editorial legend",
        ),
      ];
      const clipped = headings.flatMap((heading) => {
        if (!heading.getClientRects().length) return [];
        const range = document.createRange();
        range.selectNodeContents(heading);
        return [...range.getClientRects()]
          .filter(
            (rect) =>
              rect.width && (rect.left < -1 || rect.right > innerWidth + 1),
          )
          .map(() => heading.textContent);
      });
      const inputs = [
        ...document.querySelectorAll(
          '#contact-form input:not([type="radio"]):not([type="hidden"]), #contact-form textarea, #contact-form [role="combobox"]',
        ),
      ];
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        clipped,
        minimumInputFont: Math.min(
          ...inputs.map((element) =>
            parseFloat(getComputedStyle(element).fontSize),
          ),
        ),
      };
    });
    assert.equal(
      layout.overflow,
      false,
      `Contact horizontal overflow at ${width}px`,
    );
    assert.deepEqual(
      layout.clipped,
      [],
      `Contact headings clipped at ${width}px`,
    );
    assert.ok(
      layout.minimumInputFont >= 16,
      `Form input text avoids iOS zoom at ${width}px`,
    );
    await assertValues(editedData);
    if (width === 390) await audit("Filled mobile contact accessibility");
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await service.first().check();
  await expect(message).toHaveValue(longMessage);
  await submit.click();
  await expect(ready).toBeVisible();
  await expect(result).toBeFocused();
  const resultBounds = await result.boundingBox();
  assert.ok(
    resultBounds.y >= -1 && resultBounds.y + resultBounds.height <= 844 + 1,
    "Mobile result heading is visible after submitting from the form bottom",
  );
  const preview = ready.locator(".brief-result-text");
  await expect(preview).toHaveAttribute("role", "region");
  await expect(preview).toHaveAttribute("tabindex", "0");
  await preview.focus();
  await page.keyboard.press("End");
  await expect
    .poll(() => preview.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  await page.keyboard.press("Home");
  await expect
    .poll(() => preview.evaluate((element) => element.scrollTop))
    .toBe(0);
  await audit("Prepared mobile reduced-motion contact accessibility");
  await getBrief();
  await edit.click();
  await expect(message).toHaveValue(longMessage);

  // Empty input shows actionable errors only after submit, with first-field focus.
  await open();
  await expect(form.locator('[aria-invalid="true"]')).toHaveCount(0);
  await submit.click();
  await expect(ready).toBeHidden();
  const invalid = form.locator('[aria-invalid="true"]');
  assert.ok((await invalid.count()) > 0);
  assert.equal(await focused(invalid.first()), true);
  await expect(form.locator('[name="service"]:checked')).toHaveCount(0);
  await audit("Empty mobile contact validation accessibility");

  assert.deepEqual(
    outbound,
    [],
    "Contact prepares only a local brief; no remote data submission",
  );
  assert.deepEqual(errors, []);
  console.log(
    `PASS Contact editorial: explicit service context/hint/message preservation, actual browser autofill, full native keyboard flow, budget choices, inline validation and focus, short/long input, real generation failure/retry and busy duplicate guard, repeat download/edit/regeneration, responsive 320–1920px, desktop/mobile Axe and reduced motion; ${downloads.length} local downloads checked; contact-configured=${directContactConfigured}`,
  );
} finally {
  await browser.close();
}
