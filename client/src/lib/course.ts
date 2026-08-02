export type CourseLesson = {
  key: string;
  title: string;
  label: string;
  description: string;
  module: string;
  storageKey: string | null;
};

import { generatedCourseLessons } from "@/lib/course-manifest.generated";

// Generated from the course drive. Array order controls sequential unlocking.
export const courseLessons: CourseLesson[] = generatedCourseLessons;

export function isCourseLessonUnlocked(index: number, completedKeys: Set<string>) {
  return index === 0 || completedKeys.has(courseLessons[index - 1].key);
}

export function getCourseCompletion(completedKeys: Set<string>) {
  const validKeys = new Set(courseLessons.map((lesson) => lesson.key));
  let completedCount = 0;
  completedKeys.forEach((key) => { if (validKeys.has(key)) completedCount += 1; });
  return {
    completedCount,
    percentage: Math.round((completedCount / courseLessons.length) * 100),
  };
}
