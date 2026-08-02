export type CourseLesson = {
  key: string;
  title: string;
  label: string;
  description: string;
  module: string;
  storageKey: string | null;
  track?: "summary" | "course";
};

import { generatedCourseLessons } from "@/lib/course-manifest.generated";

// These slots stay at the beginning of the member course. Add the final R2
// storage keys here when the five summary videos are supplied.
export const courseSummaryLessons: CourseLesson[] = [
  {
    key: "summary-chapter-1",
    label: "Summary 01",
    title: "Chapter 1 Summary",
    description: "A concise review of the key ideas covered in Chapter 1.",
    module: "Course Summary",
    storageKey: null,
    track: "summary",
  },
  {
    key: "summary-chapter-2",
    label: "Summary 02",
    title: "Chapter 2 Summary",
    description: "A concise review of the key ideas covered in Chapter 2.",
    module: "Course Summary",
    storageKey: null,
    track: "summary",
  },
  {
    key: "summary-chapter-3",
    label: "Summary 03",
    title: "Chapter 3 Summary",
    description: "A concise review of the key ideas covered in Chapter 3.",
    module: "Course Summary",
    storageKey: null,
    track: "summary",
  },
  {
    key: "summary-how-to-analyse",
    label: "Summary 04",
    title: "How To Analyse",
    description: "A practical summary of the complete analysis process.",
    module: "Course Summary",
    storageKey: null,
    track: "summary",
  },
  {
    key: "summary-daily-4h-breakdown",
    label: "Summary 05",
    title: "Daily & 4H Breakdown",
    description: "A focused walkthrough of the daily and four-hour market breakdown.",
    module: "Course Summary",
    storageKey: null,
    track: "summary",
  },
];

// Generated lesson keys remain unchanged so existing member progress is kept.
export const courseLessons: CourseLesson[] = [
  ...courseSummaryLessons,
  ...generatedCourseLessons.map((lesson) => ({ ...lesson, track: "course" as const })),
];

export function isCourseLessonUnlocked(index: number, completedKeys: Set<string>) {
  const lesson = courseLessons[index];
  if (!lesson) return false;
  const trackLessons = courseLessons.filter((item) => item.track === lesson.track);
  const trackIndex = trackLessons.findIndex((item) => item.key === lesson.key);
  if (trackIndex <= 0) return true;
  const previous = trackLessons[trackIndex - 1];
  // Empty summary slots stay browseable and never block the full course.
  return !previous.storageKey || completedKeys.has(previous.key);
}

export function getCourseCompletion(completedKeys: Set<string>) {
  const availableLessons = courseLessons.filter((lesson) => lesson.storageKey);
  const validKeys = new Set(availableLessons.map((lesson) => lesson.key));
  let completedCount = 0;
  completedKeys.forEach((key) => { if (validKeys.has(key)) completedCount += 1; });
  return {
    completedCount,
    totalCount: availableLessons.length,
    percentage: availableLessons.length ? Math.round((completedCount / availableLessons.length) * 100) : 0,
  };
}
