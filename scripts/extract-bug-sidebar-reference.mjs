import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const clip = await readFile("D:/skills videos/bug sidebar.mp4");
const directory = "artifacts/references/bug-sidebar";
await mkdir(directory, { recursive: true });
const server = createServer((request, response) => {
  if (request.url === "/clip.mp4") {
    const range = request.headers.range;
    if (range) {
      const [, rawStart, rawEnd] = /bytes=(\d+)-(\d*)/.exec(range);
      const start = Number(rawStart);
      const end = rawEnd
        ? Math.min(Number(rawEnd), clip.length - 1)
        : clip.length - 1;
      response.writeHead(206, {
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
        "Content-Range": `bytes ${start}-${end}/${clip.length}`,
        "Content-Length": end - start + 1,
      });
      response.end(clip.subarray(start, end + 1));
    } else {
      response.writeHead(200, {
        "Content-Type": "video/mp4",
        "Content-Length": clip.length,
        "Accept-Ranges": "bytes",
      });
      response.end(clip);
    }
    return;
  }
  response.writeHead(200, { "Content-Type": "text/html" });
  response.end(
    '<!doctype html><html><body><video src="/clip.mp4" preload="auto" muted></video></body></html>',
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const metadata = await page.evaluate(async () => {
    const video = document.querySelector("video");
    if (video.readyState < 1)
      await new Promise((resolve) =>
        video.addEventListener("loadedmetadata", resolve, { once: true }),
      );
    return {
      width: video.videoWidth,
      height: video.videoHeight,
      duration: video.duration,
    };
  });
  console.log(JSON.stringify(metadata));
  const supplied = process.argv.slice(2).map(Number).filter(Number.isFinite);
  const times = supplied.length
    ? supplied
    : [...Array(Math.ceil(metadata.duration * 2))].map((_, index) =>
        Math.max(0.02, Math.min(index / 2, metadata.duration - 0.04)),
      );
  const frames = [];
  for (const time of times) {
    const data = await page.evaluate(async (time) => {
      const video = document.querySelector("video");
      const seeked = new Promise((resolve) =>
        video.addEventListener("seeked", resolve, { once: true }),
      );
      const presented = new Promise((resolve) =>
        video.requestVideoFrameCallback((_now, metadata) =>
          resolve(metadata.mediaTime),
        ),
      );
      video.currentTime = time;
      await seeked;
      await presented;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      return canvas.toDataURL("image/png").split(",")[1];
    }, time);
    const name = `frame-${time.toFixed(2).padStart(5, "0")}s.png`;
    await writeFile(`${directory}/${name}`, Buffer.from(data, "base64"));
    frames.push({ time, data, name });
  }
  const sheet = await page.evaluate(async (frames) => {
    const cellWidth = 480;
    const images = await Promise.all(
      frames.map(
        ({ data }) =>
          new Promise((resolve) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.src = `data:image/png;base64,${data}`;
          }),
      ),
    );
    const cellHeight =
      Math.round((cellWidth * images[0].height) / images[0].width) + 28;
    const canvas = document.createElement("canvas");
    canvas.width = cellWidth * 4;
    canvas.height = cellHeight * Math.ceil(images.length / 4);
    const context = canvas.getContext("2d");
    context.fillStyle = "#242424";
    context.fillRect(0, 0, canvas.width, canvas.height);
    images.forEach((image, index) => {
      const x = (index % 4) * cellWidth;
      const y = Math.floor(index / 4) * cellHeight;
      context.drawImage(image, x, y + 28, cellWidth, cellHeight - 28);
      context.fillStyle = "#ffffff";
      context.font = "18px sans-serif";
      context.fillText(`${frames[index].time.toFixed(2)}s`, x + 12, y + 21);
    });
    return canvas.toDataURL("image/png").split(",")[1];
  }, frames);
  const sheetName = supplied.length
    ? "contact-sheet-detail.png"
    : "contact-sheet.png";
  await writeFile(`${directory}/${sheetName}`, Buffer.from(sheet, "base64"));
  if (!supplied.length)
    await writeFile(
      `${directory}/metadata.json`,
      JSON.stringify({ ...metadata, times }, null, 2),
    );
  console.log(
    JSON.stringify({
      directory,
      contactSheet: `${directory}/${sheetName}`,
      times,
    }),
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
