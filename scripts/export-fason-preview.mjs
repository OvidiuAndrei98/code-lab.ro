import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

// Read-only extraction from the user's FASON project. Nothing is built or
// modified there. The preview keeps the rendered hero and navigation markup.
const source = path.resolve("../salon_locatie");
const output = path.resolve("public/previews/fason");
const prefix = "/previews/fason";
const html = await readFile(
  path.join(source, ".next/server/app/index.html"),
  "utf8",
);
const assets = JSON.parse(
  await readFile(path.join(source, "src/lib/visual-assets.json"), "utf8"),
);
const heroSource = await readFile(
  path.join(source, "src/components/sections/Hero.tsx"),
  "utf8",
);
const navigationSource = await readFile(
  path.join(source, "src/components/sections/Navigation.tsx"),
  "utf8",
);
const actionLabel = (source) => {
  const match = source.match(/<ActionLink[\s\S]*?>([^<]+)<\/ActionLink>/);
  if (!match) throw new Error("Cannot read the current FASON action label");
  return match[1].trim();
};
const labels = {
  hero: actionLabel(heroSource),
  navigation: actionLabel(navigationSource),
};
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true });
let extracted;
try {
  const page = await browser.newPage({ javaScriptEnabled: false });
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  extracted = await page.evaluate(
    ({ assets, prefix, labels }) => {
      const hero = document.querySelector("#acasa").cloneNode(true);
      const navigation = document.querySelector(".site-nav").cloneNode(true);
      hero.querySelector('[class~="group/action"] > span').textContent =
        labels.hero;
      navigation.querySelector('[class~="group/action"] > span').textContent =
        labels.navigation;
      const picture = hero.querySelector("picture");
      picture.replaceChildren();
      for (const [size, media] of [
        ["desktop", "(min-width: 768px)"],
        ["mobile", null],
      ]) {
        const source = document.createElement("source");
        if (media) source.media = media;
        source.type = "image/webp";
        source.srcset = assets.hero[size].srcSet.replaceAll(
          "/images/",
          prefix + "/images/",
        );
        source.sizes = "100vw";
        picture.append(source);
      }
      const image = document.createElement("img");
      image.src = prefix + assets.hero.mobile.src;
      image.width = assets.hero.mobile.width;
      image.height = assets.hero.mobile.height;
      image.alt =
        "Tunsoare FASON: bob blond geometric, breton cu accente galbene";
      image.loading = "eager";
      image.fetchPriority = "high";
      image.decoding = "sync";
      image.draggable = false;
      image.className =
        "hero-photograph absolute inset-0 h-full w-full object-cover object-center";
      picture.append(image);

      for (const root of [navigation, hero]) {
        root
          .querySelectorAll("canvas,script,noscript")
          .forEach((node) => node.remove());
        root.querySelectorAll("*").forEach((node) => {
          for (const attribute of [...node.attributes]) {
            if (/^on/i.test(attribute.name))
              node.removeAttribute(attribute.name);
          }
          node.removeAttribute("href");
          node.removeAttribute("aria-controls");
          node.removeAttribute("aria-haspopup");
          if (node.matches("button")) {
            node.disabled = true;
            node.tabIndex = -1;
          }
        });
      }
      return {
        markup: navigation.outerHTML + "<main>" + hero.outerHTML + "</main>",
        css: [...document.querySelectorAll('link[rel="stylesheet"]')].map(
          (link) => link.getAttribute("href"),
        ),
      };
    },
    { assets, prefix, labels },
  );
} finally {
  await browser.close();
}

let css = "";
for (const file of extracted.css) {
  const compiled = await readFile(
    path.join(source, ".next", file.replace("/_next/", "")),
    "utf8",
  );
  css += compiled.replace(/@font-face\s*\{[^}]*\}/g, "");
}
const fonts = await readFile(path.join(source, "src/app/fonts.css"), "utf8");
css =
  fonts.replaceAll('url("/fonts/', 'url("' + prefix + "/fonts/") + "\n" + css;
for (const match of fonts.matchAll(/url\("(\/fonts\/[^\"]+)"\)/g)) {
  const relative = match[1].slice(1);
  await mkdir(path.dirname(path.join(output, relative)), { recursive: true });
  await copyFile(
    path.join(source, "public", relative),
    path.join(output, relative),
  );
}
for (const license of ["Manrope-OFL.txt", "Cormorant-Garamond-OFL.txt"]) {
  await copyFile(
    path.join(source, "public/fonts", license),
    path.join(output, "fonts", license),
  );
}
const images = new Set(
  Object.values(assets.hero).flatMap((size) =>
    size.srcSet.split(",").map((item) => item.trim().split(" ")[0]),
  ),
);
for (const image of images) {
  const relative = image.slice(1);
  await mkdir(path.dirname(path.join(output, relative)), { recursive: true });
  await copyFile(
    path.join(source, "public", relative),
    path.join(output, relative),
  );
}

// Remove only the outer page inset and scrollbar: this document is the hero,
// not the whole FASON page. All internal typography and composition is original.
css += `
html,body { margin:0!important; padding:0!important; width:100%; height:100%; overflow:hidden!important; scrollbar-gutter:auto!important; background:#211d1b!important; }
#acasa { margin:0!important; width:100%; height:100svh!important; min-height:0!important; border-radius:0!important; }
.site-nav { inset-inline:0!important; top:0!important; border-radius:0!important; }
*,*::before,*::after { animation:none!important; transition:none!important; scroll-behavior:auto!important; pointer-events:none!important; }
`;
await writeFile(path.join(output, "hero.css"), css);
await writeFile(
  path.join(output, "index.html"),
  `<!doctype html>
<html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>FASON — Hero preview</title><link rel="stylesheet" href="${prefix}/hero.css"></head><body inert>${extracted.markup}</body></html>`,
);
console.log(
  "Exported FASON hero and navigation, original CSS, fonts and photographs. No scripts, effects or active controls.",
);
