import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, relative, resolve, sep } from "node:path";

const sourceRoot = resolve(process.argv[2] || "/Volumes/ADATA UFD");
const outputRoot = resolve(process.argv[3] || "/Users/enverjonkers/Movies/TheTradersCartel-Course-Encoded");
const shouldEncode = process.argv.includes("--encode");
const targetBytes = 8_000_000_000;
const videoExtensions = new Set([".mp4", ".mov", ".m4v"]);
const ignoredDirectories = new Set([".Spotlight-V100", ".fseventsd", ".Trashes", "LOST.DIR", "Android", "System Volume Information"]);
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

if (!existsSync(sourceRoot)) throw new Error(`Course drive not found: ${sourceRoot}`);

function walk(folder) {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(folder, entry.name);
    if (entry.isDirectory()) return ignoredDirectories.has(entry.name) ? [] : walk(fullPath);
    return entry.isFile() && !entry.name.startsWith("._") && videoExtensions.has(extname(entry.name).toLowerCase()) ? [fullPath] : [];
  });
}

function cleanWords(value, stripExtension = true) {
  const withoutExtension = stripExtension ? value.slice(0, value.length - extname(value).length) : value;
  return withoutExtension
    .replace(/^\d+[.)_-]?\s*/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\bEnty\b/gi, "Entry")
    .replace(/\bFibonachi\b/gi, "Fibonacci")
    .replace(/\bDIfferent\b/g, "Different")
    .replace(/\bTradingview\b/gi, "TradingView")
    .replace(/\bMetatrader\b/gi, "MetaTrader")
    .replace(/\bAgaisnt\b/gi, "Against")
    .trim();
}

function moduleName(file) {
  const parts = relative(sourceRoot, file).split(sep);
  return parts.length === 1 ? "Practical Analysis" : cleanWords(parts[0], false);
}

function lessonTitle(file, module) {
  const title = cleanWords(basename(file));
  if (title) return title;
  const rawName = basename(file).slice(0, basename(file).length - extname(file).length).trim();
  if (/^\d+$/.test(rawName)) return `${module.replace(/s$/, "")} ${rawName}`;
  return "Untitled Lesson";
}

function slug(value) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
}

function duration(file) {
  return Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file], { encoding: "utf8" }).trim());
}

function outputComplete(lesson) {
  if (!existsSync(lesson.output) || statSync(lesson.output).size <= 1024 * 1024) return false;
  try { return duration(lesson.output) >= lesson.duration - 1; } catch { return false; }
}

const files = walk(sourceRoot).sort((a, b) => collator.compare(relative(sourceRoot, a), relative(sourceRoot, b)));
if (!files.length) throw new Error(`No course videos found in ${sourceRoot}`);
const lessons = files.map((file, index) => {
  const module = moduleName(file);
  return { source: file, sourceBytes: statSync(file).size, duration: duration(file), module, title: lessonTitle(file, module), index };
});
const totalSeconds = lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
const sourceBytes = lessons.reduce((sum, lesson) => sum + lesson.sourceBytes, 0);
const audioKbps = 80;
const videoKbps = 900;

for (const lesson of lessons) {
  lesson.estimatedCompressedBytes = Math.ceil(lesson.duration * (videoKbps + audioKbps) * 1000 / 8 * 1.03);
  lesson.estimatedSavings = Math.max(0, lesson.sourceBytes - lesson.estimatedCompressedBytes);
  lesson.transcode = false;
}

const moduleOrder = [
  "Introduction", "Candles", "Market Structure", "Fair Value Gaps", "Trendlines & Fibonacci Levels",
  "Key Levels & Psychological Round Numbers", "Supply & Demand", "Price Cycle", "Liquidity", "Entry Models",
  "Strategy Creation", "Setting Yourself Up For Success", "Risk Management", "Psychology", "Fundamentals Course",
  "Practical Analysis",
];
const orderedLessons = [...lessons].sort((a, b) => {
  const moduleDifference = moduleOrder.indexOf(a.module) - moduleOrder.indexOf(b.module);
  return moduleDifference || collator.compare(a.source, b.source);
});
let projectedBytes = sourceBytes;
for (const lesson of [...lessons].sort((a, b) => b.estimatedSavings - a.estimatedSavings)) {
  if (projectedBytes <= targetBytes) break;
  if (!lesson.estimatedSavings) continue;
  lesson.transcode = true;
  projectedBytes -= lesson.estimatedSavings;
}
if (projectedBytes > targetBytes) throw new Error("The course cannot fit below the storage ceiling with the current quality settings.");

