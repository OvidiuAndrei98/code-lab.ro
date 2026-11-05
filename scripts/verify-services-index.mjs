import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = process.env.SITE_URL || "http://127.0.0.1:3000";
const destinations = [
  {
    id: "website",
    href: "/servicii/website-uri",
    page: ".website-service-page",
  },
  {
    id: "ecommerce",
    href: "/servicii/magazin-online",
    page: ".shop-service-page",
  },
  {
    id: "aplicatii",
    href: "/servicii/aplicatii-web",
    page: ".app-service-page",
  },
];
const baseline = JSON.parse(
  await readFile("artifacts/services-before-index.json", "utf8"),
);
const browser = await chromium.launch({ channel: "msedge", headless: true });

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const main = page.locator("main[data-services-index]");
  const entries = main.locator("[data-service-entry]");
  const entry = (id) => main.locator(`[data-service-entry]#${id}`);
  const link = (id) => entry(id).locator("a");
  const contact = main.locator('a[href="/contact?service=indecis"]');
  const open = async (suffix = "") => {
    await page.goto(`${base}/servicii${suffix}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
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
  const absoluteBounds = (locator) =>
    locator.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return {
        x: bounds.x + scrollX,
        y: bounds.y + scrollY,
        width: bounds.width,
        height: bounds.height,
      };
    });
  const settleMotion = () =>
    page.waitForFunction(() =>
      document
        .querySelector("main[data-services-index]")
        .getAnimations({ subtree: true })
        .every((animation) => animation.playState !== "running"),
    );
  const actionGeometry = (locator) =>
    locator.evaluate((anchor) => {
      const svg = anchor.querySelector("svg");
      const action = svg.parentElement;
      const walker = document.createTreeWalker(action, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) if (node.textContent.trim()) break;
      const range = document.createRange();
      range.setStart(node, node.textContent.search(/\S/));
      range.setEnd(node, node.textContent.trimEnd().length);
      const text = range.getBoundingClientRect();
      const arrow = svg.getBoundingClientRect();
      const box = action.getBoundingClientRect();
      const background = getComputedStyle(anchor, "::before");
      return {
        gap: arrow.left - text.right,
        arrowX: arrow.left,
        x: box.left + scrollX,
        y: box.top + scrollY,
        width: box.width,
        height: box.height,
        background: [
          background.top,
          background.right,
          background.bottom,
          background.left,
        ],
      };
    });

  await open();
  await expect(main).toHaveCount(1);
  await expect(main.locator("h1")).toHaveCount(1);
  await expect(entries).toHaveCount(3);
  await expect(contact).toHaveCount(1);
  await expect(main.locator("header p")).toHaveText(
    "Design și dezvoltare, în aceeași echipă. Alegem împreună ce se potrivește proiectului tău.",
  );
  await expect(entry("ecommerce").locator("p")).toHaveText(
    "Un magazin în care clienții găsesc produsele, aleg variantele și plasează comanda.",
  );
  await expect(
    main.locator(
      "iframe, img, video, canvas, form, input, button, .commerce-example, .booking-example, .project-media, .service-rail, [data-chapter-media]",
    ),
  ).toHaveCount(0);
  assert.doesNotMatch(
    await main.innerText(),
    /FASON|Demonstrație|În lucru/i,
    "The index directs visitors to evidence and demonstrations on the dedicated pages",
  );
  const words = (await main.innerText()).trim().split(/\s+/).length;
  assert.ok(words <= 260, `Concentrated reading: ${words} words`);

  for (const destination of destinations) {
    const current = entry(destination.id);
    const anchor = link(destination.id);
    await expect(current).toBeVisible();
    await expect(current.locator("h2")).toHaveCount(1);
    await expect(anchor).toHaveCount(1);
    await expect(anchor).toHaveAttribute("href", destination.href);
    const titleId = await current.locator("h2").getAttribute("id");
    assert.ok(titleId);
    assert.ok(
      ((await anchor.getAttribute("aria-labelledby")) || "")
        .split(/\s+/)
        .includes(titleId),
    );
    const originalText = await current.innerText();
    const original = await absoluteBounds(current);
    const originalLink = await absoluteBounds(anchor);
    assert.ok(
      Math.abs(original.width - originalLink.width) <= 1 &&
        Math.abs(original.height - originalLink.height) <= 2,
      "The whole service row is one native click target",
    );
    await page.mouse.move(0, 0);
    await settleMotion();
    const actionBefore = await actionGeometry(anchor);
    assert.ok(
      Math.abs(actionBefore.gap - 14) <= 2,
      `Compact ${destination.id} action gap: ${actionBefore.gap}`,
    );
    await anchor.hover();
    await settleMotion();
    assert.equal(
      await current.innerText(),
      originalText,
      "Information is permanent before and after hover",
    );
    const hovered = await absoluteBounds(current);
    for (const axis of ["x", "y", "width", "height"])
      assert.ok(
        Math.abs(original[axis] - hovered[axis]) <= 1,
        `Hover keeps the ${destination.id} click area stable (${axis})`,
      );
    const actionHovered = await actionGeometry(anchor);
    for (const axis of ["x", "y", "width", "height"])
      assert.ok(
        Math.abs(actionBefore[axis] - actionHovered[axis]) <= 1,
        `Hover keeps the ${destination.id} action group stable (${axis})`,
      );
    assert.ok(
      actionHovered.gap >= 10 && actionHovered.gap <= 20,
      "Arrow feedback remains compact on hover",
    );
    assert.ok(
      actionHovered.background.every(
        (inset) => Math.abs(parseFloat(inset)) <= 0.5,
      ),
      "Hover background aligns with the service link on all sides",
    );
    await anchor.focus();
    const focusedBounds = await absoluteBounds(anchor);
    for (const axis of ["x", "y", "width", "height"])
      assert.ok(
        Math.abs(originalLink[axis] - focusedBounds[axis]) <= 1,
        `Focus keeps the ${destination.id} full-row link stable (${axis})`,
      );
  }
  await audit("Services index desktop accessibility");

  // One uninterrupted Tab sequence follows the three large, native destinations.
  await link("website").focus();
  await page.keyboard.press("Tab");
  await expect(link("ecommerce")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(link("aplicatii")).toBeFocused();
  await audit("Focused service link accessibility");
  await page.keyboard.press("Tab");
  await expect(contact).toBeFocused();
  const contactBefore = await absoluteBounds(contact);
  await contact.hover();
  await settleMotion();
  const contactHovered = await absoluteBounds(contact);
  for (const axis of ["x", "y", "width", "height"])
    assert.ok(
      Math.abs(contactBefore[axis] - contactHovered[axis]) <= 1,
      `Final CTA hover keeps its click area stable (${axis})`,
    );
  assert.ok(
    (await actionGeometry(contact)).gap <= 20,
    "Final CTA arrow feedback stays compact",
  );

  // Mouse, keyboard and touch each reach a real dedicated service page.
  const firstLinkBox = await link("website").boundingBox();
  await link("website").click({
    position: { x: 3, y: firstLinkBox.height - 5 },
  });
  await page.waitForURL(`**${destinations[0].href}`);
  await expect(page.locator(destinations[0].page)).toBeVisible();
  await page.goBack({ waitUntil: "networkidle" });
  await link("ecommerce").focus();
  await page.keyboard.press("Enter");
  await page.waitForURL(`**${destinations[1].href}`);
  await expect(page.locator(destinations[1].page)).toBeVisible();
  await page.goBack({ waitUntil: "networkidle" });
  await contact.click();
  await page.waitForURL("**/contact?service=indecis");
  await expect(
    page.locator('#contact-form [name="service"]:checked'),
  ).toHaveValue("Nu știu încă");

  const measurements = [];
  for (const width of [
    320, 390, 520, 640, 641, 660, 700, 701, 768, 900, 1024, 1100, 1101, 1440,
    1920,
  ]) {
    await page.setViewportSize({ width, height: width < 800 ? 844 : 1000 });
    await open();
    const layout = await main.evaluate((element) => {
      const clipped = [...element.querySelectorAll("h1, h2, p")].flatMap(
        (text) => {
          const range = document.createRange();
          range.selectNodeContents(text);
          return [...range.getClientRects()]
            .filter(
              (bounds) =>
                bounds.width &&
                (bounds.left < -1 || bounds.right > innerWidth + 1),
            )
            .map(() => text.textContent);
        },
      );
      const overlaps = [];
      const outsideColumn = [];
      const textRects = (element) => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const boxes = [];
        let node;
        while ((node = walker.nextNode())) {
          if (!node.textContent.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          boxes.push(
            ...[...range.getClientRects()].filter((box) => box.width > 0),
          );
        }
        return boxes;
      };
      for (const entry of element.querySelectorAll("[data-service-entry]")) {
        const anchor = entry.querySelector("a");
        const title = anchor.querySelector("h2");
        const copy = title.nextElementSibling;
        const action = anchor.lastElementChild;
        const groups = [title, copy, action].map((item) => ({
          element: item,
          boxes: textRects(item),
        }));
        groups.forEach((group, index) => {
          const column = group.element.getBoundingClientRect();
          if (
            group.boxes.some(
              (box) =>
                box.left < column.left - 1 || box.right > column.right + 1,
            )
          )
            outsideColumn.push({ id: entry.id, group: index });
          for (let other = index + 1; other < groups.length; other++) {
            const collision = group.boxes.some((first) =>
              groups[other].boxes.some(
                (second) =>
                  Math.min(first.right, second.right) -
                    Math.max(first.left, second.left) >
                    0.5 &&
                  Math.min(first.bottom, second.bottom) -
                    Math.max(first.top, second.top) >
                    0.5,
              ),
            );
            if (collision)
              overlaps.push({ id: entry.id, groups: [index, other] });
          }
        });
      }
      return {
        documentHeight: document.documentElement.scrollHeight,
        mainHeight: element.getBoundingClientRect().height,
        overflow: document.documentElement.scrollWidth > innerWidth,
        clipped,
        overlaps,
        outsideColumn,
        entries: [...element.querySelectorAll("[data-service-entry]")].map(
          (entry) => ({
            id: entry.id,
            height: entry.getBoundingClientRect().height,
            visibleParagraphs: [...entry.querySelectorAll("p")].every(
              (paragraph) =>
                paragraph.getClientRects().length > 0 &&
                getComputedStyle(paragraph).visibility === "visible" &&
                Number(getComputedStyle(paragraph).opacity) > 0,
            ),
          }),
        ),
      };
    });
    assert.equal(
      layout.overflow,
      false,
      `Services index overflow at ${width}px`,
    );
    assert.deepEqual(
      layout.clipped,
      [],
      `Clipped service information at ${width}px`,
    );
    assert.deepEqual(
      layout.overlaps,
      [],
      `Title/copy/action text overlaps at ${width}px`,
    );
    assert.deepEqual(
      layout.outsideColumn,
      [],
      `Text leaves its assigned column at ${width}px`,
    );
    await page.mouse.move(0, 0);
    await settleMotion();
    const actions = [];
    for (const destination of destinations)
      actions.push(await actionGeometry(link(destination.id)));
    for (const [index, action] of actions.entries())
      assert.ok(
        Math.abs(action.gap - 14) <= 2,
        `Compact row action at ${width}px/${destinations[index].id}: ${action.gap}px`,
      );
    assert.ok(
      Math.max(...actions.map((action) => action.arrowX)) -
        Math.min(...actions.map((action) => action.arrowX)) <=
        1,
      `Service arrows share one axis at ${width}px`,
    );
    const finalAction = await actionGeometry(contact);
    assert.ok(
      Math.abs(finalAction.gap - 14) <= 2,
      `Compact final CTA at ${width}px: ${finalAction.gap}px`,
    );
    assert.ok(
      layout.entries.every(
        (entry) => entry.height < 520 && entry.visibleParagraphs,
      ),
      `Compact, permanently readable entries at ${width}px: ${JSON.stringify(layout.entries)}`,
    );
    if ([390, 1440].includes(width)) {
      const before = baseline.find((item) => item.viewport.width === width);
      assert.ok(
        layout.mainHeight <= before.mainHeight * 0.7,
        `Index is at least30% shorter at ${width}px (${before.mainHeight} to ${layout.mainHeight})`,
      );
      assert.ok(
        layout.mainHeight <= (width === 390 ? 1900 : 1500),
        `Index has a concentrated reading length at ${width}px`,
      );
      await audit(`Services index accessibility at ${width}px`);
      await page.screenshot({
        path: `artifacts/services-index-${width}.png`,
        fullPage: true,
      });
      measurements.push({
        width,
        ...layout,
        rowActionGaps: actions.map((action) => action.gap),
        arrowAxis: actions[0].arrowX,
        contactActionGap: finalAction.gap,
      });
    }
  }

  // Existing anchors keep working after removal of the old in-page rail.
  for (const destination of destinations) {
    await open(`#${destination.id}`);
    const title = await entry(destination.id).locator("h2").boundingBox();
    assert.ok(
      title.y >= -1 && title.y + title.height <= 1001,
      `${destination.id} hash shows the requested service`,
    );
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open();
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  for (const destination of destinations)
    await expect(link(destination.id)).toBeVisible();
  await audit("Services index reduced-motion accessibility");
  const reducedArrow = link("website").locator("svg");
  await link("website").hover();
  assert.equal(
    await reducedArrow.evaluate((svg) => getComputedStyle(svg).transform),
    "none",
    "Reduced motion suppresses the arrow translation",
  );
  assert.equal(
    await reducedArrow.evaluate(
      (svg) => getComputedStyle(svg).transitionDuration,
    ),
    "0s",
  );
  await contact.hover();
  assert.equal(
    await contact
      .locator("svg")
      .evaluate((svg) => getComputedStyle(svg).transform),
    "none",
    "Reduced motion suppresses the final CTA arrow translation",
  );

  const phoneContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const phone = await phoneContext.newPage();
  await phone.goto(`${base}/servicii`, { waitUntil: "networkidle" });
  await phone.locator("[data-service-entry]#aplicatii a").tap();
  await phone.waitForURL(`**${destinations[2].href}`);
  await expect(phone.locator(destinations[2].page)).toBeVisible();
  await phoneContext.close();

  const noJSContext = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const noJS = await noJSContext.newPage();
  await noJS.goto(`${base}/servicii`, { waitUntil: "load" });
  await expect(
    noJS.locator("main[data-services-index] [data-service-entry]"),
  ).toHaveCount(3);
  for (const destination of destinations) {
    const item = noJS.locator(`[data-service-entry]#${destination.id}`);
    await expect(item.locator("h2")).toBeVisible();
    await expect(item.locator("a")).toHaveAttribute("href", destination.href);
  }
  await noJS.locator("[data-service-entry]#website a").click();
  await noJS.waitForURL(`**${destinations[0].href}`);
  await expect(noJS.locator(destinations[0].page)).toBeVisible();
  await noJSContext.close();

  assert.deepEqual(errors, []);
  console.log(
    "PASS Services index: three native labelled destinations, mouse/Tab/Enter/touch and contact context, permanent information, no demos/media, compact responsive reading320–1920, preserved hashes, reduced motion and no-JavaScript navigation, desktop/mobile Axe",
    JSON.stringify(measurements),
  );
} finally {
  await browser.close();
}
