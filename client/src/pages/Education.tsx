import { useMemo, useState } from "react";
import { Check, ChevronRight, CirclePlay, Clock3, Lock, Play, Video } from "lucide-react";
import { MemberLayout } from "@/components/member/MemberLayout";
import { useAuth } from "@/contexts/AuthContext";

type Lesson = { id: string; title: string; duration: string; videoUrl?: string; summary?: boolean };
type Chapter = { number: string; level: string; title: string; lessons: Lesson[] };

// Add each hosted course URL to videoUrl. Completion automatically unlocks the next lesson.
const chapters: Chapter[] = [
  { number: "01", level: "Beginner", title: "Market foundations", lessons: [
    { id: "b1", title: "What trading is", duration: "Lesson 01" },
    { id: "b2", title: "Understanding candlesticks", duration: "Lesson 02" },
    { id: "b3", title: "TradingView setup", duration: "Lesson 03" },
    { id: "b4", title: "MetaTrader 5 setup", duration: "Lesson 04" },
    { id: "b5", title: "Market fundamentals", duration: "Lesson 05" },
    { id: "b-summary", title: "Chapter 1 summary", duration: "Summary", summary: true },
  ]},
  { number: "02", level: "Intermediate", title: "Structure and context", lessons: [
    { id: "i1", title: "Market structure", duration: "Lesson 01" },
    { id: "i2", title: "Trend, range and transition", duration: "Lesson 02" },
    { id: "i3", title: "Supply and demand", duration: "Lesson 03" },
    { id: "i4", title: "Top down analysis", duration: "Lesson 04" },
    { id: "i5", title: "Risk management", duration: "Lesson 05" },
    { id: "i-summary", title: "Chapter 2 summary", duration: "Summary", summary: true },
  ]},
  { number: "03", level: "Advanced", title: "Liquidity and execution", lessons: [
    { id: "a1", title: "Liquidity concepts", duration: "Lesson 01" },
    { id: "a2", title: "Advanced chart work", duration: "Lesson 02" },
    { id: "a3", title: "Entry refinement", duration: "Lesson 03" },
    { id: "a4", title: "Trade management", duration: "Lesson 04" },
    { id: "a5", title: "Backtesting and review", duration: "Lesson 05" },
    { id: "a-summary", title: "Chapter 3 summary", duration: "Summary", summary: true },
  ]},
];

