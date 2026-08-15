import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const basePath = "/tainai-junior-math";
const outputDirectory = resolve("pages-out");
const serverEntry = pathToFileURL(resolve("dist/server/index.js"));

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await cp(resolve("dist/client"), outputDirectory, { recursive: true });
await cp(
  resolve("dist/client", basePath.slice(1), "_next"),
  resolve(outputDirectory, "_next"),
  { recursive: true },
);
await rm(resolve(outputDirectory, basePath.slice(1)), { recursive: true, force: true });

const { default: worker } = await import(`${serverEntry.href}?pages=${Date.now()}`);
const response = await worker.fetch(
  new Request(`https://icemapletree-cmd.github.io${basePath}/`, {
    headers: { accept: "text/html" },
  }),
  {
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
  },
  {
    waitUntil() {},
    passThroughOnException() {},
  },
);

if (!response.ok) {
  throw new Error(`Static render failed with status ${response.status}`);
}

const html = await response.text();
if (!html.includes(`${basePath}/_next/`)) {
  throw new Error("Static HTML is missing the GitHub Pages asset prefix");
}
if (!html.includes(`${basePath}/og.png`)) {
  throw new Error("Static HTML is missing the GitHub Pages social image path");
}

await Promise.all([
  writeFile(resolve(outputDirectory, "index.html"), html),
  writeFile(resolve(outputDirectory, "404.html"), html),
  writeFile(resolve(outputDirectory, ".nojekyll"), ""),
]);

console.log(`GitHub Pages files written to ${outputDirectory}`);
