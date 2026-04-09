/**
 * Multi-scene video generator
 *
 * Unified pipeline supporting Kling 3.0 and Veo 3.1. Model passed as CLI arg.
 * STT speech gate + critic visual gate (min 8, no majors) + frame chaining + loudnorm + STS (final) + STT final + edit report
 *
 * Usage:
 *   bun run scripts/generate-multi-scene.ts <model> <character-dir> <scenes-json> <output-path>
 *
 * Models:
 *   kling3    — Kling 3.0 Pro (default)
 *   veo3      — Veo 3.1 Quality
 *   veo3fast  — Veo 3.1 Fast
 *
 * Example:
 *   bun run scripts/generate-multi-scene.ts kling3 characters/maya scenes.json output.mp4
 */

const KIE_API_KEY = process.env.KIE_API_KEY ?? Bun.env.KIE_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY ?? Bun.env.ELEVENLABS_API_KEY;
const KIE_BASE = "https://api.kie.ai/api/v1";

const VIDJUTSU_API_BASE = process.env.VIDJUTSU_API_BASE ?? Bun.env.VIDJUTSU_API_BASE ?? "https://api.vidjutsu.ai";
const VIDJUTSU_API_KEY = process.env.VIDJUTSU_API_KEY ?? Bun.env.VIDJUTSU_API_KEY;

const MAX_RETRIES = 5;
const SUPPORTED_MODELS = ["kling3", "veo3", "veo3fast"] as const;
type Model = typeof SUPPORTED_MODELS[number];

if (!KIE_API_KEY) { console.error("KIE_API_KEY not set."); process.exit(1); }
if (!ELEVENLABS_API_KEY) { console.error("ELEVENLABS_API_KEY not set."); process.exit(1); }
if (!VIDJUTSU_API_KEY) { console.error("VIDJUTSU_API_KEY not set."); process.exit(1); }

const modelArg = process.argv[2] as Model;
const charDir = process.argv[3];
const scenesPath = process.argv[4];
const outputPath = process.argv[5] ?? "output.mp4";

if (!modelArg || !SUPPORTED_MODELS.includes(modelArg) || !charDir || !scenesPath) {
  console.error(`Usage: bun run generate-multi-scene.ts <model> <character-dir> <scenes-json> <output-path>`);
  console.error(`Models: ${SUPPORTED_MODELS.join(", ")}`);
  process.exit(1);
}

const MODEL_LABELS: Record<Model, string> = {
  kling3: "Kling 3.0 Pro",
  veo3: "Veo 3.1 Quality",
  veo3fast: "Veo 3.1 Fast",
};

const character = await Bun.file(`${charDir}/character.json`).json();
const scenes = await Bun.file(scenesPath).json() as Array<{
  prompt: string;
  sceneImageUrl?: string;
  dialogue: string;
  prosody?: string;
}>;
const voiceId = character.voiceId;

if (!voiceId) { console.error("No voiceId in character.json."); process.exit(1); }

const tmpDir = `/tmp/vidjutsu-gen-${Date.now()}`;
await Bun.$`mkdir -p ${tmpDir}`;

const baseImageUrl = scenes[0]?.sceneImageUrl
  ?? "https://tempfile.aiquickdraw.com/images/1774969705412-0siipjq5kko.png";

console.log(`=== Multi-Scene Generator PIPELINE ===`);
console.log(`Character: ${character.name}`);
console.log(`Scenes: ${scenes.length}`);
console.log(`Model: ${MODEL_LABELS[modelArg]}`);
console.log(`Pipeline: ${MODEL_LABELS[modelArg]} → STT Gate → Critic Gate (≥8, no majors) → Concat → Loudnorm → STS → STT Final\n`);

// --- Video Generation ---

