import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = process.env.SITE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
const ids = ["mobil", "formular", "interactiune"];
const trigger = (page, id) =>
  page.locator(`button[aria-controls="studio-note-${id}"]`);
const trackErrors = (page) =>
  page.on("pageerror", (error) => errors.push(error.message));
const audit = async (page, label) => {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  assert.deepEqual(
    result.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map((node) => node.target),
    })),
    [],
    label,
  );
};
const expectActive = async (page, id) => {
  await expect(trigger(page, id)).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.locator('.studio-note-trigger[aria-pressed="true"]'),
  ).toHaveCount(1);
  await expect(
    page.locator('.studio-margin-note[data-active="true"]'),
  ).toHaveCount(1);
  await expect(page.locator(`#studio-note-${id}`)).toHaveAttribute(
    "data-active",
    "true",
  );
  const mobile = await page.evaluate(() => innerWidth <= 760);
  await expect(page.locator(".studio-margin-note:visible")).toHaveCount(
    mobile ? 3 : 1,
  );
};
const settle = (page) =>
  page.waitForFunction(() =>
    document
      .querySelector(".studio-portrait-notes")
      .getAnimations({ subtree: true })
      .every((animation) => animation.playState !== "running"),
  );
const snapshot = (page) =>
  page.evaluate(() => {
    const rect = (element) => {
      const bounds = element.getBoundingClientRect();
      return {
        x: bounds.left + scrollX,
        y: bounds.top + scrollY,
        height: bounds.height,
        width: bounds.width,
      };
    };
    return {
      scrollY,
      notes: rect(document.querySelector(".studio-portrait-notes")),
      contact: rect(document.querySelector(".studio-portrait-contact")),
      sentences: [...document.querySelectorAll(".studio-note-sentence")].map(
        rect,
      ),
      triggers: [...document.querySelectorAll(".studio-note-trigger")].map(
        rect,
      ),
    };
  });
