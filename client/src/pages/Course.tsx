import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, CirclePlay, Clock3, LoaderCircle, LockKeyhole, Play, RefreshCw } from "lucide-react";
import { MemberLayout } from "@/components/member/MemberLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCourseProgress } from "@/hooks/use-member-data";
import { courseLessons, getCourseCompletion, isCourseLessonUnlocked } from "@/lib/course";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getCoursePlaybackUrl } from "@/lib/course-video";

export default function CoursePage() {
  const { profile } = useAuth();
  const { data: progress = [], isLoading } = useCourseProgress(profile?.id);
  const [activeKey, setActiveKey] = useState(courseLessons[0].key);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSavedSecond = useRef(0);
  const furthestSecond = useRef(0);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [playbackNonce, setPlaybackNonce] = useState(0);
  const { toast } = useToast();

  const progressByLesson = useMemo(
    () => new Map(progress.map((item) => [item.lesson_key, item])),
    [progress],
  );
  const completedKeys = useMemo(
    () => {
      const lessonKeys = new Set(courseLessons.map((lesson) => lesson.key));
      return new Set(progress.filter((item) => item.completed_at && lessonKeys.has(item.lesson_key)).map((item) => item.lesson_key));
    },
    [progress],
  );
  const activeIndex = courseLessons.findIndex((lesson) => lesson.key === activeKey);
  const activeLesson = courseLessons[Math.max(0, activeIndex)];
  const { completedCount, percentage: completion } = getCourseCompletion(completedKeys);
  const courseModules = useMemo(() => {
    const groups = new Map<string, Array<{ lesson: typeof courseLessons[number]; index: number }>>();
    courseLessons.forEach((lesson, index) => groups.set(lesson.module, [...(groups.get(lesson.module) || []), { lesson, index }]));
    return Array.from(groups.entries());
  }, []);

  async function saveProgress(seconds: number, completed = false) {
    if (!profile) return;
    const { error } = await supabase.from("course_lesson_progress").upsert({
      user_id: profile.id,
      lesson_key: activeLesson.key,
      watched_seconds: Math.max(0, Math.floor(seconds)),
      ...(completed ? { completed_at: new Date().toISOString() } : {}),
    }, { onConflict: "user_id,lesson_key" });
    if (error) {
      toast({ title: "Progress was not saved", description: error.message, variant: "destructive" });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["course-progress", profile.id] });
  }

  async function completeLesson() {
    const duration = videoRef.current?.duration || 0;
    await saveProgress(duration, true);
    const next = courseLessons[activeIndex + 1];
    if (next) {
      setActiveKey(next.key);
      toast({ title: "Next lesson unlocked", description: next.title });
    } else {
      toast({ title: "Course complete", description: "You have completed every lesson." });
    }
  }

  useEffect(() => {
    const savedSecond = progressByLesson.get(activeLesson.key)?.watched_seconds ?? 0;
    lastSavedSecond.current = savedSecond;
    furthestSecond.current = savedSecond;
  }, [activeLesson.key, progressByLesson]);

  useEffect(() => {
    let cancelled = false;
    setPlaybackUrl(null);
    setVideoError(null);
    if (!activeLesson.storageKey) return () => { cancelled = true; };
    setVideoLoading(true);
    getCoursePlaybackUrl(activeLesson.key)
      .then((url) => { if (!cancelled) setPlaybackUrl(url); })
      .catch((error: Error) => { if (!cancelled) setVideoError(error.message); })
      .finally(() => { if (!cancelled) setVideoLoading(false); });
    return () => { cancelled = true; };
  }, [activeLesson.key, activeLesson.storageKey, playbackNonce]);

  return (
    <MemberLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex flex-col gap-5 border-b border-white/[0.08] pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/32">Member course</p>
            <h1 className="mt-3 font-display text-4xl font-semibold uppercase tracking-[-0.02em] sm:text-5xl">Learn in order.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/42">Finish each video to unlock the next lesson. Your position and progress are saved automatically.</p>
          </div>
          <div className="min-w-[210px]">
            <div className="flex items-center justify-between text-xs text-white/45"><span>Course progress</span><span className="font-medium text-white">{completion}%</span></div>
            <div className="mt-3 h-1 overflow-hidden bg-white/10"><motion.div className="h-full bg-white" animate={{ width: `${completion}%` }} transition={{ duration: 0.45 }} /></div>
            <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-white/25">{completedCount} of {courseLessons.length} completed</p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div key={activeLesson.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.24 }}>
                <div className="relative aspect-video overflow-hidden bg-[#0b0b0b] ring-1 ring-white/[0.08]">
                  {playbackUrl ? (
                    <video
                      ref={videoRef}
                      key={playbackUrl}
                      src={playbackUrl}
                      controls
                      controlsList="nodownload noplaybackrate noremoteplayback"
                      disablePictureInPicture
                      disableRemotePlayback
                      className="h-full w-full bg-black object-contain"
                      onContextMenu={(event) => event.preventDefault()}
                      onLoadedMetadata={(event) => {
                        const resumeAt = progressByLesson.get(activeLesson.key)?.watched_seconds ?? 0;
                        if (resumeAt > 0 && resumeAt < event.currentTarget.duration - 3) event.currentTarget.currentTime = resumeAt;
                      }}
                      onTimeUpdate={(event) => {
                        const second = Math.floor(event.currentTarget.currentTime);
                        if (second <= furthestSecond.current + 12) furthestSecond.current = Math.max(furthestSecond.current, second);
                        if (second - lastSavedSecond.current >= 15) {
                          lastSavedSecond.current = second;
                          void saveProgress(second);
                        }
                      }}
                      onSeeking={(event) => {
                        if (event.currentTarget.currentTime > furthestSecond.current + 12) event.currentTarget.currentTime = furthestSecond.current;
                      }}
                      onRateChange={(event) => { if (event.currentTarget.playbackRate !== 1) event.currentTarget.playbackRate = 1; }}
                      onPause={(event) => void saveProgress(event.currentTarget.currentTime)}
                      onEnded={() => void completeLesson()}
                      onError={() => setVideoError("The secure video connection was interrupted.")}
                    />
                  ) : activeLesson.storageKey && videoLoading ? (
                    <div className="absolute inset-0 grid place-items-center text-center">
                      <div><LoaderCircle className="mx-auto size-7 animate-spin text-white/55" /><p className="mt-4 text-xs uppercase tracking-[0.18em] text-white/35">Securing video</p></div>
                    </div>
                  ) : activeLesson.storageKey && videoError ? (
                    <div className="absolute inset-0 grid place-items-center px-6 text-center">
                      <div><p className="text-sm text-white/70">{videoError}</p><button onClick={() => setPlaybackNonce((value) => value + 1)} className="mx-auto mt-5 flex items-center gap-2 border border-white/15 px-4 py-2 text-xs text-white/65 transition hover:border-white/35 hover:text-white"><RefreshCw className="size-3.5" />Try again</button></div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 grid place-items-center px-6 text-center">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(255,255,255,0.08),transparent_34%)]" />
                      <div className="relative">
                        <div className="mx-auto grid size-16 place-items-center rounded-full border border-white/15 bg-white/[0.04]"><Play className="ml-1 size-6 text-white/55" /></div>
                        <p className="mt-5 text-sm font-medium text-white/70">Video slot ready</p>
                        <p className="mt-1 text-xs text-white/30">The course video will appear here once uploaded.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-7 flex items-start gap-4">
                  <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">{activeLesson.label}</span>
                  <div className="h-8 w-px bg-white/10" />
                  <div>
                    <h2 className="text-xl font-medium text-white sm:text-2xl">{activeLesson.title}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">{activeLesson.description}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </section>

          <aside className="border-t border-white/[0.08] pt-6 xl:sticky xl:top-[96px] xl:max-h-[calc(100vh-124px)] xl:overflow-y-auto xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0">
            <div className="flex items-center justify-between">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">Course content</p><p className="mt-2 text-sm text-white/55">Complete lessons in order</p></div>
              <CirclePlay className="size-5 text-white/25" />
            </div>
            <div className="mt-6 space-y-7">
              {courseModules.map(([module, lessons]) => (
                <section key={module}>
                  <div className="flex items-center justify-between border-b border-white/[0.07] pb-2">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/35">{module}</p>
                    <span className="text-[9px] tabular-nums text-white/20">{lessons.filter(({ lesson }) => completedKeys.has(lesson.key)).length}/{lessons.length}</span>
                  </div>
                  <div className="divide-y divide-white/[0.06]">
                    {lessons.map(({ lesson, index }) => {
                      const unlocked = isCourseLessonUnlocked(index, completedKeys);
                      const complete = completedKeys.has(lesson.key);
                      const active = lesson.key === activeLesson.key;
                      return (
                        <button
                          key={lesson.key}
                          disabled={!unlocked || isLoading}
                          onClick={() => setActiveKey(lesson.key)}
                          className={`group flex w-full items-center gap-4 py-3.5 text-left transition ${unlocked ? "hover:text-white" : "cursor-not-allowed"}`}
                        >
                          <span className={`grid size-8 shrink-0 place-items-center rounded-full border text-[10px] font-semibold ${complete ? "border-white bg-white text-black" : active ? "border-white/45 bg-white/[0.08] text-white" : "border-white/10 text-white/25"}`}>
                            {complete ? <Check className="size-3.5" /> : unlocked ? String(index + 1).padStart(2, "0") : <LockKeyhole className="size-3" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={`block text-[9px] font-semibold uppercase tracking-[0.17em] ${active ? "text-white/45" : "text-white/23"}`}>{lesson.label}</span>
                            <span className={`mt-1 block truncate text-sm ${active ? "text-white" : unlocked ? "text-white/55" : "text-white/23"}`}>{lesson.title}</span>
                          </span>
                          {unlocked && <ChevronRight className={`size-4 transition ${active ? "translate-x-0 text-white/65" : "-translate-x-1 text-white/15 group-hover:translate-x-0 group-hover:text-white/45"}`} />}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 border-t border-white/[0.08] pt-5 text-[10px] uppercase tracking-[0.14em] text-white/25"><Clock3 className="size-3.5" />Progress saves while you watch</div>
          </aside>
        </div>
      </motion.div>
    </MemberLayout>
  );
}