async function generateKling(prompt: string, imageUrls: string[]): Promise<string | null> {
  const res = await fetch(`${KIE_BASE}/jobs/createTask`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "kling-3.0/video",
      input: {
        prompt,
        image_urls: imageUrls,
        sound: true,
        duration: "10",
        aspect_ratio: "9:16",
        mode: "pro",
        multi_shots: false,
      },
    }),
  });
  const data = await res.json() as { code?: number; data?: { taskId: string }; msg?: string };
  if (!data.data?.taskId) { console.error(`  Kling error: ${JSON.stringify(data)}`); return null; }
  console.log(`  Task: ${data.data.taskId}`);

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 15000));
    const check = await fetch(`${KIE_BASE}/jobs/recordInfo?taskId=${data.data.taskId}`, {
      headers: { Authorization: `Bearer ${KIE_API_KEY}` },
    });
    const { data: d } = await check.json() as { data?: { state?: string; resultJson?: string; failMsg?: string } };
    if (!d) { process.stdout.write("?"); continue; }
    if (d.state === "success" && d.resultJson) {
      try { return JSON.parse(d.resultJson).resultUrls?.[0] ?? null; } catch { return null; }
    }
    if (d.state === "fail") { console.error(`\n  Kling failed: ${d.failMsg}`); return null; }
    process.stdout.write(".");
  }
  return null;
}

