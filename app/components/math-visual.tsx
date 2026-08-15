"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VisualKind } from "../visuals/types";

type MathVisualProps = {
  kind: VisualKind;
  itemIndex: number;
  mode: "idea" | "example";
  text: string;
};

type Point = { x: number; y: number };
type PlayState = "ready" | "playing" | "paused";

const COLORS = {
  ink: "#203b31",
  muted: "#6c7168",
  green: "#2f735b",
  greenSoft: "#dcecdf",
  orange: "#c66b35",
  orangeSoft: "#f4dcc9",
  blue: "#4f7898",
  blueSoft: "#dce9f1",
  plum: "#7c5d78",
  plumSoft: "#eadfea",
  yellow: "#e8c85e",
  paper: "#fffdf7",
  line: "#d8d1c2",
};

const VISUAL_COPY: Record<VisualKind, { name: string; note: string }> = {
  "number-line": { name: "数轴小路", note: "看清方向、位置和大小，再动手计算。" },
  operation: { name: "加减乘除演示", note: "把抽象符号变成能看见的数量变化。" },
  "algebra-tiles": { name: "代数积木", note: "字母项和数字项分开放，合并关系更清楚。" },
  balance: { name: "方程天平", note: "等号两边像天平，两边同做一件事仍然平衡。" },
  "geometry-basics": { name: "点线角图解", note: "先认清点、线、角和它们的位置关系。" },
  "parallel-lines": { name: "平行线角度图", note: "用颜色找到成对的角，再判断相等或互补。" },
  triangle: { name: "三角形拆解图", note: "边、角、高、中线和角平分线逐步出现。" },
  congruence: { name: "全等重合演示", note: "把两个三角形移动到一起，看它们能否完全重合。" },
  symmetry: { name: "折一折看对称", note: "对称点到中线一样远，翻折后正好重合。" },
  "right-triangle": { name: "直角三角形图", note: "三条边和三个正方形一起说明勾股关系。" },
  quadrilateral: { name: "四边形关系图", note: "边、角和对角线的特点在一张图里看清。" },
  coordinate: { name: "坐标定位图", note: "先横着走，再竖着走，就能找到点的位置。" },
  "linear-graph": { name: "直线函数图", note: "跟着点的移动，看横坐标和纵坐标怎样一起变化。" },
  "function-machine": { name: "函数小机器", note: "一个数进去，按同一规则变成另一个数。" },
  "data-chart": { name: "数据会说话", note: "把一串数字变成高低、多少和变化趋势。" },
  roots: { name: "平方与开方图", note: "从面积反找边长，根号就不再神秘。" },
  quadratic: { name: "抛物线动态图", note: "看开口、顶点和最高或最低位置怎样变化。" },
  rotation: { name: "绕点旋转", note: "图形绕中心转动，形状和大小都不改变。" },
  circle: { name: "圆中关系图", note: "圆心、半径、弦、角和切线逐项亮出来。" },
  probability: { name: "摸球概率图", note: "看见所有可能，再数符合要求的情况。" },
  "inverse-graph": { name: "反比例曲线", note: "一个量变大时，另一个量怎样变小。" },
  similarity: { name: "相似缩放图", note: "形状不变、大小改变，对应边按同一倍数伸缩。" },
  trigonometry: { name: "直角三角比", note: "站在同一个角看，对边、邻边和斜边各在哪里。" },
  "solid-view": { name: "立体三视图", note: "从正面、上面、侧面看，同一物体会得到不同图形。" },
  review: { name: "综合解题路线", note: "把已知、方法、计算和检查连成一条清楚的小路。" },
};

function ease(value: number) {
  return 1 - Math.pow(1 - Math.min(1, Math.max(0, value)), 3);
}

