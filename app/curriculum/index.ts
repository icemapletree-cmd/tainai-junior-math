import { foundationGrade7Units } from "./foundation-grade7";
import { grade8Units } from "./grade8";
import { grade9Units } from "./grade9";

export type {
  Lesson,
  PracticeQuestion,
  Unit,
  WorkedExample,
} from "./types";

export const curriculum = [
  ...foundationGrade7Units,
  ...grade8Units,
  ...grade9Units,
];