async function generateVeo(prompt: string, imageUrls: string[], quality: boolean): Promise<string | null> {
  const res = await fetch(`${KIE_BASE}/veo/generate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, imageUrls, model: quality ? "veo3" : "veo3_fast", aspectRatio: "9:16" }),
  });
  const data = await res.json() as { code: number; msg: string; data: { taskId: string } };
  if (data.code !== 200) { console.error(`  Veo error: ${data.msg}`); return null; }
  console.log(`  Task: ${data.data.taskId}`);

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 15000));
    const check = await fetch(`${KIE_BASE}/veo/record-info?taskId=${data.data.taskId}`, {
      headers: { Authorization: `Bearer ${KIE_API_KEY}` },
    });
    const { data: d } = await check.json() as {
      data: { successFlag: number; response?: { resultUrls?: string[] }; errorMessage?: string }
    };
    if (d.successFlag === 1) return d.response?.resultUrls?.[0] ?? null;
    if (d.successFlag >= 2) { console.error(`  Veo failed: ${d.errorMessage}`); return null; }
    process.stdout.write(".");
  }
  return null;
}

async function generate(prompt: string, imageUrls: string[]): Promise<string | null> {
  switch (modelArg) {
    case "kling3": return generateKling(prompt, imageUrls);
    case "veo3": return generateVeo(prompt, imageUrls, true);
    case "veo3fast": return generateVeo(prompt, imageUrls, false);
  }
}

// --- Helpers ---

async function uploadToCdn(filePath: string, contentType: string): Promise<string | null> {
  const buffer = await Bun.file(filePath).arrayBuffer();
  const res = await fetch(`${VIDJUTSU_API_BASE}/v1/upload`, {
    method: "POST",
    headers: { "X-Api-Key": VIDJUTSU_API_KEY, "Content-Type": contentType },
    body: buffer,
  });
  const data = await res.json() as { url?: string };
  return data.url ?? null;
}

// --- STT ---

interface SttResult {
  text: string;
  words: Array<{ text: string; start: number; end: number; type: string }>;
}

async function transcribe(audioPath: string): Promise<SttResult> {
  const form = new FormData();
  form.append("file", Bun.file(audioPath));
  form.append("model_id", "scribe_v1");
  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": ELEVENLABS_API_KEY! },
    body: form,
  });
  return await res.json() as SttResult;
}

const NUMBER_WORDS: Record<string, string> = {
  "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four",
  "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine",
  "10": "ten", "11": "eleven", "12": "twelve", "13": "thirteen",
  "14": "fourteen", "15": "fifteen", "20": "twenty", "30": "thirty",
};

function normalize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean).map(w => {
    if (NUMBER_WORDS[w]) return NUMBER_WORDS[w];
    return w;
  });
}

interface SpeechCheck { pass: boolean; transcript: string; issues: string[]; }

function checkSpeech(stt: SttResult, intended: string): SpeechCheck {
  const issues: string[] = [];
  const transcript = stt.text ?? "";

  const spokenWords = (stt.words ?? []).filter(w => w.type === "word");
  const lastWordEnd = spokenWords.length > 0 ? spokenWords[spokenWords.length - 1].end : 0;
  const firstWordStart = spokenWords.length > 0 ? spokenWords[0].start : 0;

  const audioEvents = (stt.words ?? []).filter(w =>
    w.type === "audio_event" && w.start >= firstWordStart - 0.2 && w.start <= lastWordEnd + 0.5
  );
  for (const e of audioEvents) issues.push(`AUDIO_EVENT at ${e.start.toFixed(1)}s: ${e.text}`);

  const peripheralNoise = (stt.words ?? []).filter(w =>
    w.type === "audio_event" && (w.start < firstWordStart - 0.2 || w.start > lastWordEnd + 0.5)
  );
  if (peripheralNoise.length > 0) console.log(`  [STT] Peripheral noise (non-blocking): ${peripheralNoise.map(e => `${e.text} at ${e.start.toFixed(1)}s`).join(", ")}`);

  const expected = normalize(intended);
  const got = normalize(transcript);

  if (got.length > expected.length * 1.3) issues.push(`REPEATED_WORDS: got ${got.length} words, expected ${expected.length}`);

  let ei = 0;
  for (const word of got) { if (ei < expected.length && word === expected[ei]) ei++; }
  if (ei < expected.length) issues.push(`MISSING_WORDS: [${expected.slice(ei).join(", ")}] from position ${ei}`);

  for (let len = 3; len <= Math.floor(got.length / 2); len++) {
    for (let start = 0; start <= got.length - len * 2; start++) {
      const chunk = got.slice(start, start + len).join(" ");
      if (chunk === got.slice(start + len, start + len * 2).join(" ") && chunk.length > 5) {
        issues.push(`REPEATED_PHRASE: "${chunk}" appears consecutively`);
        len = got.length; break;
      }
    }
  }

  return { pass: issues.length === 0, transcript, issues };
}

// --- Critic ---

interface CriticResult {
  overallScore: number;
  issues: Array<{ category: string; description: string; severity: string }>;
  verdict: string;
}

async function runCritic(mediaUrl: string, sceneNum: number): Promise<CriticResult> {
  const res = await fetch(`${VIDJUTSU_API_BASE}/v1/watch`, {
    method: "POST",
    headers: { "X-Api-Key": VIDJUTSU_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      mediaUrl,
      mode: "critic",
      mediaType: "video",
      context: `Single scene clip (scene ${sceneNum}) of an Instagram reel. AI-generated talking head. CHECK: 1) Face consistent and natural — no morphing, warping, drift? 2) Eyes steady on camera? 3) Natural speech cadence — not robotic or over-emphasized? Flag issues as CRITICAL or MAJOR.`,
    }),
  });
  return await res.json() as CriticResult;
}

// --- Main Pipeline ---

const passedClips: string[] = [];
const sceneReports: Array<{ scene: number; sttTranscript: string; criticScore: number; attempts: number }> = [];
let prevLastFrameUrl: string | null = null;

for (let i = 0; i < scenes.length; i++) {
  const scene = scenes[i];
  const num = String(i + 1).padStart(2, "0");
  console.log(`\n${"=".repeat(60)}`);
  console.log(`SCENE ${num}`);
  console.log(`${"=".repeat(60)}`);

  let passed = false;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`\n  Attempt ${attempt}/${MAX_RETRIES}`);

    const imageUrls: string[] = [scene.sceneImageUrl ?? baseImageUrl];
    if (i > 0 && prevLastFrameUrl) {
      imageUrls.unshift(prevLastFrameUrl);
      console.log(`  [GEN] Frame chain: using last frame from scene ${String(i).padStart(2, "0")} as start`);
    }
    console.log(`  [GEN] Generating via ${MODEL_LABELS[modelArg]}...`);
    const videoUrl = await generate(scene.prompt, imageUrls);
    if (!videoUrl) { console.log("  [GEN] Failed. Retrying..."); continue; }

    const rawPath = `${tmpDir}/scene-${num}-attempt-${attempt}.mp4`;
    const resp = await fetch(videoUrl);
    await Bun.write(rawPath, await resp.arrayBuffer());
    console.log("\n  [GEN] Video ready.");

    // STT Speech Gate
    console.log("  [STT] Transcribing...");
    const audioPath = `${tmpDir}/scene-${num}-attempt-${attempt}.wav`;
    await Bun.$`ffmpeg -i ${rawPath} -vn -acodec pcm_s16le -ar 16000 ${audioPath} -y 2>/dev/null`;

    const stt = await transcribe(audioPath);
    const speechCheck = checkSpeech(stt, scene.dialogue);
    console.log(`  [STT] Transcript: "${speechCheck.transcript}"`);

    if (!speechCheck.pass) {
      console.log(`  [STT] REJECTED — ${speechCheck.issues.length} issue(s):`);
      for (const issue of speechCheck.issues) console.log(`    ✗ ${issue}`);
      if (attempt < MAX_RETRIES) console.log(`  Regenerating...`);
      continue;
    }
    console.log(`  [STT] PASSED`);

    // Critic Visual Gate
    console.log("  [CRITIC] Uploading for visual QA...");
    const cdnUrl = await uploadToCdn(rawPath, "video/mp4");
    if (!cdnUrl) { console.log("  [CRITIC] Upload failed. Retrying..."); continue; }

    console.log("  [CRITIC] Running visual analysis...");
    const critic = await runCritic(cdnUrl, i + 1);
    console.log(`  [CRITIC] Score: ${critic.overallScore}/10 — ${critic.verdict}`);

    const blockingIssues = critic.issues.filter(i =>
      (i.severity === "major" || i.severity === "critical") && i.category !== "text_rendering"
    );
    const hasMajor = blockingIssues.length > 0;
    if (critic.overallScore < 8 || hasMajor) {
      const reasons: string[] = [];
      if (critic.overallScore < 8) reasons.push(`score ${critic.overallScore}/10 (min 8)`);
      if (hasMajor) reasons.push("has major/critical issues (excluding text_rendering)");
      console.log(`  [CRITIC] REJECTED — ${reasons.join(", ")}`);
      for (const issue of blockingIssues) {
        console.log(`    ✗ [${issue.severity}] ${issue.description.slice(0, 120)}`);
      }
      if (attempt < MAX_RETRIES) console.log(`  Regenerating...`);
      continue;
    }

    console.log(`  [QA] PASSED (STT clean + critic ${critic.overallScore}/10)`);
    if (critic.issues.length > 0) {
      for (const issue of critic.issues) console.log(`    - [${issue.severity}] ${issue.description.slice(0, 100)}`);
    }

    // Extract last frame for chaining
    if (i < scenes.length - 1) {
      console.log("  [CHAIN] Extracting last frame...");
      const lastFramePath = `${tmpDir}/scene-${num}-lastframe.png`;
      await Bun.$`ffmpeg -sseof -0.1 -i ${rawPath} -vframes 1 -q:v 1 ${lastFramePath} -y 2>/dev/null`;
      const frameUrl = await uploadToCdn(lastFramePath, "image/png");
      if (frameUrl) {
        prevLastFrameUrl = frameUrl;
        console.log("  [CHAIN] Last frame uploaded.");
      } else {
        console.log("  [CHAIN] Upload failed — next scene uses original image.");
        prevLastFrameUrl = null;
      }
    }

    passedClips.push(rawPath);
    sceneReports.push({ scene: i + 1, sttTranscript: speechCheck.transcript, criticScore: critic.overallScore, attempts: attempt });
    passed = true;
    break;
  }

  if (!passed) {
    console.error(`\n  ABORT: Scene ${num} failed ${MAX_RETRIES} attempts.`);
    await Bun.$`rm -rf ${tmpDir}`;
    process.exit(1);
  }
}

// --- Post-Production ---
console.log(`\n${"=".repeat(60)}`);
console.log(`POST-PRODUCTION`);
console.log(`${"=".repeat(60)}`);

console.log(`\n  [CONCAT] Joining ${passedClips.length} clips (hard cuts)...`);
const concatRawPath = `${tmpDir}/concat-raw.mp4`;
await Bun.write(`${tmpDir}/concat.txt`, passedClips.map(p => `file '${p}'`).join("\n"));
await Bun.$`ffmpeg -f concat -safe 0 -i ${tmpDir}/concat.txt -c copy ${concatRawPath} -y 2>/dev/null`;

console.log("  [LOUDNORM] Normalizing audio...");
const concatNormPath = `${tmpDir}/concat-norm.mp4`;
const measureOutput = await Bun.$`ffmpeg -i ${concatRawPath} -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1`.text();
const jsonMatch = measureOutput.match(/\{[\s\S]*?"input_i"[\s\S]*?\}/);
let loudnormFilter = "loudnorm=I=-16:TP=-1.5:LRA=11";
if (jsonMatch) {
  try {
    const m = JSON.parse(jsonMatch[0]);
    loudnormFilter = `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
    console.log(`  Measured: I=${m.input_i}, TP=${m.input_tp}, LRA=${m.input_lra}`);
  } catch { console.log("  Single-pass loudnorm."); }
}
await Bun.$`ffmpeg -i ${concatRawPath} -af ${loudnormFilter} -c:v copy -c:a aac -b:a 192k ${concatNormPath} -y 2>/dev/null`;