function mix(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function line(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  color = COLORS.ink,
  width = 3,
  progress = 1,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(mix(from.x, to.x, progress), mix(from.y, to.y, progress));
  ctx.stroke();
  ctx.restore();
}

function dashedLine(ctx: CanvasRenderingContext2D, from: Point, to: Point, color = COLORS.muted, progress = 1) {
  ctx.save();
  ctx.setLineDash([7, 6]);
  line(ctx, from, to, color, 2, progress);
  ctx.restore();
}

function dot(ctx: CanvasRenderingContext2D, point: Point, color = COLORS.orange, radius = 7) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function label(
  ctx: CanvasRenderingContext2D,
  value: string,
  point: Point,
  color = COLORS.ink,
  size = 16,
  align: CanvasTextAlign = "center",
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(value, point.x, point.y);
  ctx.restore();
}

function arrow(ctx: CanvasRenderingContext2D, from: Point, to: Point, color = COLORS.green, progress = 1) {
  const end = { x: mix(from.x, to.x, progress), y: mix(from.y, to.y, progress) };
  line(ctx, from, end, color, 3);
  if (progress < 0.15) return;
  const angle = Math.atan2(end.y - from.y, end.x - from.x);
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(end.x - 11 * Math.cos(angle - Math.PI / 6), end.y - 11 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(end.x - 11 * Math.cos(angle + Math.PI / 6), end.y - 11 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke = COLORS.line,
  radius = 12,
) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function angleArc(
  ctx: CanvasRenderingContext2D,
  center: Point,
  radius: number,
  start: number,
  end: number,
  color = COLORS.orange,
  progress = 1,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, start, mix(start, end, progress));
  ctx.stroke();
  ctx.restore();
}

function drawAxes(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const origin = { x: width * 0.5, y: height * 0.56 };
  arrow(ctx, { x: 42, y: origin.y }, { x: width - 35, y: origin.y }, COLORS.muted);
  arrow(ctx, { x: origin.x, y: height - 24 }, { x: origin.x, y: 25 }, COLORS.muted);
  label(ctx, "x", { x: width - 23, y: origin.y + 18 }, COLORS.muted, 14);
  label(ctx, "y", { x: origin.x + 17, y: 18 }, COLORS.muted, 14);
  return origin;
}

function drawNumberLine(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number, mode: MathVisualProps["mode"]) {
  const y = height * 0.55;
  const left = 42;
  const right = width - 42;
  arrow(ctx, { x: left, y }, { x: right, y }, COLORS.ink);
  const step = (right - left) / 10;
  for (let value = -5; value <= 5; value += 1) {
    const x = left + (value + 5) * step;
    line(ctx, { x, y: y - 7 }, { x, y: y + 7 }, COLORS.ink, value === 0 ? 3 : 1.5);
    label(ctx, String(value), { x, y: y + 25 }, value === 0 ? COLORS.orange : COLORS.muted, 13);
  }
  const targets = [-3, 4, -1, 2, 5];
  const target = targets[variant % targets.length];
  const startValue = mode === "example" ? (target > 0 ? -2 : 3) : 0;
  const current = mix(startValue, target, ease(p));
  const point = { x: left + (current + 5) * step, y: y - 4 };
  if (mode === "example") {
    const startX = left + (startValue + 5) * step;
    ctx.save();
    ctx.strokeStyle = COLORS.blue;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc((startX + point.x) / 2, y - 6, Math.abs(point.x - startX) / 2, Math.PI, 0, target < startValue);
    ctx.stroke();
    ctx.restore();
  }
  dot(ctx, point, COLORS.orange, 8);
  label(ctx, current.toFixed(p < 1 ? 1 : 0), { x: point.x, y: y - 30 }, COLORS.orange, 16);
  label(ctx, "负数在左", { x: left + 55, y: 30 }, COLORS.blue, 14);
  label(ctx, "正数在右", { x: right - 55, y: 30 }, COLORS.green, 14);
}

function drawOperation(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number) {
  const positive = 4 + (variant % 3);
  const negative = 2 + (variant % 2);
  label(ctx, "正数", { x: width * 0.25, y: 28 }, COLORS.green, 15);
  label(ctx, "负数", { x: width * 0.72, y: 28 }, COLORS.orange, 15);
  for (let i = 0; i < positive; i += 1) {
    const x = 52 + (i % 4) * 42;
    const y = 70 + Math.floor(i / 4) * 44;
    dot(ctx, { x, y }, COLORS.green, 15);
    label(ctx, "+", { x, y }, COLORS.paper, 18);
  }
  for (let i = 0; i < negative; i += 1) {
    const x = width * 0.58 + (i % 4) * 42;
    const y = 70 + Math.floor(i / 4) * 44;
    dot(ctx, { x, y }, COLORS.orange, 15);
    label(ctx, "−", { x, y }, COLORS.paper, 18);
  }
  const pairs = Math.min(positive, negative);
  for (let i = 0; i < pairs; i += 1) {
    const left = { x: 52 + (i % 4) * 42, y: 70 + Math.floor(i / 4) * 44 };
    const right = { x: width * 0.58 + (i % 4) * 42, y: 70 + Math.floor(i / 4) * 44 };
    arrow(ctx, left, right, COLORS.blue, p);
  }
  roundRect(ctx, width * 0.31, height - 55, width * 0.38, 38, COLORS.greenSoft);
  label(ctx, `抵消 ${pairs} 对，剩下 ${positive - negative}`, { x: width * 0.5, y: height - 36 }, COLORS.ink, 15);
}

function drawAlgebraTiles(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number) {
  const groups = 2 + (variant % 2);
  label(ctx, "长条代表 x", { x: 92, y: 25 }, COLORS.green, 14);
  label(ctx, "小方块代表 1", { x: width - 95, y: 25 }, COLORS.orange, 14);
  for (let i = 0; i < groups; i += 1) {
    const startX = 40 + i * 90;
    const endX = 70 + i * 58;
    roundRect(ctx, mix(startX, endX, p), 60, 72, 34, COLORS.greenSoft, COLORS.green, 7);
    label(ctx, "x", { x: mix(startX, endX, p) + 36, y: 77 }, COLORS.green, 17);
  }
  for (let i = 0; i < 3; i += 1) {
    const startX = width - 145 + i * 35;
    const endX = width * 0.55 + i * 35;
    roundRect(ctx, mix(startX, endX, p), 60, 27, 34, COLORS.orangeSoft, COLORS.orange, 6);
    label(ctx, "1", { x: mix(startX, endX, p) + 13.5, y: 77 }, COLORS.orange, 14);
  }
  arrow(ctx, { x: width * 0.5, y: 108 }, { x: width * 0.5, y: 145 }, COLORS.blue, p);
  roundRect(ctx, width * 0.22, 153, width * 0.56, 42, COLORS.paper, COLORS.blue, 10);
  label(ctx, `${groups} 个 x ＋ 3 个 1 ＝ ${groups}x＋3`, { x: width * 0.5, y: 174 }, COLORS.ink, 16);
}

function drawBalance(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number) {
  const center = { x: width / 2, y: 104 };
  const tilt = (variant % 2 === 0 ? -0.09 : 0.09) * (1 - ease(p));
  const half = Math.min(170, width * 0.34);
  const left = { x: center.x - Math.cos(tilt) * half, y: center.y - Math.sin(tilt) * half };
  const right = { x: center.x + Math.cos(tilt) * half, y: center.y + Math.sin(tilt) * half };
  line(ctx, left, right, COLORS.ink, 5);
  line(ctx, center, { x: center.x, y: height - 35 }, COLORS.ink, 5);
  line(ctx, { x: center.x - 45, y: height - 35 }, { x: center.x + 45, y: height - 35 }, COLORS.ink, 5);
  for (const side of [left, right]) {
    line(ctx, side, { x: side.x, y: side.y + 45 }, COLORS.muted, 2);
    line(ctx, { x: side.x - 50, y: side.y + 45 }, { x: side.x + 50, y: side.y + 45 }, COLORS.blue, 3);
  }
  roundRect(ctx, left.x - 40, left.y + 7, 38, 30, COLORS.greenSoft, COLORS.green, 6);
  label(ctx, "x", { x: left.x - 21, y: left.y + 22 }, COLORS.green, 16);
  roundRect(ctx, left.x + 4, left.y + 7, 34, 30, COLORS.orangeSoft, COLORS.orange, 6);
  label(ctx, "+2", { x: left.x + 21, y: left.y + 22 }, COLORS.orange, 13);
  roundRect(ctx, right.x - 35, right.y + 7, 70, 30, COLORS.blueSoft, COLORS.blue, 6);
  label(ctx, "5", { x: right.x, y: right.y + 22 }, COLORS.blue, 16);
  label(ctx, "两边同时减 2", { x: center.x, y: 28 }, COLORS.orange, 15);
  label(ctx, p > 0.92 ? "x＝3，天平仍平衡" : "等量变化中…", { x: center.x, y: height - 13 }, COLORS.green, 15);
}

function drawGeometryBasics(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number) {
  const center = { x: width * 0.36, y: height * 0.62 };
  const endA = { x: width * 0.78, y: height * 0.62 };
  const angle = [-0.55, -0.9, -1.25][variant % 3];
  const rayLength = Math.min(150, height * 0.58, width * 0.4);
  const endB = { x: center.x + rayLength * Math.cos(angle), y: center.y + rayLength * Math.sin(angle) };
  dot(ctx, center, COLORS.orange, 7);
  arrow(ctx, center, endA, COLORS.green, p);
  arrow(ctx, center, endB, COLORS.blue, p);
  angleArc(ctx, center, 45, angle, 0, COLORS.orange, p);
  label(ctx, "O", { x: center.x - 16, y: center.y + 15 }, COLORS.orange, 15);
  label(ctx, "A", { x: endA.x + 12, y: endA.y }, COLORS.green, 15);
  label(ctx, "B", { x: endB.x, y: endB.y - 14 }, COLORS.blue, 15);
  label(ctx, `∠AOB 约 ${Math.round(Math.abs(angle) * 180 / Math.PI)}°`, { x: width * 0.7, y: 34 }, COLORS.ink, 16);
}

function drawParallelLines(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number) {
  const y1 = 72;
  const y2 = height - 62;
  line(ctx, { x: 35, y: y1 }, { x: width - 35, y: y1 }, COLORS.green, 4);
  line(ctx, { x: 35, y: y2 }, { x: width - 35, y: y2 }, COLORS.green, 4);
  const top = { x: width * 0.38, y: 24 };
  const bottom = { x: width * 0.62, y: height - 20 };
  line(ctx, top, bottom, COLORS.ink, 4, p);
  const x1 = top.x + (bottom.x - top.x) * ((y1 - top.y) / (bottom.y - top.y));
  const x2 = top.x + (bottom.x - top.x) * ((y2 - top.y) / (bottom.y - top.y));
  angleArc(ctx, { x: x1, y: y1 }, 23, 0, 0.95, COLORS.orange, p);
  angleArc(ctx, { x: x2, y: y2 }, 23, Math.PI, Math.PI + 0.95, COLORS.orange, p);
  label(ctx, "∠1", { x: x1 + 42, y: y1 + 20 }, COLORS.orange, 15);
  label(ctx, "∠2", { x: x2 - 42, y: y2 - 20 }, COLORS.orange, 15);
  label(ctx, variant % 2 === 0 ? "内错角相等" : "同旁内角和是 180°", { x: width * 0.5, y: height / 2 }, COLORS.blue, 16);
}

function trianglePoints(width: number, height: number) {
  return {
    a: { x: width * 0.5, y: 30 },
    b: { x: width * 0.18, y: height - 35 },
    c: { x: width * 0.82, y: height - 35 },
  };
}

function drawTriangle(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number) {
  const { a, b, c } = trianglePoints(width, height);
  line(ctx, a, b, COLORS.ink, 4);
  line(ctx, b, c, COLORS.ink, 4);
  line(ctx, c, a, COLORS.ink, 4);
  label(ctx, "A", { x: a.x, y: a.y - 14 }, COLORS.orange, 15);
  label(ctx, "B", { x: b.x - 14, y: b.y + 5 }, COLORS.blue, 15);
  label(ctx, "C", { x: c.x + 14, y: c.y + 5 }, COLORS.green, 15);
  const middle = { x: (b.x + c.x) / 2, y: b.y };
  if (variant % 3 === 0) {
    dashedLine(ctx, a, middle, COLORS.orange, p);
    line(ctx, { x: middle.x, y: middle.y - 15 }, { x: middle.x + 15, y: middle.y - 15 }, COLORS.orange, 2, p);
    line(ctx, { x: middle.x + 15, y: middle.y - 15 }, { x: middle.x + 15, y: middle.y }, COLORS.orange, 2, p);
    label(ctx, "高", { x: middle.x + 26, y: height / 2 }, COLORS.orange, 15);
  } else if (variant % 3 === 1) {
    line(ctx, a, middle, COLORS.blue, 4, p);
    label(ctx, "中线", { x: middle.x + 30, y: height / 2 }, COLORS.blue, 15);
    label(ctx, "相等", { x: middle.x, y: middle.y + 18 }, COLORS.muted, 13);
  } else {
    line(ctx, a, middle, COLORS.green, 4, p);
    angleArc(ctx, a, 38, 1.08, 1.57, COLORS.green, p);
    angleArc(ctx, a, 45, 1.57, 2.06, COLORS.green, p);
    label(ctx, "角平分线", { x: middle.x + 48, y: height / 2 }, COLORS.green, 14);
  }
}

function drawCongruence(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number) {
  const base = [
    { x: width * 0.1, y: height - 42 },
    { x: width * 0.38, y: height - 42 },
    { x: width * 0.27, y: 54 },
  ];
  const targetShift = width * 0.54;
  const shift = mix(targetShift, width * 0.02, ease(p));
  ctx.save();
  ctx.globalAlpha = 0.62;
  for (let i = 0; i < 3; i += 1) line(ctx, base[i], base[(i + 1) % 3], COLORS.blue, 5);
  ctx.restore();
  const moved = base.map((point) => ({ x: point.x + shift, y: point.y }));
  for (let i = 0; i < 3; i += 1) line(ctx, moved[i], moved[(i + 1) % 3], COLORS.orange, 4);
  arrow(ctx, { x: width * 0.68, y: 32 }, { x: width * 0.32, y: 32 }, COLORS.green, p);
  label(ctx, p > 0.95 ? "完全重合＝全等" : "移动，不改变大小和形状", { x: width * 0.5, y: height - 14 }, COLORS.ink, 15);
  if (variant % 2) label(ctx, "对应边一样长", { x: width * 0.5, y: 52 }, COLORS.plum, 14);
}

function drawSymmetry(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number) {
  const axisX = width / 2;
  dashedLine(ctx, { x: axisX, y: 22 }, { x: axisX, y: height - 22 }, COLORS.plum);
  label(ctx, "对称轴", { x: axisX + 38, y: 26 }, COLORS.plum, 14);
  const left = [
    { x: axisX - 55, y: 48 },
    { x: axisX - 130, y: height * 0.52 },
    { x: axisX - 72, y: height - 38 },
  ];
  const factor = ease(p);
  const reflected = left.map((point) => ({ x: mix(axisX, axisX + (axisX - point.x), factor), y: point.y }));
  for (let i = 0; i < left.length - 1; i += 1) line(ctx, left[i], left[i + 1], COLORS.blue, 5);
  for (let i = 0; i < reflected.length - 1; i += 1) line(ctx, reflected[i], reflected[i + 1], COLORS.orange, 5);
  left.forEach((point, index) => {
    dot(ctx, point, COLORS.blue, 6);
    dot(ctx, reflected[index], COLORS.orange, 6);
    dashedLine(ctx, point, reflected[index], COLORS.line, factor);
  });
  label(ctx, variant % 2 ? "两边距离相等" : "翻折后正好重合", { x: width / 2, y: height - 12 }, COLORS.ink, 15);
}

function drawRightTriangle(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number) {
  const a = { x: width * 0.27, y: height - 36 };
  const b = { x: width * 0.27, y: 47 };
  const c = { x: width * 0.72, y: height - 36 };
  line(ctx, a, b, COLORS.blue, 5, p);
  line(ctx, a, c, COLORS.green, 5, p);
  line(ctx, b, c, COLORS.orange, 5, p);
  line(ctx, { x: a.x, y: a.y - 18 }, { x: a.x + 18, y: a.y - 18 }, COLORS.ink, 2);
  line(ctx, { x: a.x + 18, y: a.y - 18 }, { x: a.x + 18, y: a.y }, COLORS.ink, 2);
  label(ctx, "a＝3", { x: a.x - 34, y: (a.y + b.y) / 2 }, COLORS.blue, 15);
  label(ctx, "b＝4", { x: (a.x + c.x) / 2, y: a.y + 18 }, COLORS.green, 15);
  label(ctx, "c＝5", { x: (b.x + c.x) / 2 + 22, y: (b.y + c.y) / 2 - 15 }, COLORS.orange, 15);
  roundRect(ctx, width * 0.63, 34, 115, 42, COLORS.orangeSoft, COLORS.orange, 9);
  label(ctx, variant % 2 ? "3²＋4²＝5²" : "a²＋b²＝c²", { x: width * 0.63 + 57.5, y: 55 }, COLORS.ink, 15);
}

function drawQuadrilateral(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number) {
  const shape = variant % 3;
  const points = shape === 0
    ? [{ x: width * 0.26, y: 52 }, { x: width * 0.72, y: 52 }, { x: width * 0.82, y: height - 45 }, { x: width * 0.16, y: height - 45 }]
    : shape === 1
      ? [{ x: width * 0.28, y: 42 }, { x: width * 0.72, y: 42 }, { x: width * 0.72, y: height - 38 }, { x: width * 0.28, y: height - 38 }]
      : [{ x: width * 0.5, y: 30 }, { x: width * 0.76, y: height / 2 }, { x: width * 0.5, y: height - 30 }, { x: width * 0.24, y: height / 2 }];
  for (let i = 0; i < 4; i += 1) line(ctx, points[i], points[(i + 1) % 4], COLORS.green, 5);
  line(ctx, points[0], points[2], COLORS.orange, 3, p);
  line(ctx, points[1], points[3], COLORS.blue, 3, p);
  dot(ctx, { x: (points[0].x + points[2].x) / 2, y: (points[0].y + points[2].y) / 2 }, COLORS.plum, 6);
  const names = ["平行四边形", "矩形", "菱形"];
  label(ctx, names[shape], { x: width / 2, y: 18 }, COLORS.ink, 16);
  label(ctx, "对角线在中点相交", { x: width / 2, y: height - 12 }, COLORS.plum, 14);
}

function drawCoordinate(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number) {
  const origin = drawAxes(ctx, width, height);
  const targets = [
    { x: origin.x + width * 0.25, y: origin.y - height * 0.28, value: "(3，2)" },
    { x: origin.x - width * 0.23, y: origin.y - height * 0.3, value: "(−2，3)" },
    { x: origin.x - width * 0.22, y: origin.y + height * 0.25, value: "(−2，−2)" },
    { x: origin.x + width * 0.24, y: origin.y + height * 0.23, value: "(3，−2)" },
  ];
  const target = targets[variant % targets.length];
  const middle = { x: mix(origin.x, target.x, p), y: origin.y };
  const current = { x: middle.x, y: mix(origin.y, target.y, p) };
  arrow(ctx, origin, middle, COLORS.green, p);
  arrow(ctx, middle, current, COLORS.orange, p);
  dashedLine(ctx, current, { x: origin.x, y: current.y }, COLORS.line);
  dot(ctx, current, COLORS.orange, 8);
  label(ctx, target.value, { x: target.x + (target.x > origin.x ? 35 : -35), y: target.y - 14 }, COLORS.orange, 15);
  label(ctx, "先横后竖", { x: width * 0.22, y: 24 }, COLORS.green, 15);
}

function drawLinearGraph(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number) {
  const origin = drawAxes(ctx, width, height);
  const slopes = [0.55, -0.5, 0.9];
  const slope = slopes[variant % slopes.length];
  const start = { x: 50, y: origin.y + slope * (origin.x - 50) };
  const end = { x: width - 45, y: origin.y - slope * (width - 45 - origin.x) };
  line(ctx, start, end, COLORS.blue, 5, p);
  const point = { x: mix(start.x, end.x, p), y: mix(start.y, end.y, p) };
  dot(ctx, point, COLORS.orange, 8);
  label(ctx, slope > 0 ? "x 变大，y 也变大" : "x 变大，y 反而变小", { x: width / 2, y: 24 }, slope > 0 ? COLORS.green : COLORS.orange, 15);
}

function drawFunctionMachine(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number) {
  const input = 2 + (variant % 4);
  const output = input * 2 + 1;
  roundRect(ctx, 35, 78, 74, 58, COLORS.blueSoft, COLORS.blue, 12);
  label(ctx, `x＝${input}`, { x: 72, y: 107 }, COLORS.blue, 17);
  roundRect(ctx, width / 2 - 74, 55, 148, 105, COLORS.greenSoft, COLORS.green, 18);
  label(ctx, "×2，再＋1", { x: width / 2, y: 94 }, COLORS.green, 17);
  label(ctx, "同一条规则", { x: width / 2, y: 126 }, COLORS.muted, 13);
  roundRect(ctx, width - 109, 78, 74, 58, COLORS.orangeSoft, COLORS.orange, 12);
  label(ctx, p > 0.75 ? `y＝${output}` : "y＝？", { x: width - 72, y: 107 }, COLORS.orange, 17);
  arrow(ctx, { x: 112, y: 107 }, { x: width / 2 - 80, y: 107 }, COLORS.blue, p);
  arrow(ctx, { x: width / 2 + 80, y: 107 }, { x: width - 114, y: 107 }, COLORS.orange, p);
}

function drawDataChart(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number) {
  const values = variant % 2 === 0 ? [3, 7, 5, 9] : [8, 4, 6, 3];
  const colors = [COLORS.green, COLORS.orange, COLORS.blue, COLORS.plum];
  const baseY = height - 38;
  line(ctx, { x: 48, y: 28 }, { x: 48, y: baseY }, COLORS.ink, 2);
  line(ctx, { x: 48, y: baseY }, { x: width - 35, y: baseY }, COLORS.ink, 2);
  const gap = (width - 110) / values.length;
  values.forEach((value, index) => {
    const barHeight = value * 13 * ease(p);
    const x = 68 + index * gap;
    ctx.save();
    ctx.fillStyle = colors[index];
    ctx.beginPath();
    ctx.roundRect(x, baseY - barHeight, Math.min(46, gap - 12), barHeight, 7);
    ctx.fill();
    ctx.restore();
    label(ctx, String(value), { x: x + Math.min(46, gap - 12) / 2, y: baseY - barHeight - 13 }, colors[index], 14);
    label(ctx, ["甲", "乙", "丙", "丁"][index], { x: x + Math.min(46, gap - 12) / 2, y: baseY + 18 }, COLORS.muted, 13);
  });
  label(ctx, variant % 2 === 0 ? "比较高低" : "先读刻度，再下结论", { x: width * 0.62, y: 22 }, COLORS.ink, 15);
}

function drawRoots(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number) {
  const side = Math.min(135, height - 62);
  const x = width * 0.22;
  const y = 38;
  ctx.save();
  ctx.globalAlpha = 0.2 + 0.8 * p;
  ctx.fillStyle = COLORS.blueSoft;
  ctx.fillRect(x, y, side, side);
  ctx.restore();
  ctx.strokeStyle = COLORS.blue;
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, side, side);
  for (let i = 1; i < 4; i += 1) {
    line(ctx, { x: x + side * i / 4, y }, { x: x + side * i / 4, y: y + side }, COLORS.line, 1.2, p);
    line(ctx, { x, y: y + side * i / 4 }, { x: x + side, y: y + side * i / 4 }, COLORS.line, 1.2, p);
  }
  label(ctx, "面积 16", { x: x + side / 2, y: y + side / 2 }, COLORS.blue, 17);
  arrow(ctx, { x: x + side + 28, y: y + side / 2 }, { x: width * 0.7, y: y + side / 2 }, COLORS.orange, p);
  const answerX = width * 0.68;
  const answerWidth = Math.max(72, width * 0.27);
  roundRect(ctx, answerX, y + side / 2 - 35, answerWidth, 70, COLORS.orangeSoft, COLORS.orange, 12);
  label(ctx, variant % 2 ? "√16＝4" : "边长＝4", { x: answerX + answerWidth / 2, y: y + side / 2 }, COLORS.orange, width < 360 ? 14 : 18);
}

function drawQuadratic(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number) {
  const origin = drawAxes(ctx, width, height);
  const up = variant % 2 === 0;
  const vertex = { x: origin.x + (variant % 3 - 1) * 35, y: up ? height * 0.72 : height * 0.28 };
  ctx.save();
  ctx.strokeStyle = up ? COLORS.green : COLORS.orange;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  const steps = Math.max(2, Math.floor(80 * p));
  for (let i = 0; i <= steps; i += 1) {
    const t = -1 + (2 * i) / 80;
    const x = vertex.x + t * width * 0.34;
    const y = vertex.y + (up ? 1 : -1) * t * t * height * 0.72;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
  dot(ctx, vertex, COLORS.plum, 8);
  label(ctx, "顶点", { x: vertex.x + 34, y: vertex.y }, COLORS.plum, 14);
  label(ctx, up ? "开口向上，有最低点" : "开口向下，有最高点", { x: width / 2, y: 20 }, up ? COLORS.green : COLORS.orange, 15);
}

function rotatePoint(point: Point, center: Point, radians: number): Point {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * Math.cos(radians) - dy * Math.sin(radians),
    y: center.y + dx * Math.sin(radians) + dy * Math.cos(radians),
  };
}

function drawRotation(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number) {
  const center = { x: width / 2, y: height / 2 + 12 };
  const original = [
    { x: center.x + 25, y: center.y - 80 },
    { x: center.x + 105, y: center.y + 10 },
    { x: center.x + 25, y: center.y + 48 },
  ];
  original.forEach((point, index) => line(ctx, point, original[(index + 1) % 3], COLORS.blue, 4));
  const radians = (variant % 2 ? Math.PI : Math.PI / 2) * ease(p);
  const moved = original.map((point) => rotatePoint(point, center, radians));
  moved.forEach((point, index) => line(ctx, point, moved[(index + 1) % 3], COLORS.orange, 5));
  dot(ctx, center, COLORS.plum, 7);
  label(ctx, "旋转中心 O", { x: center.x, y: center.y + 72 }, COLORS.plum, 14);
  angleArc(ctx, center, 56, -Math.PI / 2, -Math.PI / 2 + radians, COLORS.green);
  label(ctx, variant % 2 ? "转 180°" : "转 90°", { x: width / 2, y: 20 }, COLORS.green, 16);
}

function drawCircle(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number) {
  const center = { x: width * 0.45, y: height * 0.54 };
  const radius = Math.min(78, height * 0.36);
  ctx.save();
  ctx.strokeStyle = COLORS.blue;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2 * p);
  ctx.stroke();
  ctx.restore();
  dot(ctx, center, COLORS.orange, 6);
  label(ctx, "O", { x: center.x - 16, y: center.y + 12 }, COLORS.orange, 14);
  const point = { x: center.x + radius * Math.cos(-0.55), y: center.y + radius * Math.sin(-0.55) };
  if (variant % 3 === 0) {
    line(ctx, center, point, COLORS.green, 4, p);
    label(ctx, "半径 r", { x: (center.x + point.x) / 2, y: (center.y + point.y) / 2 - 15 }, COLORS.green, 14);
  } else if (variant % 3 === 1) {
    line(ctx, { x: center.x - radius, y: center.y }, { x: center.x + radius, y: center.y }, COLORS.orange, 4, p);
    label(ctx, "直径 d＝2r", { x: center.x, y: center.y - 17 }, COLORS.orange, 14);
  } else {
    const tangentStart = { x: point.x - 45, y: point.y - 70 };
    const tangentEnd = { x: point.x + 75, y: point.y + 40 };
    line(ctx, tangentStart, tangentEnd, COLORS.green, 4, p);
    line(ctx, center, point, COLORS.orange, 3, p);
    label(ctx, "半径⊥切线", { x: width * 0.76, y: height * 0.32 }, COLORS.green, 14);
  }
  const moving = { x: center.x + radius * Math.cos(Math.PI * 2 * p), y: center.y + radius * Math.sin(Math.PI * 2 * p) };
  dot(ctx, moving, COLORS.plum, 6);
}

