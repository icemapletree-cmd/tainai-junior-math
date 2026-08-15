export type WorkedExample = {
  question: string;
  steps: string[];
  answer: string;
};

export type PracticeQuestion = {
  question: string;
  hint: string;
  answer: string;
};

export type Lesson = {
  id: string;
  title: string;
  intro: string;
  ideas: string[];
  examples: WorkedExample[];
  practice: PracticeQuestion[];
  tip?: string;
};

export type Unit = {
  id: string;
  stage: "启蒙补基础" | "七年级" | "八年级" | "九年级";
  title: string;
  description: string;
  lessons: Lesson[];
};