const preStsPath = outputPath.replace(".mp4", "-pre-sts.mp4");
await Bun.$`cp ${concatNormPath} ${preStsPath}`;
console.log(`  [SAVE] Pre-STS: ${preStsPath}`);

console.log("  [STS] Voice swap (single pass)...");
const fullAudioPath = `${tmpDir}/full-audio.wav`;
await Bun.$`ffmpeg -i ${concatNormPath} -vn -acodec pcm_s16le -ar 44100 ${fullAudioPath} -y 2>/dev/null`;

const stsForm = new FormData();
stsForm.append("audio", Bun.file(fullAudioPath));
stsForm.append("model_id", "eleven_english_sts_v2");

const stsRes = await fetch(`https://api.elevenlabs.io/v1/speech-to-speech/${voiceId}`, {
  method: "POST",
  headers: { "xi-api-key": ELEVENLABS_API_KEY! },
  body: stsForm,
});

if (!stsRes.ok) {
  console.error(`  [STS] Failed: ${await stsRes.text()}`);
  await Bun.$`cp ${concatNormPath} ${outputPath}`;
} else {
  const voicePath = `${tmpDir}/full-voice.mp3`;
  await Bun.write(voicePath, await stsRes.arrayBuffer());
  await Bun.$`ffmpeg -i ${concatNormPath} -i ${voicePath} -c:v copy -map 0:v:0 -map 1:a:0 -shortest ${outputPath} -y 2>/dev/null`;
  console.log("  [STS] Done.");
}

