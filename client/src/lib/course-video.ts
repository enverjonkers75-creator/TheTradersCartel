import { supabase } from "@/lib/supabase";

const courseVideoApi = ((import.meta.env.VITE_COURSE_VIDEO_API_URL as string | undefined)
  || "https://thetraderscartel-course-video.enverjonkers75.workers.dev").replace(/\/$/, "");

export async function getCoursePlaybackUrl(lessonKey: string) {
  if (!courseVideoApi) throw new Error("Course video service is not configured yet.");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Please sign in again to continue.");
  const response = await fetch(`${courseVideoApi}/ticket`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ lessonKey }),
  });
  const result = await response.json() as { url?: string; error?: string };
  if (!response.ok || !result.url) throw new Error(result.error || "Video could not be loaded.");
  return result.url;
}
