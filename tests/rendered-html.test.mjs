import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the finished Chinese mathematics course", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]*lang="zh-CN"/i);
  assert.match(html, /<title>小包子学数学｜零基础初中数学课程<\/title>/i);
  assert.match(html, /小包子学数学/);
  assert.match(html, /小包子，数学不是比谁学得快/);
  assert.doesNotMatch(html, /奶奶/);
  assert.match(html, /从第一课开始/);
  assert.match(html, /一课只做四件事/);
  assert.match(html, /启蒙补基础/);
  assert.match(html, /七年级/);
  assert.match(html, /八年级/);
  assert.match(html, /九年级/);
  assert.match(html, /http:\/\/localhost(?::3000)?\/og\.png/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("includes the full curriculum and removes disposable starter files", async () => {
  const [page, layout, packageJson, foundation, grade8, grade9] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/curriculum/foundation-grade7.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/curriculum/grade8.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/curriculum/grade9.ts", import.meta.url), "utf8"),
  ]);
  const curriculum = `${foundation}\n${grade8}\n${grade9}`;
  const lessonCount = curriculum.match(/^\s{8}id:\s*"/gm)?.length ?? 0;
  const practiceSectionCount = curriculum.match(/^\s{8}practice:/gm)?.length ?? 0;

  assert.ok(lessonCount >= 90, `expected at least 90 lessons, found ${lessonCount}`);
  assert.equal(practiceSectionCount, lessonCount);
  assert.match(curriculum, /一元一次方程/);
  assert.match(curriculum, /勾股定理/);
  assert.match(curriculum, /二次函数/);
  assert.match(curriculum, /锐角三角函数/);
  assert.match(page, /math-completed-lessons/);
  assert.match(page, /想不出来？看小提示/);
  assert.match(layout, /generateMetadata/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(`${page}\n${layout}`, /codex-preview|_sites-preview/);

  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
  await assert.rejects(access(new URL("../app/_sites-preview/preview.css", import.meta.url)));
  await access(new URL("public/og.png", templateRoot));
});