export default function EducationPage() {
  const { profile } = useAuth();
  const allLessons = useMemo(() => chapters.flatMap((chapter) => chapter.lessons), []);
  const storageKey = `ttc-course-progress-${profile?.id || "member"}`;
  const [completed, setCompleted] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { return []; }
  });
  const firstAvailable = allLessons[Math.min(completed.length, allLessons.length - 1)];
  const [selectedId, setSelectedId] = useState(firstAvailable?.id || allLessons[0].id);
  const selected = allLessons.find((lesson) => lesson.id === selectedId) || allLessons[0];
  const selectedIndex = allLessons.findIndex((lesson) => lesson.id === selected.id);
  const progress = Math.round((completed.length / allLessons.length) * 100);

  function isUnlocked(index: number) { return index === 0 || index <= completed.length; }
  function completeLesson(id: string) {
    if (completed.includes(id)) return;
    const next = [...completed, id];
    setCompleted(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    const nextLesson = allLessons[selectedIndex + 1];
    if (nextLesson) setSelectedId(nextLesson.id);
  }

  return <MemberLayout>
    <div className="flex flex-col justify-between gap-6 border-b border-white/[0.08] pb-8 sm:flex-row sm:items-end">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">Member education</p><h1 className="mt-3 font-sans text-3xl font-semibold normal-case tracking-[-0.04em] sm:text-4xl">The complete trading path.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/38">Work through each lesson in order. Finishing one video unlocks the next.</p></div>
      <div className="min-w-44"><div className="flex justify-between text-[10px] uppercase tracking-wider text-white/35"><span>Course progress</span><span>{progress}%</span></div><div className="mt-3 h-px bg-white/10"><div className="h-px bg-white transition-all duration-500" style={{ width: `${progress}%` }} /></div></div>
    </div>

    <div className="mt-9 grid gap-10 xl:grid-cols-[minmax(0,1.45fr)_420px]">
      <section>
        <div className="relative aspect-video overflow-hidden border border-white/[0.09] bg-[#070707]">
          {selected.videoUrl ? <video key={selected.id} src={selected.videoUrl} controls className="h-full w-full" onEnded={() => completeLesson(selected.id)} /> : <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_45%)]"><div className="text-center"><div className="mx-auto grid size-16 place-items-center rounded-full border border-white/15 bg-white/[0.03]"><Video className="size-6 text-white/35" /></div><p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Course media ready for upload</p><p className="mt-2 text-[11px] text-white/25">This lesson slot is prepared for the final video.</p></div></div>}
          <div className="absolute left-5 top-5 border border-white/10 bg-black/65 px-3 py-2 text-[9px] uppercase tracking-[0.2em] text-white/45 backdrop-blur">{selected.summary ? "Chapter summary" : selected.duration}</div>
        </div>
        <div className="mt-6 flex flex-col gap-5 border-b border-white/[0.08] pb-7 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] uppercase tracking-[0.2em] text-white/28">Now viewing</p><h2 className="mt-2 font-sans text-xl font-semibold normal-case tracking-normal">{selected.title}</h2></div>{selected.videoUrl && !completed.includes(selected.id) && <button onClick={() => completeLesson(selected.id)} className="flex h-10 items-center gap-2 border border-white/15 px-4 text-xs text-white/55 hover:border-white/40 hover:text-white">Mark complete <ChevronRight className="size-4" /></button>}</div>
        <div className="mt-8 grid gap-5 sm:grid-cols-3"><div className="border-t border-white/10 pt-4"><Clock3 className="size-4 text-white/35" /><p className="mt-3 text-xs text-white/55">One week per level</p></div><div className="border-t border-white/10 pt-4"><CirclePlay className="size-4 text-white/35" /><p className="mt-3 text-xs text-white/55">Sequential video access</p></div><div className="border-t border-white/10 pt-4"><Check className="size-4 text-white/35" /><p className="mt-3 text-xs text-white/55">Summary after every chapter</p></div></div>
      </section>

      <aside className="space-y-8 xl:border-l xl:border-white/[0.08] xl:pl-8">
        {chapters.map((chapter) => <section key={chapter.number}><div className="flex items-start gap-4"><span className="font-display text-3xl text-white/16">{chapter.number}</span><div><p className="text-[9px] uppercase tracking-[0.22em] text-white/30">{chapter.level}</p><h3 className="mt-1 font-sans text-sm font-semibold normal-case tracking-normal">{chapter.title}</h3></div></div><div className="mt-4 divide-y divide-white/[0.06] border-t border-white/[0.06]">
          {chapter.lessons.map((lesson) => { const index = allLessons.findIndex((item) => item.id === lesson.id); const unlocked = isUnlocked(index); const done = completed.includes(lesson.id); const active = selected.id === lesson.id; return <button key={lesson.id} disabled={!unlocked} onClick={() => setSelectedId(lesson.id)} className={`flex w-full items-center gap-3 px-2 py-3 text-left transition ${active ? "bg-white/[0.055]" : unlocked ? "hover:bg-white/[0.025]" : "opacity-35"}`}><span className={`grid size-7 shrink-0 place-items-center rounded-full border ${done ? "border-white bg-white text-black" : active ? "border-white/45 text-white" : "border-white/10 text-white/30"}`}>{done ? <Check className="size-3.5" /> : unlocked ? <Play className="ml-px size-3" /> : <Lock className="size-3" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs text-white/65">{lesson.title}</span><span className="mt-1 block text-[9px] uppercase tracking-wider text-white/23">{lesson.duration}</span></span></button>; })}
        </div></section>)}
      </aside>
    </div>
  </MemberLayout>;
}
