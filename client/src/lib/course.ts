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

const howToAnalyseKey = "061-practical-analysis-how-to-analyse";
const dailyBreakdownKey = "050-practical-analysis-daily-4h-breakdown";

function moveExistingLessonToSummary(key: string, label: string, description: string): CourseLesson {
  const lesson = generatedCourseLessons.find((item) => item.key === key);
  if (!lesson) throw new Error(`Missing summary source lesson: ${key}`);
  return {
    ...lesson,
    label,
    description,
    module: "Course Summary",
    track: "summary",
  };
}

// These summaries stay at the beginning of the member course. The final two
// reuse existing uploads that were previously at the end of the full course.
export const courseSummaryLessons: CourseLesson[] = [
  {
    key: "summary-chapter-1",
    label: "Summary 01",
    title: "Chapter 1 Summary",
    description: "A concise review of the key ideas covered in Chapter 1.",
    module: "Course Summary",
    storageKey: "course-v1/summary-chapter-1.mp4",
    track: "summary",
  },
  {
    key: "summary-chapter-2",
    label: "Summary 02",
    title: "Chapter 2 Summary",
    description: "A concise review of the key ideas covered in Chapter 2.",
    module: "Course Summary",
    storageKey: "course-v1/summary-chapter-2.mp4",
    track: "summary",
  },
  {
    key: "summary-chapter-3",
    label: "Summary 03",
    title: "Chapter 3 Summary",
    description: "A concise review of the key ideas covered in Chapter 3.",
    module: "Course Summary",
    storageKey: "course-v1/summary-chapter-3.mp4",
    track: "summary",
  },
  {
    ...moveExistingLessonToSummary(
      howToAnalyseKey,
      "Summary 04",
      "A practical summary of the complete analysis process.",
    ),
  },
  {
    ...moveExistingLessonToSummary(
      dailyBreakdownKey,
      "Summary 05",
      "A focused walkthrough of the daily and four-hour market breakdown.",
    ),
  },
];

// Generated lesson keys remain unchanged so existing member progress is kept.
export const courseLessons: CourseLesson[] = [
  ...courseSummaryLessons,
  ...generatedCourseLessons
    .filter((lesson) => lesson.key !== howToAnalyseKey && lesson.key !== dailyBreakdownKey)
    .map((lesson) => ({ ...lesson, track: "course" as const })),
];

export function isCourseLessonUnlocked(index: number, completedKeys: Set<string>) {
  const lesson = courseLessons[index];
  if (!lesson) return false;
  const trackLessons = courseLessons.filter((item) => item.track === lesson.track);
  const trackIndex = trackLessons.findIndex((item) => item.key === lesson.key);
  if (trackIndex <= 0) return true;
  const previous = trackLessons[trackIndex - 1];
  // Each track unlocks independently, so summaries never block the full course.
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