function drawProbability(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number) {
  const boxX = width * 0.06;
  const boxWidth = width * 0.48;
  roundRect(ctx, boxX, 38, boxWidth, height - 68, COLORS.paper, COLORS.blue, 16);
  const ballColors = [COLORS.orange, COLORS.blue, COLORS.orange, COLORS.green, COLORS.orange, COLORS.plum];
  const positions = [
    { x: boxX + boxWidth * 0.22, y: 82 }, { x: boxX + boxWidth * 0.5, y: 72 }, { x: boxX + boxWidth * 0.78, y: 88 },
    { x: boxX + boxWidth * 0.26, y: 135 }, { x: boxX + boxWidth * 0.54, y: 139 }, { x: boxX + boxWidth * 0.8, y: 132 },
  ];
  positions.forEach((point, index) => {
    const bob = Math.sin((index + 1) * 1.7 + p * Math.PI * 2) * 5;
    dot(ctx, { x: point.x, y: point.y + bob }, ballColors[index], 18);
    label(ctx, String(index + 1), { x: point.x, y: point.y + bob }, COLORS.paper, 12);
  });
  arrow(ctx, { x: width * 0.56, y: height / 2 }, { x: width * 0.7, y: height / 2 }, COLORS.green, p);
  roundRect(ctx, width * 0.7, 60, width * 0.25, 95, COLORS.orangeSoft, COLORS.orange, 14);
  label(ctx, "橙球 3 个", { x: width * 0.825, y: 88 }, COLORS.orange, 15);
  label(ctx, "全部 6 个", { x: width * 0.825, y: 116 }, COLORS.ink, 15);
  label(ctx, variant % 2 ? "概率＝3÷6" : "先数符合，再数全部", { x: width * 0.825, y: 143 }, COLORS.green, 14);
}

