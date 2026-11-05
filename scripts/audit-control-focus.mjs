import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const directory = "artifacts/control-focus-audit";
const routes = [
  "/",
  "/proiecte",
  "/proiecte/fason",
  "/proiecte/carnet-demo",
  "/servicii",
  "/servicii/website-uri",
  "/servicii/magazin-online",
  "/servicii/aplicatii-web",
  "/studio",
  "/contact",
];

export function inspect(element) {
  const box = element.getBoundingClientRect();
  const own = getComputedStyle(element);
  let visual = element;
  if (
    own.opacity === "0" &&
    element.matches('input[type="radio"], input[type="checkbox"]')
  )
    visual = element.nextElementSibling;
  const rect = visual.getBoundingClientRect();
  const style = getComputedStyle(visual);
  const wrap = element.closest(".brief-control-wrap");
  const inset = parseFloat(style.outlineOffset),
    width = parseFloat(style.outlineWidth);
  const out = style.outlineStyle !== "none" && width > 0;
  const extent = out ? Math.max(0, inset + width) : 0;
  const background = (node) => {
    for (let n = node; n; n = n.parentElement) {
      const c = getComputedStyle(n).backgroundColor;
      if (c !== "transparent" && !c.endsWith(", 0)")) return c;
    }
    return "rgb(234, 232, 225)";
  };
  const clipping = [];
  for (
    let node = visual.parentElement;
    node && node !== document.body;
    node = node.parentElement
  ) {
    const s = getComputedStyle(node),
      r = node.getBoundingClientRect();
    const clipsX = /hidden|clip|scroll|auto/.test(s.overflowX);
    const clipsY = /hidden|clip|scroll|auto/.test(s.overflowY);
    if (
      (clipsX &&
        (rect.left - extent < r.left - 0.5 ||
          rect.right + extent > r.right + 0.5)) ||
      (clipsY &&
        (rect.top - extent < r.top - 0.5 ||
          rect.bottom + extent > r.bottom + 0.5))
    )
      clipping.push({
        class: node.className,
        overflow: `${s.overflowX}/${s.overflowY}`,
        extent,
      });
  }
  return {
    tag: element.tagName,
    id: element.id,
    class: String(element.className),
    label:
      element.getAttribute("aria-label") ||
      element.textContent?.trim().replace(/\s+/g, " ").slice(0, 100) ||
      element.name ||
      element.type,
    href: element.getAttribute("href"),
    active: element === document.activeElement,
    focusVisible: element.matches(":focus-visible"),
    visual: visual.className,
    outline: style.outlineStyle,
    width,
    inset,
    color: style.outlineColor,
    background: element.matches(".skip-link")
      ? "rgb(234, 232, 225)"
      : background(inset < 0 ? visual : visual.parentElement),
    shadow: style.boxShadow,
    border: style.border,
    fieldLine: wrap ? getComputedStyle(wrap, "::after").transform : null,
    customFocus: element.querySelector(".menu-tab-face")
      ? {
          fill: getComputedStyle(element.querySelector(".menu-tab-face")).fill,
          icon: getComputedStyle(element.querySelector(".menu-tab-icon"))
            .stroke,
        }
      : null,
    clipping,
    rect: { x: box.x, y: box.y, w: box.width, h: box.height },
  };
}

export const contrast = (a, b) => {
  const L = (color) => {
    const n = color
      .match(/[\d.]+/g)
      ?.slice(0, 3)
      .map(Number);
    if (!n || n.length < 3) return 0;
    const c = n.map((v) => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
  };
  const x = L(a),
    y = L(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await mkdir(directory, { recursive: true });
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const report = [];
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      for (const route of routes) {
        await page.goto(`http://127.0.0.1:3000${route}`, {
          waitUntil: "networkidle",
        });
        await page.keyboard.press("Tab");
        const controls = page.locator(
          'a[href],button,input:not([type="hidden"]),textarea,select,[role="combobox"]',
        );
        const states = [];
        for (let i = 0; i < (await controls.count()); i++) {
          const control = controls.nth(i);
          if (
            !(await control.evaluate(
              (e) =>
                e.getBoundingClientRect().width > 0 &&
                e.getBoundingClientRect().height > 0 &&
                !e.closest("[inert],[hidden]") &&
                !e.disabled &&
                e.tabIndex >= 0 &&
                getComputedStyle(e).visibility !== "hidden",
            ))
          )
            continue;
          await control.evaluate((e) => {
            e.scrollIntoView({ block: "center", behavior: "instant" });
            e.focus({ preventScroll: true });
          });
          const state = await control.evaluate(inspect);
          if (state.outline !== "none" && state.width > 0)
            state.contrast = contrast(state.color, state.background);
          states.push(state);
        }
        report.push({ route, width, states });
        console.log(
          `${width} ${route}: ${states.length} controls; issues ${states
            .filter(
              (s) =>
                (s.contrast < 3 && !s.clipping.length) || s.clipping.length,
            )
            .map(
              (s) =>
                `${s.label} [contrast ${s.contrast?.toFixed(2)}, clip ${s.clipping.map((c) => c.class).join(",")}]`,
            )
            .join("; ")}`,
        );
      }
      await context.close();
    }
  } finally {
    await writeFile(
      `${directory}/inventory.json`,
      JSON.stringify(report, null, 2),
    );
    await browser.close();
  }
}