console.log("  [STT-FINAL] Transcribing final video...");
const finalAudioPath = `${tmpDir}/final-audio.wav`;
await Bun.$`ffmpeg -i ${outputPath} -vn -acodec pcm_s16le -ar 16000 ${finalAudioPath} -y 2>/dev/null`;
const finalStt = await transcribe(finalAudioPath);
const fullDialogue = scenes.map(s => s.dialogue).join(" ");
const finalCheck = checkSpeech(finalStt, fullDialogue);

console.log("  [UPLOAD] Uploading...");
const finalCdnUrl = await uploadToCdn(outputPath, "video/mp4");

const silenceOutput = await Bun.$`ffmpeg -i ${outputPath} -af silencedetect=noise=-30dB:d=0.5 -f null - 2>&1`.text();
const silenceMatches = [...silenceOutput.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/g)];

await Bun.$`rm -rf ${tmpDir}`;

// --- Report ---
const stat = await Bun.file(outputPath).stat();
const duration = await Bun.$`ffprobe -v quiet -show_entries format=duration -of csv=p=0 ${outputPath}`.text();

console.log(`\n${"=".repeat(60)}`);
console.log(`REPORT`);
console.log(`${"=".repeat(60)}`);
console.log(`\nOutput: ${outputPath}`);
console.log(`Pre-STS: ${preStsPath}`);
console.log(`CDN: ${finalCdnUrl ?? "upload failed"}`);
console.log(`Size: ${Math.round(stat.size / 1024)}KB`);
console.log(`Duration: ${parseFloat(duration).toFixed(1)}s`);
console.log(`Model: ${MODEL_LABELS[modelArg]}`);

