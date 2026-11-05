import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const recordings = [
  { name: "sss", file: "sss.mp4", times: [] },
  { name: "cosmo", file: "cosmo.mp4", times: [] },
  {
    name: "vintila",
    file: "Recording 2026-10-22 040345.mp4",
    times: [0.5, 4, 8, 13, 20, 26, 32, 43],
  },
  {
    name: "breems",
    file: "Recording 2026-10-22 035429.mp4",
    times: [0.5, 3, 6, 10, 15, 19, 24, 28],
  },
];
await mkdir("artifacts/references", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1918, height: 1078 },
  });
  for (const recording of recordings.filter(
    (item) => !process.argv[2] || item.name === process.argv[2],
  )) {
    await page.goto(
      `file:///D:/skills%20videos/${encodeURIComponent(recording.file)}`,
    );
    await page.waitForFunction(
      () => document.querySelector("video")?.readyState >= 2,
    );
    if (!recording.times.length) {
      const duration = await page.locator("video").evaluate((v) => v.duration);
      recording.times = [0.01, 0.12, 0.24, 0.36, 0.48, 0.6, 0.75, 0.9].map(
        (f) => Math.round(duration * f * 10) / 10,
      );
      console.log(`${recording.name}: duration ${duration}`);
    }
    await page.evaluate(() => {
      const v = document.querySelector("video");
      v.pause();
      v.controls = false;
      v.style.cssText =
        "position:fixed;inset:0;width:100%;height:100%;object-fit:contain";
      document.body.style.margin = "0";
    });
    const pieces = [];
    for (const [index, time] of recording.times.entries()) {
      await page.evaluate(
        (time) =>
          new Promise((resolve) => {
            const v = document.querySelector("video");
            v.addEventListener("seeked", resolve, { once: true });
            v.currentTime = time;
          }),
        time,
      );
      const path = `artifacts/references/${recording.name}-${time}.png`;
      await page.locator("video").screenshot({ path });
      const resized = await sharp(path).resize(600, 337).toBuffer();
      pieces.push({
        input: resized,
        left: (index % 2) * 600,
        top: Math.floor(index / 2) * 337,
      });
    }
    await sharp({
      create: { width: 1200, height: 1348, channels: 3, background: "#222" },
    })
      .composite(pieces)
      .png()
      .toFile(`artifacts/references/${recording.name}-contact-sheet.png`);
    console.log(`${recording.name}: ${recording.times.join(", ")} seconds`);
  }
} finally {
  await browser.close();
}
