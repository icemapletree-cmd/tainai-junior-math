import { grade7Visuals } from "./grade7-visuals";
import { grade8Visuals } from "./grade8-visuals";
import { grade9Visuals } from "./grade9-visuals";
import type { LessonVisualMap } from "./types";

export type { VisualKind } from "./types";

export const lessonVisuals: LessonVisualMap = {
  ...grade7Visuals,
  ...grade8Visuals,
  ...grade9Visuals,
};
