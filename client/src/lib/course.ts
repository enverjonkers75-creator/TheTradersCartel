export type CourseLesson = {
  key: string;
  title: string;
  label: string;
  description: string;
  videoUrl: string | null;
};

// Add each supplied course video URL here. The lesson order controls unlocking.
export const courseLessons: CourseLesson[] = [
  {
    key: "introduction",
    label: "Start here",
    title: "Introduction",
    description: "Welcome to TheTradersCartel course and the learning path ahead.",
    videoUrl: null,
  },
  ...Array.from({ length: 8 }, (_, index) => ({
    key: `lesson-${String(index + 1).padStart(2, "0")}`,
    label: `Lesson ${String(index + 1).padStart(2, "0")}`,
    title: `Course lesson ${String(index + 1).padStart(2, "0")}`,
    description: "This lesson is ready for its course video and final title.",
    videoUrl: null,
  })),
];

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