function drawInverseGraph(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number) {
  const origin = drawAxes(ctx, width, height);
  ctx.save();
  ctx.strokeStyle = COLORS.plum;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  for (const sign of [-1, 1]) {
    ctx.beginPath();
    const steps = Math.max(2, Math.floor(48 * p));
    for (let i = 0; i <= steps; i += 1) {
      const t = 0.16 + (0.84 * i) / 48;
      const x = origin.x + sign * t * width * 0.4;
      const y = origin.y - sign * (height * 0.16 / t);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
  label(ctx, variant % 2 ? "xy＝k" : "x 变大，y 变小", { x: width * 0.73, y: 24 }, COLORS.plum, 15);
}

function drawSimilarity(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number) {
  const small = [
    { x: 46, y: height - 42 },
    { x: 155, y: height - 42 },
    { x: 103, y: 66 },
  ];
  small.forEach((point, index) => line(ctx, point, small[(index + 1) % 3], COLORS.blue, 4));
  const scale = mix(0.35, 1, ease(p));
  const center = { x: width * 0.7, y: height * 0.58 };
  const sourceCenter = { x: 103, y: height * 0.58 };
  const large = small.map((point) => ({
    x: center.x + (point.x - sourceCenter.x) * scale * 1.45,
    y: center.y + (point.y - sourceCenter.y) * scale * 1.45,
  }));
  large.forEach((point, index) => line(ctx, point, large[(index + 1) % 3], COLORS.orange, 5));
  arrow(ctx, { x: 175, y: height / 2 }, { x: width * 0.52, y: height / 2 }, COLORS.green, p);
  label(ctx, variant % 2 ? "对应边同倍放大" : "角相等，形状不变", { x: width / 2, y: 24 }, COLORS.ink, 15);
  label(ctx, "小", { x: 103, y: height - 16 }, COLORS.blue, 14);
  label(ctx, "大", { x: center.x, y: height - 16 }, COLORS.orange, 14);
}

function drawTrigonometry(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number) {
  const a = { x: width * 0.2, y: height - 34 };
  const b = { x: width * 0.77, y: height - 34 };
  const c = { x: width * 0.77, y: 42 };
  line(ctx, a, b, COLORS.green, 5, p);
  line(ctx, b, c, COLORS.blue, 5, p);
  line(ctx, a, c, COLORS.orange, 5, p);
  angleArc(ctx, a, 42, -0.5, 0, COLORS.plum, p);
  label(ctx, "θ", { x: a.x + 52, y: a.y - 14 }, COLORS.plum, 16);
  label(ctx, "邻边", { x: (a.x + b.x) / 2, y: a.y + 17 }, COLORS.green, 15);
  label(ctx, "对边", { x: b.x + 28, y: (b.y + c.y) / 2 }, COLORS.blue, 15);
  label(ctx, "斜边", { x: (a.x + c.x) / 2 - 18, y: (a.y + c.y) / 2 - 18 }, COLORS.orange, 15);
  const formulas = ["sin θ＝对边÷斜边", "cos θ＝邻边÷斜边", "tan θ＝对边÷邻边"];
  roundRect(ctx, 35, 25, 165, 34, COLORS.plumSoft, COLORS.plum, 8);
  label(ctx, formulas[variant % formulas.length], { x: 117.5, y: 42 }, COLORS.plum, 13);
}

function drawSolidView(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number) {
  const ox = 52;
  const oy = 58;
  const s = 65;
  const dx = 32;
  const dy = -25;
  const front = [{ x: ox, y: oy }, { x: ox + s, y: oy }, { x: ox + s, y: oy + s }, { x: ox, y: oy + s }];
  const back = front.map((point) => ({ x: point.x + dx, y: point.y + dy }));
  front.forEach((point, index) => line(ctx, point, front[(index + 1) % 4], COLORS.blue, 3, p));
  back.forEach((point, index) => line(ctx, point, back[(index + 1) % 4], COLORS.green, 3, p));
  front.forEach((point, index) => line(ctx, point, back[index], COLORS.orange, 3, p));
  const viewX = width * 0.47;
  const available = width - viewX - 14;
  const cardWidth = Math.min(64, (available - 12) / 3);
  const cardGap = Math.max(6, (available - cardWidth * 3) / 2);
  const viewSquare = Math.max(22, Math.min(40, cardWidth - 14));
  ["正面", "上面", "侧面"].forEach((name, index) => {
    const x = viewX + index * (cardWidth + cardGap);
    roundRect(ctx, x, 60, cardWidth, 64, index === variant % 3 ? COLORS.orangeSoft : COLORS.paper, COLORS.line, 8);
    ctx.strokeStyle = index === variant % 3 ? COLORS.orange : COLORS.blue;
    ctx.lineWidth = 3;
    ctx.strokeRect(x + (cardWidth - viewSquare) / 2, 72, viewSquare, 40);
    label(ctx, name, { x: x + cardWidth / 2, y: 144 }, index === variant % 3 ? COLORS.orange : COLORS.muted, width < 360 ? 11 : 13);
  });
  arrow(ctx, { x: 165, y: 92 }, { x: viewX - 12, y: 92 }, COLORS.plum, p);
  label(ctx, "同一个物体，换方向看", { x: width * 0.68, y: 28 }, COLORS.ink, 15);
}

function drawReview(ctx: CanvasRenderingContext2D, width: number, height: number, variant: number, p: number) {
  const steps = ["读题", "找关系", "一步步算", "回头检查"];
  const cardWidth = (width - 70) / 4;
  steps.forEach((step, index) => {
    const active = p * 4 >= index + 0.2;
    const x = 20 + index * (cardWidth + 10);
    roundRect(ctx, x, 66, cardWidth, 78, active ? [COLORS.blueSoft, COLORS.greenSoft, COLORS.orangeSoft, COLORS.plumSoft][index] : COLORS.paper, active ? [COLORS.blue, COLORS.green, COLORS.orange, COLORS.plum][index] : COLORS.line, 12);
    label(ctx, String(index + 1), { x: x + cardWidth / 2, y: 88 }, active ? COLORS.ink : COLORS.muted, 15);
    label(ctx, step, { x: x + cardWidth / 2, y: 120 }, active ? COLORS.ink : COLORS.muted, 14);
    if (index < 3) arrow(ctx, { x: x + cardWidth + 2, y: 105 }, { x: x + cardWidth + 9, y: 105 }, COLORS.muted, p);
  });
  label(ctx, variant % 2 ? "难题也拆成小步骤" : "先慢后快，做完必查", { x: width / 2, y: 28 }, COLORS.green, 16);
  label(ctx, "✓", { x: width - 34, y: height - 24 }, p > 0.96 ? COLORS.green : COLORS.line, 26);
}

function renderScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  kind: VisualKind,
  variant: number,
  progress: number,
  mode: MathVisualProps["mode"],
) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, width, height);
  const p = ease(progress);
  switch (kind) {
    case "number-line": drawNumberLine(ctx, width, height, variant, p, mode); break;
    case "operation": drawOperation(ctx, width, height, variant, p); break;
    case "algebra-tiles": drawAlgebraTiles(ctx, width, height, variant, p); break;
    case "balance": drawBalance(ctx, width, height, variant, p); break;
    case "geometry-basics": drawGeometryBasics(ctx, width, height, variant, p); break;
    case "parallel-lines": drawParallelLines(ctx, width, height, variant, p); break;
    case "triangle": drawTriangle(ctx, width, height, variant, p); break;
    case "congruence": drawCongruence(ctx, width, height, variant, p); break;
    case "symmetry": drawSymmetry(ctx, width, height, variant, p); break;
    case "right-triangle": drawRightTriangle(ctx, width, height, variant, p); break;
    case "quadrilateral": drawQuadrilateral(ctx, width, height, variant, p); break;
    case "coordinate": drawCoordinate(ctx, width, height, variant, p); break;
    case "linear-graph": drawLinearGraph(ctx, width, height, variant, p); break;
    case "function-machine": drawFunctionMachine(ctx, width, height, variant, p); break;
    case "data-chart": drawDataChart(ctx, width, height, variant, p); break;
    case "roots": drawRoots(ctx, width, height, variant, p); break;
    case "quadratic": drawQuadratic(ctx, width, height, variant, p); break;
    case "rotation": drawRotation(ctx, width, height, variant, p); break;
    case "circle": drawCircle(ctx, width, height, variant, p); break;
    case "probability": drawProbability(ctx, width, height, variant, p); break;
    case "inverse-graph": drawInverseGraph(ctx, width, height, variant, p); break;
    case "similarity": drawSimilarity(ctx, width, height, variant, p); break;
    case "trigonometry": drawTrigonometry(ctx, width, height, variant, p); break;
    case "solid-view": drawSolidView(ctx, width, height, variant, p); break;
    case "review": drawReview(ctx, width, height, variant, p); break;
  }
}