const assertStable = (before, after, label) => {
  assert.ok(
    Math.abs(before.scrollY - after.scrollY) <= 1,
    `${label}: changing the note must not move scroll position`,
  );
  for (const key of ["notes", "contact"])
    for (const axis of ["x", "y", "height", "width"])
      assert.ok(
        Math.abs(before[key][axis] - after[key][axis]) <= 1,
        `${label}: stable ${key} ${axis}`,
      );
  for (const key of ["sentences", "triggers"])
    for (let index = 0; index < before[key].length; index++)
      for (const axis of ["x", "y", "height", "width"])
        assert.ok(
          Math.abs(before[key][index][axis] - after[key][index][axis]) <= 1,
          `${label}: stable ${key}[${index}] ${axis}`,
        );
};

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  trackErrors(page);
  const open = async () => {
    await page.goto(`${base}/studio`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
  };
  await open();
  assert.match(await page.title(), /Studio/);
  await expect(page.locator("main h1")).toHaveCount(1);
  assert.deepEqual(
    await page.locator(".studio-portrait-opening h1 > span").allTextContents(),
    ["Suntem CODELAB.", "Design și cod,", "împreună."],
  );
  await expect(page.locator(".studio-portrait-opening-copy p")).toHaveText(
    "Agenție de web design și dezvoltare din București. Designul și dezvoltarea proiectului tău rămân în aceeași echipă.",
  );
  assert.ok(
    await page
      .locator(".studio-portrait-opening-copy")
      .evaluate(
        (element) => element.getBoundingClientRect().bottom < innerHeight,
      ),
    "Agency context is visible in the desktop first screen",
  );
  await expect(
    page.getByRole("heading", { name: /^Lucrezi direct cu noi\.?$/ }),
  ).toBeVisible();
  await expect(page.locator(".studio-portrait-reading p")).toHaveCount(3);
  const projects = page.locator('.studio-portrait-story a[href="/proiecte"]');
  await expect(projects).toHaveText(/Vezi proiectele/);
  await expect(page.locator("#studio-notes-title")).toHaveText(
    /Detalii de lucru\.?/i,
  );
  await expect(
    page.locator(
      "main iframe, main img, main video, main canvas, main .project-media, main .studio-portrait-material",
    ),
  ).toHaveCount(0);
  assert.doesNotMatch(await page.locator("main").innerText(), /FASON/);
  assert.equal(
    await page
      .locator(".studio-portrait-notes")
      .evaluate((element) =>
        element.nextElementSibling.classList.contains(
          "studio-portrait-contact",
        ),
      ),
    true,
    "Working notes lead directly to contact",
  );
  assert.ok(
    await page
      .locator(".studio-portrait-notes")
      .evaluate(
        (element) =>
          Math.abs(
            element.nextElementSibling.getBoundingClientRect().top -
              element.getBoundingClientRect().bottom,
          ) <= 1,
      ),
    "Notes and contact meet directly with normal internal padding and no leftover media spacer",
  );
  await expect(page.locator("#studio-contact-title")).toHaveText(
    /Spune-ne ce\s*ai în minte\.?/,
  );
  await expect(page.locator(".studio-portrait-contact a")).toHaveText(
    /Pregătește un brief/,
  );
  await expect(page.locator(".studio-portrait-contact a")).toHaveAttribute(
    "href",
    "/contact",
  );
  await expectActive(page, "mobil");

  // Clicks and focus can change emphasis without moving the reading surface.
  for (const id of ["formular", "interactiune", "mobil", "formular", "mobil"]) {
    await trigger(page, id).scrollIntoViewIfNeeded();
    await settle(page);
    const before = await snapshot(page);
    await trigger(page, id).click();
    await expectActive(page, id);
    await settle(page);
    assertStable(before, await snapshot(page), `Desktop click ${id}`);
  }
  await trigger(page, "mobil").focus();
  await page.keyboard.press("Tab");
  await expect(trigger(page, "formular")).toBeFocused();
  await expectActive(page, "formular");
  await page.keyboard.press("Enter");
  await expectActive(page, "formular");
  await page.keyboard.press("Tab");
  await expectActive(page, "interactiune");
  await page.keyboard.press("Space");
  await expectActive(page, "interactiune");
  assert.ok(
    (await page.getByRole("status").innerText()).trim().length > 30,
    "The selected note is announced as useful text",
  );
  await settle(page);
  await audit(page, "Desktop Studio notes accessibility");

  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [
    320, 390, 600, 640, 700, 760, 761, 768, 900, 1024, 1100, 1101, 1440, 1920,
  ]) {
    await page.setViewportSize({ width, height: width < 800 ? 844 : 1000 });
    await open();
    assert.ok(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1,
      ),
      `${width}px page has no horizontal overflow`,
    );
    const clipped = await page
      .locator(
        "main h1, main h2, main h3, .studio-portrait-reading, .studio-portrait-opening-copy, .studio-margin-note:visible",
      )
      .evaluateAll((elements) =>
        elements
          .filter((element) => element.scrollWidth > element.clientWidth + 2)
          .map((element) => element.className),
      );
    assert.deepEqual(clipped, [], `${width}px text is not clipped`);
    for (const id of ids) {
      await trigger(page, id).scrollIntoViewIfNeeded();
      const before = await snapshot(page);
      await trigger(page, id).click();
      await expectActive(page, id);
      assertStable(before, await snapshot(page), `${width}px click ${id}`);
    }
    if ([320, 390, 768, 1440].includes(width)) {
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({
        path: `artifacts/studio-editorial-${width}.png`,
        fullPage: true,
      });
    }
    if ([390, 1440].includes(width)) {
      const file = `artifacts/studio-heading-after-polish-${width}.png`;
      await page
        .locator(".studio-portrait-opening h1")
        .screenshot({ path: file });
      // The older baseline predates the explicitly requested "Suntem CODELAB"
      // correction; keep checking the real display face and current wording.
      assert.match(await page.locator("h1").innerText(), /Suntem CODELAB\./);
      assert.match(
        await page
          .locator(".studio-portrait-display")
          .first()
          .evaluate((el) => getComputedStyle(el).fontFamily),
        /Teko/,
      );
    }
  }

  await page.setViewportSize({ width: 1440, height: 600 });
  await open();
  await trigger(page, "formular").click();
  await expectActive(page, "formular");
  assert.equal(
    await page
      .locator('.studio-margin-note[data-active="true"] .studio-note-content')
      .evaluate((element) => element.getAnimations().length),
    0,
    "Reduced motion updates notes directly",
  );
  await page.locator(".studio-portrait-contact a").click();
  await page.waitForURL("**/contact");
  await expect(page.locator("#contact-form")).toBeVisible();
  await page.goBack({ waitUntil: "networkidle" });
  await projects.click();
  await page.waitForURL("**/proiecte");
  await expect(page.locator(".projects-page")).toBeVisible();

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const phone = await mobile.newPage();
  trackErrors(phone);
  await phone.goto(`${base}/studio`, { waitUntil: "networkidle" });
  for (const id of ["formular", "interactiune", "mobil"]) {
    await trigger(phone, id).scrollIntoViewIfNeeded();
    await settle(phone);
    const before = await snapshot(phone);
    await trigger(phone, id).tap();
    await expectActive(phone, id);
    await settle(phone);
    assertStable(before, await snapshot(phone), `Phone touch ${id}`);
    const association = await phone
      .locator(`#studio-note-${id}`)
      .evaluate((element) => {
        const sentence = element.previousElementSibling.getBoundingClientRect();
        const note = element.getBoundingClientRect();
        return {
          position: getComputedStyle(element).position,
          gap: note.top - sentence.bottom,
          sentenceLeft: sentence.left,
          noteLeft: note.left,
        };
      });
    assert.equal(association.position, "static");
    assert.ok(
      association.gap >= 15 && association.gap <= 30,
      "All phone explanations stay next to their observation",
    );
    assert.ok(association.noteLeft > association.sentenceLeft);
  }
  await audit(phone, "Mobile Studio notes accessibility");
  await mobile.close();

  for (const width of [390, 1440]) {
    const staticContext = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 1000 },
      javaScriptEnabled: false,
      reducedMotion: "reduce",
    });
    const staticPage = await staticContext.newPage();
    await staticPage.goto(`${base}/studio`, { waitUntil: "load" });
    await expect(staticPage.locator(".studio-note-sentence")).toHaveCount(3);
    await expect(staticPage.locator(".studio-margin-note:visible")).toHaveCount(
      width === 390 ? 3 : 1,
    );
    await expect(
      staticPage.locator(".studio-portrait-contact a"),
    ).toHaveAttribute("href", "/contact");
    await expect(
      staticPage.locator('.studio-portrait-story a[href="/proiecte"]'),
    ).toBeVisible();
    await staticContext.close();
  }
  await context.close();
  assert.deepEqual(errors, [], "No browser runtime errors");
  console.log(
    "PASS Studio refinement: preserved display typography, real agency copy, direct collaboration/project/contact links, no portfolio media, working notes click/focus/keyboard/touch, stable sentences/triggers/scroll/following chapter, responsive320–1920, all mobile explanations readable with no JS, reduced motion and desktop/mobile Axe",
  );
} finally {
  await browser.close();
}
