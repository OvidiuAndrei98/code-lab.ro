import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { projects, archiveProjects } from "../src/lib/projects.ts";
assert.equal(
  new Set(archiveProjects.map((p) => p.slug)).size,
  archiveProjects.length,
);
assert.ok(
  projects.every((project) => !project.isDemo),
  "Home and service evidence contain real projects only",
);
const demo = archiveProjects.find((project) => project.slug === "carnet-demo");
assert.ok(demo?.isDemo);
assert.equal(demo.status, "Concept demonstrativ");
assert.ok(!projects.some((project) => project.slug === demo.slug));
for (const project of archiveProjects) {
  assert.match(project.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(["website", "ecommerce", "aplicatii"].includes(project.service));
  assert.ok(project.media.width > 0 && project.media.height > 0);
}
const base = process.env.SITE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // The compact service index intentionally has no evidence choreography.
  // The focused gallery suite owns vertical overlap/focus choreography. Here
  // reduced motion checks permanent identities, native routes and normal flow.
  await page.goto(`${base}/proiecte`, { waitUntil: "networkidle" });
  assert.equal(
    await page.locator("[data-gallery-project]").count(),
    archiveProjects.length,
  );
  const demoEntry = page.locator(`[data-gallery-project="${demo.slug}"]`);
  assert.match(await demoEntry.textContent(), /Concept demonstrativ/);
  assert.match(await demoEntry.textContent(), /fără client real/i);
  for (const project of archiveProjects) {
    const article = page.locator(`[data-gallery-project="${project.slug}"]`);
    assert.ok((await article.innerText()).includes(project.serviceLabel));
    const link = article.locator(`a[href="/proiecte/${project.slug}"]`).first();
    assert.ok(
      (await link.innerText()).includes(
        project.isDemo ? "Explorează conceptul" : "Vezi proiectul",
      ),
    );
    assert.equal(
      await link.locator("a,button,input,select,textarea").count(),
      0,
    );
  }
  await page
    .locator(
      `[data-gallery-project="${demo.slug}"] a[href="/proiecte/${demo.slug}"]`,
    )
    .first()
    .click();
  await page.waitForURL(`**/proiecte/${demo.slug}`);
  assert.equal(await page.locator("h1").textContent(), demo.title);
  await page.goBack({ waitUntil: "networkidle" });
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForFunction(
    () =>
      document.querySelector("[data-project-gallery]")?.dataset.enhanced !==
      "true",
  );
  assert.ok(
    await page
      .locator("[data-gallery-project] .project-media")
      .evaluateAll((elements) =>
        elements.every(
          (element) => getComputedStyle(element).clipPath === "none",
        ),
      ),
    "Reduced motion exposes both complete articles without a mask",
  );
  await page.goto(base, { waitUntil: "networkidle" });
  assert.equal(
    await page.locator(".showcase-project").count(),
    projects.length,
  );
  await page.goto(`${base}/studio`, { waitUntil: "networkidle" });
  assert.equal(
    await page.locator(".studio-portrait-project .project-media").count(),
    0,
    "The Studio page now presents the team and working notes without portfolio media",
  );
  for (const [index, project] of archiveProjects.entries()) {
    await page.goto(`${base}/proiecte/${project.slug}`, {
      waitUntil: "networkidle",
    });
    assert.equal(await page.locator("h1").textContent(), project.title);
    assert.equal(await page.locator(".project-media").count(), 1);
    assert.match(
      await page.locator(".case-heading").innerText(),
      new RegExp(project.status),
    );
    const next = archiveProjects[index + 1];
    assert.equal(
      await page
        .getByRole("navigation", { name: "Continuă explorarea" })
        .getByRole("link")
        .getAttribute("href"),
      next ? `/proiecte/${next.slug}` : "/proiecte",
    );
    if (project.isDemo) {
      assert.match(
        await page.locator(".case-brief").innerText(),
        /nu reprezintă o lucrare livrată unui client/,
      );
      const frame = page.frameLocator(".project-media iframe");
      const inert = await frame.locator("body").evaluate(() => ({
        width: innerWidth,
        height: innerHeight,
        inert: document.body.inert,
        scripts: document.querySelectorAll("script, canvas").length,
        activeLinks: document.querySelectorAll("a[href]").length,
        disabledButtons: [...document.querySelectorAll("button")].every(
          (button) => button.disabled,
        ),
      }));
      assert.deepEqual(
        inert,
        {
          width: 1440,
          height: 960,
          inert: true,
          scripts: 0,
          activeLinks: 0,
          disabledButtons: true,
        },
        "The archive concept is a static, inert desktop preview",
      );
    }
  }
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`${base}/proiecte`, { waitUntil: "networkidle" });
    assert.equal(
      await page.locator("[data-gallery-project]").count(),
      archiveProjects.length,
    );
    assert.notEqual(
      await page
        .locator("[data-project-gallery]")
        .getAttribute("data-enhanced"),
      "true",
      "Mobile/reduced-motion archive keeps its two projects in normal flow",
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Two-project archive fits ${width}px`,
    );
    const cards = await page
      .locator("[data-gallery-project]")
      .evaluateAll((elements) =>
        elements.map((element) => {
          const bounds = element.getBoundingClientRect();
          return { top: bounds.top, bottom: bounds.bottom };
        }),
      );
    for (let index = 1; index < cards.length; index++)
      assert.ok(
        cards[index].top >= cards[index - 1].bottom,
        "Projects remain separately readable on phones",
      );
    await page.goto(`${base}/proiecte/${demo.slug}`, {
      waitUntil: "networkidle",
    });
    assert.match(
      await page.locator(".case-heading").innerText(),
      /Concept demonstrativ/,
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Concept detail fits ${width}px`,
    );
  }
  const noScript = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const fallback = await noScript.newPage();
  await fallback.goto(base, { waitUntil: "load" });
  const fit = await fallback
    .locator(".showcase-project .project-media")
    .first()
    .evaluate((el) => {
      const iframe = el.querySelector("iframe");
      return {
        expected: el.clientWidth / Number(iframe.getAttribute("width")),
        actual: new DOMMatrix(getComputedStyle(iframe).transform).m11,
      };
    });
  assert.ok(
    Math.abs(fit.expected - fit.actual) < 0.001,
    "Desktop HTML fits on phones without JavaScript",
  );
  assert.deepEqual(errors, []);
  await noScript.close();
  await context.close();
  console.log(
    "PASS real/demo archive separation, exact categories/actions and stable native destinations, reduced-motion article flow, phone layout, static inert concept, unchanged real Home project count and no-JS preview sizing",
  );
} finally {
  await browser.close();
}
