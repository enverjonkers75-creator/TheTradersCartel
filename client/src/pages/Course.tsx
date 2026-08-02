import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CirclePlay,
  Clock3,
  LoaderCircle,
  LockKeyhole,
  Play,
  RefreshCw,
} from "lucide-react";
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
  const [openModule, setOpenModule] = useState(courseLessons[0].module);
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
  const completedKeys = useMemo(() => {
    const lessonKeys = new Set(courseLessons.map((lesson) => lesson.key));
    return new Set(
      progress
        .filter((item) => item.completed_at && lessonKeys.has(item.lesson_key))
        .map((item) => item.lesson_key),
    );
  }, [progress]);
  const activeIndex = courseLessons.findIndex((lesson) => lesson.key === activeKey);
  const activeLesson = courseLessons[Math.max(0, activeIndex)];
  const { completedCount, percentage: completion } = getCourseCompletion(completedKeys);
  const courseModules = useMemo(() => {
    const groups = new Map<string, Array<{ lesson: typeof courseLessons[number]; index: number }>>();
    courseLessons.forEach((lesson, index) => {
      groups.set(lesson.module, [...(groups.get(lesson.module) || []), { lesson, index }]);
    });
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

  function selectLesson(key: string, module: string) {
    setActiveKey(key);
    setOpenModule(module);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function completeLesson() {
    const duration = videoRef.current?.duration || 0;
    await saveProgress(duration, true);
    const next = courseLessons[activeIndex + 1];
    if (next) {
      selectLesson(next.key, next.module);
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

  const previousLesson = activeIndex > 0 ? courseLessons[activeIndex - 1] : null;
  const nextLesson = courseLessons[activeIndex + 1] ?? null;
  const nextUnlocked = nextLesson ? isCourseLessonUnlocked(activeIndex + 1, completedKeys) : false;

  return (
    <MemberLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="pb-8"
      >
        <div className="mb-6 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/28">
          <span>Lessons</span>
          <span className="text-white/12">/</span>
          <span className="text-white/55">The Traders Cartel Course</span>
        </div>

        <div className="mb-7 flex flex-col gap-5 border-b border-white/[0.08] pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/30">Private member education</p>
            <h1 className="mt-2 font-display text-3xl font-semibold uppercase tracking-[-0.02em] text-white sm:text-4xl">
              The Traders Cartel Course
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.13em] text-white/55">{courseLessons.length} lessons</span>
              <span className="border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.13em] text-white/55">All levels</span>
              <span className="border border-white/20 bg-white/[0.09] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.13em] text-white/75">Member access</span>
            </div>
          </div>

          <div className="w-full max-w-[290px]">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] uppercase tracking-[0.18em] text-white/28">Your progress</p>
                <p className="mt-1 text-sm text-white/55">{completedCount} of {courseLessons.length} complete</p>
              </div>
              <span className="font-display text-3xl font-semibold text-white">{completion}%</span>
            </div>
            <div className="mt-3 h-1 overflow-hidden bg-white/[0.08]">
              <motion.div className="h-full bg-white" animate={{ width: `${completion}%` }} transition={{ duration: 0.45 }} />
            </div>
          </div>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_370px]">
          <section className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeLesson.key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22 }}
              >
                <div className="relative aspect-video overflow-hidden border border-white/[0.09] bg-black shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
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
                        if (resumeAt > 0 && resumeAt < event.currentTarget.duration - 3) {
                          event.currentTarget.currentTime = resumeAt;
                        }
                      }}
                      onTimeUpdate={(event) => {
                        const second = Math.floor(event.currentTarget.currentTime);
                        if (second <= furthestSecond.current + 12) {
                          furthestSecond.current = Math.max(furthestSecond.current, second);
                        }
                        if (second - lastSavedSecond.current >= 15) {
                          lastSavedSecond.current = second;
                          void saveProgress(second);
                        }
                      }}
                      onSeeking={(event) => {
                        if (event.currentTarget.currentTime > furthestSecond.current + 12) {
                          event.currentTarget.currentTime = furthestSecond.current;
                        }
                      }}
                      onRateChange={(event) => {
                        if (event.currentTarget.playbackRate !== 1) event.currentTarget.playbackRate = 1;
                      }}
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

                <div className="border-x border-b border-white/[0.08] bg-[#0a0a0a] px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/30">{activeLesson.module} · {activeLesson.label}</p>
                      <h2 className="mt-2 text-xl font-medium normal-case tracking-normal text-white sm:text-2xl">{activeLesson.title}</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/38">{activeLesson.description}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        disabled={!previousLesson}
                        onClick={() => previousLesson && selectLesson(previousLesson.key, previousLesson.module)}
                        aria-label="Previous lesson"
                        className="grid size-10 place-items-center border border-white/10 text-white/45 transition hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                      ><ArrowLeft className="size-4" /></button>
                      <button
                        disabled={!nextLesson || !nextUnlocked}
                        onClick={() => nextLesson && nextUnlocked && selectLesson(nextLesson.key, nextLesson.module)}
                        className="flex h-10 items-center gap-2 border border-white/15 bg-white/[0.06] px-4 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/65 transition hover:bg-white/[0.11] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                      >Next <ArrowRight className="size-3.5" /></button>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center gap-2 border-t border-white/[0.06] pt-4 text-[9px] uppercase tracking-[0.14em] text-white/25">
                    <Clock3 className="size-3.5" />Your place saves automatically while you watch
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </section>

          <aside className="overflow-hidden border border-white/[0.09] bg-[#090909] xl:sticky xl:top-[88px]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">Course content</p>
                <p className="mt-1 text-[10px] text-white/28">Watch each lesson to unlock the next</p>
              </div>
              <CirclePlay className="size-5 text-white/25" />
            </div>

            <div className="max-h-[680px] overflow-y-auto overscroll-contain">
              {courseModules.map(([module, lessons], moduleIndex) => {
                const moduleComplete = lessons.filter(({ lesson }) => completedKeys.has(lesson.key)).length;
                const expanded = openModule === module;
                const containsActive = lessons.some(({ lesson }) => lesson.key === activeLesson.key);
                return (
                  <section key={module} className="border-b border-white/[0.07] last:border-b-0">
                    <button
                      onClick={() => setOpenModule(expanded ? "" : module)}
                      className={`flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-white/[0.035] ${containsActive ? "bg-white/[0.035]" : ""}`}
                    >
                      <span className={`grid size-7 shrink-0 place-items-center border text-[9px] font-semibold ${moduleComplete === lessons.length ? "border-white bg-white text-black" : "border-white/10 text-white/30"}`}>
                        {moduleComplete === lessons.length ? <Check className="size-3.5" /> : String(moduleIndex + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium text-white/70">{module}</span>
                        <span className="mt-1 block text-[9px] uppercase tracking-[0.12em] text-white/23">{moduleComplete} of {lessons.length} complete</span>
                      </span>
                      <ChevronDown className={`size-4 text-white/25 transition-transform ${expanded ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden bg-black/35"
                        >
                          <div className="divide-y divide-white/[0.055] border-t border-white/[0.06]">
                            {lessons.map(({ lesson, index }) => {
                              const unlocked = isCourseLessonUnlocked(index, completedKeys);
                              const complete = completedKeys.has(lesson.key);
                              const active = lesson.key === activeLesson.key;
                              return (
                                <button
                                  key={lesson.key}
                                  disabled={!unlocked || isLoading}
                                  onClick={() => selectLesson(lesson.key, lesson.module)}
                                  className={`group flex w-full items-center gap-3 px-4 py-3 text-left transition ${active ? "bg-white/[0.09]" : unlocked ? "hover:bg-white/[0.045]" : "cursor-not-allowed"}`}
                                >
                                  <span className={`grid size-6 shrink-0 place-items-center rounded-full border text-[8px] font-semibold ${complete ? "border-white bg-white text-black" : active ? "border-white/50 text-white" : "border-white/10 text-white/22"}`}>
                                    {complete ? <Check className="size-3" /> : unlocked ? String(index + 1).padStart(2, "0") : <LockKeyhole className="size-2.5" />}
                                  </span>
                                  <span className={`min-w-0 flex-1 truncate text-[11px] ${active ? "text-white" : unlocked ? "text-white/52" : "text-white/20"}`}>{lesson.title}</span>
                                  {active && <span className="size-1.5 shrink-0 rounded-full bg-white" />}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                );
              })}
            </div>
          </aside>
        </div>
      </motion.div>
    </MemberLayout>
  );
}
