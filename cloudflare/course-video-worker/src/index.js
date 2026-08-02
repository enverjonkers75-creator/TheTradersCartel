import { LESSONS } from "./course-manifest.js";

const encoder = new TextEncoder();
const TICKET_LIFETIME_SECONDS = 4 * 60 * 60;

function allowedOrigin(origin) {
  if (!origin) return true;
  if (origin === "https://thetraderscartel.co.za" || origin === "https://www.thetraderscartel.co.za") return true;
  if (/^https:\/\/traderscartel-[a-z0-9-]+-envers-projects-0e4b029d\.vercel\.app$/.test(origin)) return true;
  return /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin);
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin && allowedOrigin(origin) ? origin : "https://thetraderscartel.co.za",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function toBase64Url(value) {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function createTicket(payload, secret) {
  const encoded = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(encoded));
  return `${encoded}.${toBase64Url(new Uint8Array(signature))}`;
}

async function readTicket(ticket, secret) {
  const [encoded, signature] = ticket.split(".");
  if (!encoded || !signature) return null;
  const valid = await crypto.subtle.verify("HMAC", await hmacKey(secret), fromBase64Url(signature), encoder.encode(encoded));
  if (!valid) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded)));
    return payload.e > Math.floor(Date.now() / 1000) ? payload : null;
  } catch {
    return null;
  }
}

async function fingerprint(request) {
  const address = request.headers.get("CF-Connecting-IP") || "local";
  const agent = request.headers.get("User-Agent") || "unknown";
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`${address}|${agent}`));
  return toBase64Url(new Uint8Array(digest)).slice(0, 24);
}

async function getActiveUser(request, env) {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const headers = { apikey: env.SUPABASE_ANON_KEY, Authorization: authorization };
  const userResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, { headers });
  if (!userResponse.ok) return null;
  const user = await userResponse.json();
  const profileResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?select=status&id=eq.${encodeURIComponent(user.id)}&limit=1`, { headers });
  if (!profileResponse.ok) return null;
  const profiles = await profileResponse.json();
  return profiles[0]?.status === "active" ? user : null;
}

async function hasCompletedPreviousLesson(userId, previousKey, authorization, env) {
  if (!previousKey) return true;
  const headers = { apikey: env.SUPABASE_ANON_KEY, Authorization: authorization };
  const params = new URLSearchParams({
    select: "completed_at",
    user_id: `eq.${userId}`,
    lesson_key: `eq.${previousKey}`,
    completed_at: "not.is.null",
    limit: "1",
  });
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/course_lesson_progress?${params}`, { headers });
  if (!response.ok) return false;
  const progress = await response.json();
  return progress.length === 1;
}

function parseRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header || "");
  if (!match) return null;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    const length = Math.min(suffix, size);
    return { offset: size - length, length };
  }
  const offset = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isFinite(offset) || !Number.isFinite(requestedEnd) || offset < 0 || offset >= size || requestedEnd < offset) return null;
  const end = Math.min(requestedEnd, size - 1);
  return { offset, length: end - offset + 1 };
}

async function issueTicket(request, env, origin) {
  const user = await getActiveUser(request, env);
  if (!user) return json({ error: "Active membership required" }, 401, origin);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid request" }, 400, origin); }
  const lesson = LESSONS[body.lessonKey];
  if (!lesson) return json({ error: "Lesson video unavailable" }, 404, origin);
  const authorization = request.headers.get("Authorization");
  if (!(await hasCompletedPreviousLesson(user.id, lesson.previousKey, authorization, env))) {
    return json({ error: "Complete the previous lesson first" }, 403, origin);
  }
  const expiry = Math.floor(Date.now() / 1000) + TICKET_LIFETIME_SECONDS;
  const ticket = await createTicket({ k: lesson.storageKey, u: user.id, e: expiry, f: await fingerprint(request) }, env.PLAYBACK_SECRET);
  return json({ url: `${new URL(request.url).origin}/video?ticket=${encodeURIComponent(ticket)}`, expiresAt: new Date(expiry * 1000).toISOString() }, 200, origin);
}

async function streamVideo(request, env, origin) {
  const ticket = new URL(request.url).searchParams.get("ticket");
  const payload = ticket ? await readTicket(ticket, env.PLAYBACK_SECRET) : null;
  if (!payload || payload.f !== await fingerprint(request)) return json({ error: "Playback link expired" }, 401, origin);
  if (!Object.values(LESSONS).some((lesson) => lesson.storageKey === payload.k)) return json({ error: "Video unavailable" }, 404, origin);
  const metadata = await env.COURSE_VIDEOS.head(payload.k);
  if (!metadata) return json({ error: "Video unavailable" }, 404, origin);
  const responseHeaders = new Headers(corsHeaders(origin));
  responseHeaders.set("Accept-Ranges", "bytes");
  responseHeaders.set("Cache-Control", "private, no-store, max-age=0");
  responseHeaders.set("Content-Disposition", "inline");
  responseHeaders.set("Content-Type", metadata.httpMetadata?.contentType || "video/mp4");
  responseHeaders.set("X-Content-Type-Options", "nosniff");
  const rangeHeader = request.headers.get("Range");
  if (rangeHeader) {
    const range = parseRange(rangeHeader, metadata.size);
    if (!range) {
      responseHeaders.set("Content-Range", `bytes */${metadata.size}`);
      return new Response(null, { status: 416, headers: responseHeaders });
    }
    const object = await env.COURSE_VIDEOS.get(payload.k, { range });
    if (!object?.body) return json({ error: "Video unavailable" }, 404, origin);
    responseHeaders.set("Content-Length", String(range.length));
    responseHeaders.set("Content-Range", `bytes ${range.offset}-${range.offset + range.length - 1}/${metadata.size}`);
    return new Response(request.method === "HEAD" ? null : object.body, { status: 206, headers: responseHeaders });
  }
  const object = await env.COURSE_VIDEOS.get(payload.k);
  if (!object?.body) return json({ error: "Video unavailable" }, 404, origin);
  responseHeaders.set("Content-Length", String(metadata.size));
  return new Response(request.method === "HEAD" ? null : object.body, { status: 200, headers: responseHeaders });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    if (origin && !allowedOrigin(origin)) return json({ error: "Origin not allowed" }, 403, origin);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      const listed = await env.COURSE_VIDEOS.list({ prefix: "course-v1/" });
      const storedBytes = listed.objects.reduce((sum, object) => sum + object.size, 0);
      return json({ ok: true, lessons: Object.keys(LESSONS).length, storedObjects: listed.objects.length, storedBytes }, 200, origin);
    }
    if (url.pathname === "/ticket" && request.method === "POST") return issueTicket(request, env, origin);
    if (url.pathname === "/video" && (request.method === "GET" || request.method === "HEAD")) return streamVideo(request, env, origin);
    return json({ error: "Not found" }, 404, origin);
  },
};
