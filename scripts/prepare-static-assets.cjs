"use strict";

const { copyFile, cp, mkdir, rm } = require("node:fs/promises");
const { dirname, resolve } = require("node:path");

const STATIC_FILES = [
  "index.html",
  "style.css",
  "roadmap.css",
  "living.css",
  "paths-lab.css",
  "organizer.css",
  "cards.css",
  "journey-world.css",
  "immersive-journey.css",
  "scroll-gesture.js",
  "system-log.js",
  "frontend/api-client.js",
  "frontend/data-validation.js",
  "frontend/paged-request.js",
  "frontend/task-repository.js",
  "frontend/day-sources.js",
  "frontend/prayer-summary.js",
  "frontend/daily-summary.js",
  "frontend/task-slice.js",
  "app.js",
  "extended-validation.js",
  "progress-contract.js",
  "progress-adapters.js",
  "progress-engine.js",
  "journey-timeline.js",
  "celestial.js",
  "task-priority.js",
  "station-task-archive.js",
  "living.js",
  "extended-lifecycle.js",
  "habit-engine.js",
  "paths-lab.js",
  "organizer.js",
  "habit-ui.js",
  "progress-heatmap.js",
  "immersive-journey.js"
];

async function prepareStaticAssets() {
  const projectRoot = resolve(__dirname, "..");
  const publicDirectory = resolve(projectRoot, "public");
  await rm(publicDirectory, { recursive: true, force: true });
  await mkdir(publicDirectory, { recursive: true });
  await Promise.all([
    ...STATIC_FILES.map(async (file) => {
      const destination = resolve(publicDirectory, file);
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(resolve(projectRoot, file), destination);
    }),
    cp(
      resolve(projectRoot, "assets"),
      resolve(publicDirectory, "assets"),
      { recursive: true }
    ),
    (async () => {
      const vendorDirectory = resolve(publicDirectory, "vendor");
      await mkdir(vendorDirectory, { recursive: true });
      await Promise.all([
        copyFile(
          resolve(projectRoot, "node_modules/adhan/lib/bundles/adhan.umd.min.js"),
          resolve(vendorDirectory, "adhan.umd.min.js")
        ),
        copyFile(
          resolve(projectRoot, "node_modules/adhan/LICENSE"),
          resolve(vendorDirectory, "ADHAN-LICENSE.txt")
        )
      ]);
    })()
  ]);
  console.log("Prepared Vercel static output in public/.");
}

prepareStaticAssets().catch((error) => {
  console.error("Could not prepare static assets:", error);
  process.exitCode = 1;
});