for (const lesson of lessons) {
  const ordinal = String(lesson.index + 1).padStart(3, "0");
  lesson.key = `${ordinal}-${slug(lesson.module)}-${slug(lesson.title)}`;
  lesson.storageKey = `course-v1/${ordinal}-${slug(lesson.title)}.mp4`;
  lesson.output = join(outputRoot, `${ordinal}-${slug(lesson.title)}.mp4`);
}

console.log(`Found ${lessons.length} videos (${(totalSeconds / 3600).toFixed(2)} hours).`);
console.log(`Original library: ${(sourceBytes / 1e9).toFixed(3)} GB. Compressing ${lessons.filter((lesson) => lesson.transcode).length} high-bitrate videos; remuxing the rest without quality loss.`);
console.log(`Projected library: ${(projectedBytes / 1e9).toFixed(3)} GB; hard upload stop: 8.5 GB.`);

if (shouldEncode) {
  mkdirSync(outputRoot, { recursive: true });
  for (const lesson of lessons) {
    if (outputComplete(lesson)) {
      console.log(`Skip existing ${basename(lesson.output)}`);
      continue;
    }
    console.log(`[${lesson.index + 1}/${lessons.length}] ${lesson.module} / ${lesson.title}`);
    const inputArgs = ["-hide_banner", "-loglevel", "error", "-i", lesson.source, "-map", "0:v:0", "-map", "0:a:0?"];
    if (!lesson.transcode) {
      const result = spawnSync("ffmpeg", [...inputArgs, "-c", "copy", "-movflags", "+faststart", "-y", lesson.output], { stdio: "inherit" });
      if (result.status !== 0) throw new Error(`Remux failed: ${lesson.source}`);
      continue;
    }
    const outputArgs = [
      "-b:v", `${videoKbps}k`, "-maxrate", `${Math.round(videoKbps * 1.25)}k`, "-bufsize", `${videoKbps * 2}k`,
      "-c:a", "aac", "-b:a", `${audioKbps}k`, "-ac", "2", "-movflags", "+faststart", "-y", lesson.output,
    ];
    const hardwareInput = ["-hide_banner", "-loglevel", "error", "-init_hw_device", "videotoolbox=vt", "-filter_hw_device", "vt", "-i", lesson.source, "-map", "0:v:0", "-map", "0:a:0?"];
    let result = spawnSync("ffmpeg", [...hardwareInput, "-vf", "fps=30,format=nv12,hwupload,scale_vt=w='min(1280,iw)':h=-2", "-c:v", "h264_videotoolbox", ...outputArgs], { stdio: "inherit" });
    if (result.status !== 0) {
      console.log("Hardware encoder unavailable; retrying with the software encoder.");
      result = spawnSync("ffmpeg", [...inputArgs, "-vf", "fps=30,scale=w='min(1280,iw)':h=-2:force_original_aspect_ratio=decrease", "-c:v", "libx264", "-preset", "fast", ...outputArgs], { stdio: "inherit" });
    }
    if (result.status !== 0) throw new Error(`Encoding failed: ${lesson.source}`);
  }
  const encodedBytes = lessons.reduce((sum, lesson) => sum + statSync(lesson.output).size, 0);
  console.log(`Encoded library: ${(encodedBytes / 1e9).toFixed(3)} GB.`);
  if (encodedBytes > 8_500_000_000) throw new Error("Encoded library exceeds the 8.5 GB safety limit. Nothing was uploaded.");
}

const clientManifest = `import type { CourseLesson } from "@/lib/course";\n\nexport const generatedCourseLessons: CourseLesson[] = ${JSON.stringify(orderedLessons.map((lesson, index) => ({
  key: lesson.key,
  label: index === 0 ? "Start here" : `Lesson ${String(index + 1).padStart(2, "0")}`,
  title: lesson.title,
  description: `${lesson.module} lesson. Watch to the end to unlock the next video.`,
  module: lesson.module,
  storageKey: lesson.storageKey,
})), null, 2)};\n`;

const workerLessons = Object.fromEntries(orderedLessons.map((lesson, index) => [lesson.key, {
  storageKey: lesson.storageKey,
  previousKey: index === 0 ? null : orderedLessons[index - 1].key,
}]));
const workerManifest = `// Generated from the course drive. Do not edit manually.\nexport const LESSONS = ${JSON.stringify(workerLessons, null, 2)};\n`;

writeFileSync(resolve("client/src/lib/course-manifest.generated.ts"), clientManifest);
writeFileSync(resolve("cloudflare/course-video-worker/src/course-manifest.js"), workerManifest);
console.log("Course manifests generated.");