export function MathVisual({ kind, itemIndex, mode, text }: MathVisualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const progressRef = useRef(1);
  const startedAtRef = useRef(0);
  const startProgressRef = useRef(0);
  const [playState, setPlayState] = useState<PlayState>("ready");
  const [reducedMotion, setReducedMotion] = useState(false);
  const copy = VISUAL_COPY[kind];
  const variant = itemIndex + (mode === "example" ? 3 : 0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(280, Math.round(rect.width));
    const height = Math.max(185, Math.round(rect.height));
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const pixelWidth = Math.round(width * ratio);
    const pixelHeight = Math.round(height * ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    renderScene(ctx, width, height, kind, variant, progressRef.current, mode);
  }, [kind, mode, variant]);

  const animate = useCallback(() => {
    const duration = 4200;
    const tick = (now: number) => {
      const elapsed = now - startedAtRef.current;
      progressRef.current = Math.min(1, startProgressRef.current + elapsed / duration);
      draw();
      if (progressRef.current < 1) {
        frameRef.current = window.requestAnimationFrame(tick);
      } else {
        frameRef.current = null;
        setPlayState("ready");
      }
    };
    frameRef.current = window.requestAnimationFrame(tick);
  }, [draw]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    updateMotion();
    media.addEventListener?.("change", updateMotion);
    const canvas = canvasRef.current;
    const observer = canvas && "ResizeObserver" in window ? new ResizeObserver(draw) : null;
    if (canvas && observer) observer.observe(canvas);
    draw();
    return () => {
      media.removeEventListener?.("change", updateMotion);
      observer?.disconnect();
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [draw]);

  function handlePlay() {
    if (reducedMotion) return;
    if (playState === "playing") {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      setPlayState("paused");
      return;
    }
    if (playState === "ready") progressRef.current = 0;
    startProgressRef.current = progressRef.current;
    startedAtRef.current = performance.now();
    setPlayState("playing");
    animate();
  }

  const buttonLabel = reducedMotion
    ? "已按系统设置关闭动画"
    : playState === "playing"
      ? "暂停动画"
      : playState === "paused"
        ? "继续动画"
        : "播放动画";

  return (
    <figure className={`math-visual ${mode === "example" ? "example-visual" : "idea-visual"}`}>
      <div className="math-visual-canvas-wrap">
        <span className="visual-type">{mode === "idea" ? "知识图解" : "例题图解"}</span>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`${copy.name}：${text}`}
        >
          {copy.name}：{copy.note}
        </canvas>
      </div>
      <figcaption>
        <div>
          <strong>{copy.name}</strong>
          <span>{copy.note}</span>
        </div>
        <button type="button" onClick={handlePlay} disabled={reducedMotion} aria-pressed={playState === "playing"}>
          <span aria-hidden="true">{playState === "playing" ? "Ⅱ" : "▶"}</span>
          {buttonLabel}
        </button>
      </figcaption>
    </figure>
  );
}
