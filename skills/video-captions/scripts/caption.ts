/**
 * Video captions via ZapCap API
 *
 * Uploads a video, creates a captioning task, polls until complete, and downloads the result.
 * Supports custom templates and language selection.
 *
 * Usage:
 *   bun run scripts/caption.ts <input-url-or-path> <output-path> [options-json]
 *
 * Options JSON:
 *   {
 *     "templateId": "55267be2-...",   // ZapCap template ID
 *     "language": "en",               // language code (default: auto-detect)
 *     "pollInterval": 5000,           // poll interval ms (default: 5000)
 *     "maxWait": 300000               // max wait ms (default: 300000)
 *   }
 *
 * Example:
 *   ZAPCAP_API_KEY=xxx bun run scripts/caption.ts https://example.com/video.mp4 captioned.mp4
 *   ZAPCAP_API_KEY=xxx bun run scripts/caption.ts local.mp4 captioned.mp4 '{"language":"en"}'
 */

const ZAPCAP_BASE = "https://api.zapcap.ai";
const DEFAULT_TEMPLATE_ID = "55267be2-9eec-4d06-aff8-edcb401b112e";

const VIDJUTSU_API_BASE = process.env.VIDJUTSU_API_BASE ?? Bun.env.VIDJUTSU_API_BASE ?? "https://api.vidjutsu.ai";
const VIDJUTSU_API_KEY = process.env.VIDJUTSU_API_KEY ?? Bun.env.VIDJUTSU_API_KEY;

interface CaptionOptions {
  templateId?: string;
  language?: string;
  pollInterval?: number;
  maxWait?: number;
}

// --- ZapCap API ---

function getZapcapKey(): string {
  const key = process.env.ZAPCAP_API_KEY ?? Bun.env.ZAPCAP_API_KEY;
  if (!key) {
    console.error("ZAPCAP_API_KEY not set.");
    process.exit(1);
  }
  return key;
}

async function uploadVideoByUrl(apiKey: string, url: string): Promise<string> {
  const res = await fetch(`${ZAPCAP_BASE}/videos/url`, {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ZapCap upload failed: ${res.status} ${res.statusText} — ${text}`);
  }
  const data = (await res.json()) as { id?: string };
  if (!data.id) throw new Error("ZapCap upload did not return video id");
  return data.id;
}

async function createTask(
  apiKey: string,
  videoId: string,
  opts: CaptionOptions
): Promise<string> {
  const body: Record<string, unknown> = {
    templateId: opts.templateId ?? DEFAULT_TEMPLATE_ID,
    autoApprove: true,
  };
  if (opts.language) body.language = opts.language;

  const res = await fetch(`${ZAPCAP_BASE}/videos/${videoId}/task`, {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ZapCap createTask failed: ${res.status} ${res.statusText} — ${text}`);
  }
  const data = (await res.json()) as { taskId?: string };
  if (!data.taskId) throw new Error("ZapCap createTask did not return taskId");
  return data.taskId;
}

async function pollTaskStatus(
  apiKey: string,
  videoId: string,
  taskId: string,
  pollInterval: number,
  maxWait: number
): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    await new Promise((r) => setTimeout(r, pollInterval));
    const res = await fetch(`${ZAPCAP_BASE}/videos/${videoId}/task/${taskId}`, {
      headers: { "x-api-key": apiKey },
    });
    if (!res.ok) throw new Error(`ZapCap poll failed: ${res.status} ${res.statusText}`);

    const data = (await res.json()) as { status?: string; downloadUrl?: string; error?: string };
    if (data.error) throw new Error(`ZapCap task error: ${data.error}`);
    if (data.downloadUrl) return data.downloadUrl;

    process.stdout.write(".");
  }
  throw new Error(`ZapCap task timed out after ${maxWait / 1000}s (videoId: ${videoId}, taskId: ${taskId})`);
}

// --- CDN upload for local files ---

async function uploadToCdn(filePath: string): Promise<string> {
  if (!VIDJUTSU_API_KEY) {
    throw new Error("VIDJUTSU_API_KEY required to upload local files. Either provide a URL or set VIDJUTSU_API_KEY.");
  }
  const buffer = await Bun.file(filePath).arrayBuffer();
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${VIDJUTSU_API_KEY}`,
    "Content-Type": "video/mp4",
  };


  const res = await fetch(`${VIDJUTSU_API_BASE}/v1/upload`, {
    method: "POST",
    headers,
    body: buffer,
  });
  const data = (await res.json()) as { url?: string };
  if (!data.url) throw new Error("CDN upload did not return URL");
  return data.url;
}

// --- Main ---

const inputArg = process.argv[2];
const outputPath = process.argv[3];
const optionsArg = process.argv[4];

if (!inputArg || !outputPath) {
  console.error("Usage: bun run caption.ts <input-url-or-path> <output-path> [options-json]");
  process.exit(1);
}

const apiKey = getZapcapKey();

// Parse options
let options: CaptionOptions = {};
if (optionsArg) {
  try {
    const file = Bun.file(optionsArg);
    if (await file.exists()) {
      options = await file.json();
    } else {
      options = JSON.parse(optionsArg);
    }
  } catch {
    console.error("Failed to parse options JSON.");
    process.exit(1);
  }
}

const pollInterval = options.pollInterval ?? 5000;
const maxWait = options.maxWait ?? 300000;

// Determine if input is URL or local file
const isUrl = inputArg.startsWith("http://") || inputArg.startsWith("https://");
let videoUrl: string;

try {
  console.log(`=== Video Captions (ZapCap) ===`);
  console.log(`Input:    ${inputArg}`);
  console.log(`Output:   ${outputPath}`);
  console.log(`Language: ${options.language ?? "auto-detect"}`);
  console.log(`Template: ${options.templateId ?? "default"}\n`);

  // Step 1: Get a public URL
  if (isUrl) {
    videoUrl = inputArg;
  } else {
    if (!(await Bun.file(inputArg).exists())) {
      console.error(`Input file not found: ${inputArg}`);
      process.exit(1);
    }
    console.log("[CAPTIONS] Uploading local file to CDN...");
    videoUrl = await uploadToCdn(inputArg);
    console.log(`[CAPTIONS] CDN URL: ${videoUrl}`);
  }

  // Step 2: Upload to ZapCap
  console.log("[CAPTIONS] Uploading to ZapCap...");
  const zapcapVideoId = await uploadVideoByUrl(apiKey, videoUrl);
  console.log(`[CAPTIONS] Video ID: ${zapcapVideoId}`);

  // Step 3: Create captioning task
  console.log("[CAPTIONS] Creating captioning task...");
  const taskId = await createTask(apiKey, zapcapVideoId, options);
  console.log(`[CAPTIONS] Task ID: ${taskId}`);

  // Step 4: Poll until complete
  console.log("[CAPTIONS] Waiting for captions");
  const downloadUrl = await pollTaskStatus(apiKey, zapcapVideoId, taskId, pollInterval, maxWait);
  console.log(`\n[CAPTIONS] Download URL: ${downloadUrl}`);

  // Step 5: Download result
  console.log("[CAPTIONS] Downloading captioned video...");
  const response = await fetch(downloadUrl);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  await Bun.write(outputPath, response);

  console.log(`[CAPTIONS] Done: ${outputPath}`);
} catch (err) {
  console.error(`[CAPTIONS] Failed:`, err instanceof Error ? err.message : err);
  process.exit(1);
}
