import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const sourceFolder = resolve(process.argv[2] || "/Users/enverjonkers/Movies/TheTradersCartel-Course-Encoded");
const startAt = process.argv[3] || "001";
const bucket = "thetraderscartel-course-videos";
const allFiles = readdirSync(sourceFolder).filter((name) => name.endsWith(".mp4") && !name.includes(".smaller.")).sort();
const files = allFiles.filter((name) => name.slice(0, 3) >= startAt);
const concurrency = 2;
let cursor = 0;
let completed = 0;

if (allFiles.length !== 67) throw new Error(`Expected 67 videos, found ${allFiles.length}. Upload stopped.`);

function uploadOnce(file) {
  return new Promise((resolveUpload, rejectUpload) => {
    const key = `course-v1/${basename(file)}`;
    const child = spawn("npx", [
      "wrangler", "r2", "object", "put", `${bucket}/${key}`,
      "--file", join(sourceFolder, file), "--content-type", "video/mp4",
      "--cache-control", "private, no-store", "--remote",
    ], { cwd: resolve("."), stdio: ["ignore", "pipe", "pipe"] });
    let errorOutput = "";
    child.stderr.on("data", (chunk) => { errorOutput += chunk.toString(); });
    child.on("error", rejectUpload);
    child.on("exit", (code) => {
      if (code !== 0) return rejectUpload(new Error(`${file}: ${errorOutput.trim() || `wrangler exited ${code}`}`));
      completed += 1;
      console.log(`[${completed}/${files.length}] Uploaded ${file}`);
      resolveUpload();
    });
  });
}

async function upload(file) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try { return await uploadOnce(file); } catch (error) {
      lastError = error;
      if (attempt === 4) break;
      console.log(`Retrying ${file} (${attempt}/4) after a temporary upload error.`);
      await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 3000));
    }
  }
  throw lastError;
}

async function worker() {
  while (cursor < files.length) {
    const file = files[cursor];
    cursor += 1;
    await upload(file);
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));
console.log(`Uploaded ${completed} private course videos.`);