console.log(`\n--- Per-Scene Results ---`);
for (const r of sceneReports) {
  console.log(`  Scene ${r.scene}: critic ${r.criticScore}/10, ${r.attempts} attempt(s)`);
  console.log(`    STT: "${r.sttTranscript}"`);
}

console.log(`\n--- Final STT ---`);
console.log(`  "${finalCheck.transcript}"`);
if (finalCheck.pass) { console.log(`  PASS`); }
else { for (const i of finalCheck.issues) console.log(`  ✗ ${i}`); }

console.log(`\n--- Audio Events ---`);
const events = (finalStt.words ?? []).filter((w: any) => w.type === "audio_event");
console.log(events.length === 0 ? "  None" : events.map((e: any) => `  ${e.start.toFixed(1)}s: ${e.text}`).join("\n"));

console.log(`\n--- Silence Gaps > 0.5s ---`);
if (silenceMatches.length === 0) { console.log("  None"); }
else { for (const m of silenceMatches) console.log(`  ${parseFloat(m[1]).toFixed(1)}s - ${parseFloat(m[2]).toFixed(1)}s (${parseFloat(m[3]).toFixed(1)}s)`); }

const totalDur = parseFloat(duration);
const edits: string[] = [];
const firstSilence = silenceMatches.find(m => parseFloat(m[1]) < 0.5);
if (firstSilence && parseFloat(firstSilence[3]) > 0.3) edits.push(`TRIM START: Cut first ${parseFloat(firstSilence[2]).toFixed(1)}s`);
const lastSilence = silenceMatches.find(m => parseFloat(m[2]) > totalDur - 0.5);
if (lastSilence && parseFloat(lastSilence[3]) > 0.3) edits.push(`TRIM END: Cut from ${parseFloat(lastSilence[1]).toFixed(1)}s`);
for (const m of silenceMatches) { const s = parseFloat(m[1]), d = parseFloat(m[3]); if (d > 1.0 && s > 1 && s < totalDur - 1) edits.push(`TRIM GAP at ${s.toFixed(1)}s: ${d.toFixed(1)}s → 0.3s`); }
if (!finalCheck.pass) for (const issue of finalCheck.issues) { if (issue.startsWith("AUDIO_EVENT")) edits.push(`AUDIO FIX: ${issue}`); }

console.log(`\n--- Edit Instructions ---`);
if (edits.length === 0) { console.log("  No edits needed."); }
else { edits.forEach((e, i) => console.log(`  ${i + 1}. ${e}`)); }

console.log(`\n${"=".repeat(60)}`);
console.log(`PIPELINE COMPLETE`);
console.log(`${"=".repeat(60)}`);
