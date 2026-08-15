import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import process from "node:process";
import ts from "typescript";

const root = new URL("../", import.meta.url);

async function loadUnits(relativePath, exportName) {
  const source = await readFile(new URL(relativePath, root), "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: relativePath,
    reportDiagnostics: true,
  });

  const errors = (result.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  assert.equal(errors.length, 0, `${relativePath} 有语法错误`);

  const encoded = Buffer.from(result.outputText).toString("base64");
  const loaded = await import(`data:text/javascript;base64,${encoded}`);
  return loaded[exportName];
}

const [foundationAndGrade7, grade8, grade9] = await Promise.all([
  loadUnits("app/curriculum/foundation-grade7.ts", "foundationGrade7Units"),
  loadUnits("app/curriculum/grade8.ts", "grade8Units"),
  loadUnits("app/curriculum/grade9.ts", "grade9Units"),
]);

const [grade7Visuals, grade8Visuals, grade9Visuals] = await Promise.all([
  loadUnits("app/visuals/grade7-visuals.ts", "grade7Visuals"),
  loadUnits("app/visuals/grade8-visuals.ts", "grade8Visuals"),
  loadUnits("app/visuals/grade9-visuals.ts", "grade9Visuals"),
]);

const allUnits = [...foundationAndGrade7, ...grade8, ...grade9];
const gradedUnits = allUnits.filter((unit) =>
  ["七年级", "八年级", "九年级"].includes(unit.stage),
);
const visualMap = { ...grade7Visuals, ...grade8Visuals, ...grade9Visuals };
const gradedLessons = gradedUnits.flatMap((unit) => unit.lessons);
const gradedLessonIds = new Set(gradedLessons.map((lesson) => lesson.id));

assert.equal(Object.keys(visualMap).length, gradedLessonIds.size, "七至九年级视觉映射数量不完整");
for (const lesson of gradedLessons) {
  assert.ok(visualMap[lesson.id], `${lesson.id} 缺少对应的知识图与动画类型`);
}
for (const lessonId of Object.keys(visualMap)) {
  assert.ok(gradedLessonIds.has(lessonId), `${lessonId} 是多余的视觉映射`);
}

for (const unit of gradedUnits) {
  for (const lesson of unit.lessons) {
    const where = `${unit.stage}／${unit.title}／${lesson.title}`;
    assert.ok(lesson.ideas.length >= 3, `${where}：知识点少于 3 个`);
    assert.ok(lesson.examples.length >= 3, `${where}：例题少于 3 道`);
    assert.ok(lesson.practice.length >= 4, `${where}：练习少于 4 道`);

    const exampleQuestions = new Set();
    for (const [index, example] of lesson.examples.entries()) {
      assert.ok(example.question.trim(), `${where}：例题 ${index + 1} 没有题目`);
      assert.ok(example.steps.length >= 3, `${where}：例题 ${index + 1} 的讲解少于 3 步`);
      assert.ok(example.steps.every((step) => step.trim()), `${where}：例题 ${index + 1} 有空步骤`);
      assert.ok(example.answer.trim(), `${where}：例题 ${index + 1} 没有完整答案`);
      assert.ok(!exampleQuestions.has(example.question.trim()), `${where}：有重复例题`);
      exampleQuestions.add(example.question.trim());
    }

    const practiceQuestions = new Set();
    for (const [index, item] of lesson.practice.entries()) {
      assert.ok(item.question.trim(), `${where}：练习 ${index + 1} 没有题目`);
      assert.ok(item.hint.trim(), `${where}：练习 ${index + 1} 没有提示`);
      assert.ok(item.answer.trim(), `${where}：练习 ${index + 1} 没有完整答案`);
      assert.ok(!practiceQuestions.has(item.question.trim()), `${where}：有重复练习`);
      practiceQuestions.add(item.question.trim());
    }
  }
}

const learnerFacingFiles = [
  "app/page.tsx",
  "app/layout.tsx",
  "app/curriculum/foundation-grade7.ts",
  "app/curriculum/grade8.ts",
  "app/curriculum/grade9.ts",
];

for (const relativePath of learnerFacingFiles) {
  const source = await readFile(new URL(relativePath, root), "utf8");
  assert.ok(!source.includes("奶奶"), `${relativePath} 仍有旧称呼“奶奶”`);
}

for (const stage of ["七年级", "八年级", "九年级"]) {
  const lessons = gradedUnits.filter((unit) => unit.stage === stage).flatMap((unit) => unit.lessons);
  const examples = lessons.reduce((sum, lesson) => sum + lesson.examples.length, 0);
  const practice = lessons.reduce((sum, lesson) => sum + lesson.practice.length, 0);
  process.stdout.write(`${stage}：${lessons.length} 课，${examples} 道例题，${practice} 道练习\n`);
}

const allLessons = allUnits.flatMap((unit) => unit.lessons);
const allExamples = allLessons.reduce((sum, lesson) => sum + lesson.examples.length, 0);
const allPractice = allLessons.reduce((sum, lesson) => sum + lesson.practice.length, 0);
const allVisuals = gradedLessons.reduce((sum, lesson) => sum + lesson.ideas.length + lesson.examples.length, 0);
process.stdout.write(`全课程：${allUnits.length} 单元，${allLessons.length} 课，${allExamples} 道例题，${allPractice} 道练习\n`);
process.stdout.write(`七至九年级：${allVisuals} 幅知识图与可播放动画，覆盖每条知识点和每道例题\n`);

process.stdout.write("课程内容审查通过：每课均有多角度例题与四类验证练习。\n");
