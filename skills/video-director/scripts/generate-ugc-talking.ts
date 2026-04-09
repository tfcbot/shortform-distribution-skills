/**
 * UGC Talking Head video generator
 *
 * Generates realistic "selfie-style" talking head clips using Kling 3.0 Pro
 * with native audio lip sync. Designed for the "this isn't real" format.
 *
 * Pipeline: Start Image Gen → Kling 3.0 Pro (sound=true) → Anatomy Gate → Critic → Resize → Final
 *
 * Key differences from generate-lofi-b-roll.ts:
 *   - sound=true — Kling generates native lip-synced audio
 *   - No overlay text — raw clip for later composition
 *   - No music — clean audio only
 *   - UGC aesthetic — iPhone selfie angle, casual, not editorial
 *   - Uses kling_elements for face consistency with reference images
 *
 * Usage:
 *   bun run scripts/generate-ugc-talking.ts <character-dir> <scenes-json> <output-path>
 *
 * scenes.json format:
 *   {
 *     "scenes": [
 *       {
 *         "prompt": "Young woman talking to camera in a cafe, iPhone selfie angle...",
 *         "startPrompt": "...",
 *         "duration": 5
 *       }
 *     ]
 *   }
 */

const KIE_API_KEY = process.env.KIE_API_KEY ?? Bun.env.KIE_API_KEY;
const KIE_BASE = "https://api.kie.ai/api/v1";

const VIDJUTSU_API_BASE = process.env.VIDJUTSU_API_BASE ?? Bun.env.VIDJUTSU_API_BASE ?? "https://api.vidjutsu.ai";
const VIDJUTSU_API_KEY = process.env.VIDJUTSU_API_KEY ?? Bun.env.VIDJUTSU_API_KEY;

const MAX_RETRIES = 5;

if (!KIE_API_KEY) { console.error("KIE_API_KEY not set."); process.exit(1); }
if (!VIDJUTSU_API_KEY) { console.error("VIDJUTSU_API_KEY not set."); process.exit(1); }

const charDir = process.argv[2];
const scenesPath = process.argv[3];
const outputPath = process.argv[4] ?? "output.mp4";

if (!charDir || !scenesPath) {
  console.error("Usage: bun run generate-ugc-talking.ts <character-dir> <scenes-json> <output-path>");
  process.exit(1);
}

interface UGCScene {
  prompt: string;
  startPrompt?: string;
  duration?: number; // 3-15 seconds, default 5
  sceneImageUrl?: string;
}

interface UGCSpec {
  scenes: UGCScene[];
}

const character = await Bun.file(`${charDir}/character.json`).json();
const spec = (await Bun.file(scenesPath).json()) as UGCSpec;
const scenes = spec.scenes;
const promptBase: string = character.promptBase ?? "";

const refUrl = character.referenceSheet?.url;
if (!refUrl) { console.error("No referenceSheet.url in character.json."); process.exit(1); }

const tmpDir = `/tmp/vidjutsu-ugc-${Date.now()}`;
await Bun.$`mkdir -p ${tmpDir}`;

console.log(`=== UGC Talking Head Generator ===`);
console.log(`Character: ${character.name}`);
console.log(`Scenes: ${scenes.length}`);
console.log(`Pipeline: Start Image → Kling 3.0 Pro (sound=true, lip sync) → Anatomy Gate → Critic → Resize → Final\n`);

// --- Helpers ---

async function uploadToCdn(filePath: string, contentType: string): Promise<string | null> {
  const buffer = await Bun.file(filePath).arrayBuffer();
  const res = await fetch(`${VIDJUTSU_API_BASE}/v1/upload`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${VIDJUTSU_API_KEY}`, "Content-Type": contentType },
    body: buffer,
  });
  const data = (await res.json()) as { url?: string };
  return data.url ?? null;
}

// --- Image Generation (nano-banana-2) ---

async function generateSceneImage(prompt: string): Promise<string | null> {
  for (let retry = 0; retry < 3; retry++) {
    if (retry > 0) console.log(`  Retry ${retry + 1}/3...`);
    const res = await fetch(`${KIE_BASE}/jobs/createTask`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "nano-banana-2",
        input: {
          prompt,
          image_input: [refUrl],
          aspect_ratio: "9:16",
          resolution: "2K",
          output_format: "png",
        },
      }),
    });
    const data = (await res.json()) as { data?: { taskId: string } };
    if (!data.data?.taskId) { console.error(`  Image gen error: ${JSON.stringify(data)}`); continue; }
    console.log(`  Task: ${data.data.taskId}`);

    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const check = await fetch(`${KIE_BASE}/jobs/recordInfo?taskId=${data.data.taskId}`, {
        headers: { Authorization: `Bearer ${KIE_API_KEY}` },
      });
      const { data: d } = (await check.json()) as { data?: { state?: string; resultJson?: string; failMsg?: string } };
      if (!d) { process.stdout.write("?"); continue; }
      if (d.state === "success" && d.resultJson) {
        try { return JSON.parse(d.resultJson).resultUrls?.[0] ?? null; } catch { continue; }
      }
      if (d.state === "fail") { console.error(`\n  Image gen failed: ${d.failMsg}`); break; }
      process.stdout.write(".");
    }
  }
  return null;
}

// --- Video Generation (Kling 3.0 Pro with sound) ---

async function generateVideo(prompt: string, imageUrl: string, duration: number): Promise<string | null> {
  const res = await fetch(`${KIE_BASE}/jobs/createTask`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "kling-3.0/video",
      input: {
        prompt,
        image_urls: [imageUrl],
        sound: true,
        duration: String(duration),
        aspect_ratio: "9:16",
        mode: "pro",
        multi_shots: false,
        negative_prompt: "smooth plastic skin, airbrushed skin, beauty filter, floating limbs, disconnected body parts, distorted hands, extra fingers, morphing clothes",
      },
    }),
  });
  const data = (await res.json()) as { code?: number; data?: { taskId: string }; msg?: string };
  if (!data.data?.taskId) { console.error(`  Kling error: ${JSON.stringify(data)}`); return null; }
  console.log(`  Task: ${data.data.taskId}`);

  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 15000));
    const check = await fetch(`${KIE_BASE}/jobs/recordInfo?taskId=${data.data.taskId}`, {
      headers: { Authorization: `Bearer ${KIE_API_KEY}` },
    });
    const { data: d } = (await check.json()) as { data?: { state?: string; resultJson?: string; failMsg?: string } };
    if (!d) { process.stdout.write("?"); continue; }
    if (d.state === "success" && d.resultJson) {
      try { return JSON.parse(d.resultJson).resultUrls?.[0] ?? null; } catch { return null; }
    }
    if (d.state === "fail") { console.error(`\n  Kling failed: ${d.failMsg}`); return null; }
    process.stdout.write(".");
  }
  return null;
}

// --- Anatomy Gate ---

interface CriticResult {
  overallScore: number;
  issues: Array<{ category: string; description: string; severity: string }>;
  verdict: string;
}

async function runFrameAnatomy(imageUrl: string, scenePrompt: string): Promise<CriticResult> {
  const res = await fetch(`${VIDJUTSU_API_BASE}/v1/watch`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${VIDJUTSU_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      mediaUrl: imageUrl,
      mode: "critic",
      mediaType: "image",
      context: [
        `Single frame from an AI-generated UGC talking head video.`,
        `Intended scene: "${scenePrompt}"`,
        `SPATIAL ANATOMY CHECK — focus ONLY on body connectivity:`,
        `1) Trace every visible arm from fingertips back to a shoulder. Does it connect to a visible torso? If the arm floats independently with no anatomical origin, score 3 or below — CRITICAL.`,
        `2) Check spatial consistency: if the torso is on one side of the frame, do the limbs originate from that same body? CRITICAL if not.`,
        `3) Check for disembodied body parts.`,
        `4) Verify anatomically possible number of limbs.`,
        `5) Check joint positions are anatomically correct.`,
        `Ignore: text rendering, background details, lighting, camera quality.`,
        `Score 8+ ONLY if all visible body parts are spatially connected and anatomically plausible.`,
      ].join(" "),
    }),
  });
  return (await res.json()) as CriticResult;
}

// --- Video Critic ---

async function runCritic(mediaUrl: string, scenePrompt: string): Promise<CriticResult> {
  const res = await fetch(`${VIDJUTSU_API_BASE}/v1/watch`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${VIDJUTSU_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      mediaUrl,
      mode: "critic",
      mediaType: "video",
      context: [
        `UGC talking head video — AI-generated character speaking to camera.`,
        `Intended scene: "${scenePrompt}"`,
        `CHECK:`,
        `1) Lip sync — does mouth movement match the audio naturally?`,
        `2) Face consistency — no morphing, warping, or identity drift across frames?`,
        `3) Eye movement — natural blinks and micro-expressions?`,
        `4) Body stable — no floating, teleporting, or disconnected limbs?`,
        `5) Audio quality — clear speech, no garbling or artifacts?`,
        `BODY PHYSICS (CRITICAL if fail):`,
        `6) Limb-to-torso connectivity — every visible arm/leg MUST connect to the body.`,
        `7) Spatial consistency — limbs make geometric sense relative to torso.`,
        `DO NOT penalize: natural camera shake, casual framing, slight blur.`,
        `DO penalize: lip sync failures, face morphing, disconnected anatomy, garbled speech.`,
      ].join(" "),
    }),
  });
  return (await res.json()) as CriticResult;
}

// --- Main Pipeline ---

const passedClips: string[] = [];
const sceneReports: Array<{ scene: number; criticScore: number; attempts: number }> = [];

for (let i = 0; i < scenes.length; i++) {
  const scene = scenes[i];
  const num = String(i + 1).padStart(2, "0");
  const duration = scene.duration ?? 5;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`SCENE ${num} (${duration}s, sound=true)`);
  console.log(`${"=".repeat(60)}`);

  // Generate start image
  let startUrl: string;
  if (scene.sceneImageUrl) {
    startUrl = scene.sceneImageUrl;
    console.log(`\n  Start image: using provided URL`);
  } else {
    const startPrompt = `${promptBase}, ${scene.startPrompt ?? scene.prompt}`;
    console.log(`\n  Start image: generating...`);
    const url = await generateSceneImage(startPrompt);
    if (!url) { console.error(`  ABORT: Failed to generate start image.`); process.exit(1); }
    startUrl = url;
    console.log(`\n  Start image: ${url}`);
  }

  let passed = false;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`\n  Attempt ${attempt}/${MAX_RETRIES}`);

    // Generate video with sound
    console.log(`  [GEN] Generating via Kling 3.0 Pro (sound=true)...`);
    const videoUrl = await generateVideo(`${promptBase}, ${scene.prompt}`, startUrl, duration);
    if (!videoUrl) { console.log("  [GEN] Failed. Retrying..."); continue; }

    const rawPath = `${tmpDir}/scene-${num}-attempt-${attempt}.mp4`;
    const resp = await fetch(videoUrl);
    await Bun.write(rawPath, await resp.arrayBuffer());
    console.log("\n  [GEN] Video ready.");

    // Anatomy Gate
    console.log("  [ANATOMY] Extracting keyframes...");
    const clipDur = parseFloat(await Bun.$`ffprobe -v quiet -show_entries format=duration -of csv=p=0 ${rawPath}`.text());
    const totalFrames = Math.floor(clipDur * 30) - 1;
    const frameChecks = [0, Math.floor(totalFrames * 0.5), Math.max(0, totalFrames - 10)];
    let anatomyPassed = true;
    for (const frameIdx of frameChecks) {
      const framePath = `${tmpDir}/scene-${num}-frame-${frameIdx}.png`;
      const ffmpegProc = Bun.spawn(["ffmpeg", "-i", rawPath, "-vf", `select=eq(n\\,${frameIdx})`, "-frames:v", "1", framePath, "-y"], { stdout: "ignore", stderr: "ignore" });
      await ffmpegProc.exited;
      if (!await Bun.file(framePath).exists()) continue;
      const frameUrl = await uploadToCdn(framePath, "image/png");
      if (!frameUrl) continue;
      const frameAnalysis = await runFrameAnatomy(frameUrl, scene.prompt);
      console.log(`  [ANATOMY] Frame ${frameIdx}: ${frameAnalysis.overallScore}/10`);
      if (frameAnalysis.overallScore < 8) {
        const criticals = frameAnalysis.issues.filter((i: { severity: string }) => i.severity === "critical");
        for (const issue of criticals) {
          console.log(`    ✗ [${issue.severity}] ${issue.description.slice(0, 120)}`);
        }
        anatomyPassed = false;
        break;
      }
    }
    if (!anatomyPassed) {
      console.log("  [ANATOMY] REJECTED");
      if (attempt < MAX_RETRIES) console.log(`  Regenerating...`);
      continue;
    }
    console.log("  [ANATOMY] PASSED");

    // Video Critic
    console.log("  [CRITIC] Uploading for QA...");
    const cdnUrl = await uploadToCdn(rawPath, "video/mp4");
    if (!cdnUrl) { console.log("  [CRITIC] Upload failed. Retrying..."); continue; }

    console.log("  [CRITIC] Running analysis...");
    const critic = await runCritic(cdnUrl, scene.prompt);
    console.log(`  [CRITIC] Score: ${critic.overallScore}/10 — ${critic.verdict}`);

    const blockingIssues = critic.issues.filter(
      (issue) => (issue.severity === "major" || issue.severity === "critical") && issue.category !== "text_rendering"
    );
    if (critic.overallScore < 8 || blockingIssues.length > 0) {
      console.log(`  [CRITIC] REJECTED`);
      for (const issue of blockingIssues) {
        console.log(`    ✗ [${issue.severity}] ${issue.description.slice(0, 120)}`);
      }
      if (attempt < MAX_RETRIES) console.log(`  Regenerating...`);
      continue;
    }

    console.log(`  [QA] PASSED (anatomy + critic ${critic.overallScore}/10)`);
    passedClips.push(rawPath);
    sceneReports.push({ scene: i + 1, criticScore: critic.overallScore, attempts: attempt });
    passed = true;
    break;
  }

  if (!passed) {
    console.error(`\n  ABORT: Scene ${num} failed ${MAX_RETRIES} attempts.`);
    await Bun.$`rm -rf ${tmpDir}`.nothrow();
    process.exit(1);
  }
}

// --- Post-Production ---
console.log(`\n${"=".repeat(60)}`);
console.log(`POST-PRODUCTION`);
console.log(`${"=".repeat(60)}`);

// Concat clips (keep audio — this is talking head)
console.log(`\n  [CONCAT] Joining ${passedClips.length} clips...`);
const concatPath = `${tmpDir}/concat.mp4`;
await Bun.write(`${tmpDir}/concat.txt`, passedClips.map((p) => `file '${p}'`).join("\n"));
await Bun.$`ffmpeg -f concat -safe 0 -i ${tmpDir}/concat.txt -c copy ${concatPath} -y 2>/dev/null`;

// Resize to 1080x1920
console.log("  [RESIZE] Scaling to 1080x1920...");
await Bun.$`ffmpeg -i ${concatPath} -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black" -c:a copy -y ${outputPath} 2>/dev/null`;
console.log("  [RESIZE] Done.");

// Upload final
console.log("  [UPLOAD] Uploading...");
const finalCdnUrl = await uploadToCdn(outputPath, "video/mp4");

// --- Report ---
const stat = await Bun.file(outputPath).stat();
const duration = await Bun.$`ffprobe -v quiet -show_entries format=duration -of csv=p=0 ${outputPath}`.text();

console.log(`\n${"=".repeat(60)}`);
console.log(`REPORT`);
console.log(`${"=".repeat(60)}`);
console.log(`\nOutput: ${outputPath}`);
console.log(`CDN: ${finalCdnUrl ?? "upload failed"}`);
console.log(`Size: ${Math.round(stat.size / 1024)}KB`);
console.log(`Duration: ${parseFloat(duration).toFixed(1)}s`);
console.log(`Model: Kling 3.0 Pro`);
console.log(`Style: UGC Talking Head`);
console.log(`Audio: Native lip sync (sound=true)`);

console.log(`\n--- Per-Scene Results ---`);
for (const r of sceneReports) {
  console.log(`  Scene ${r.scene}: critic ${r.criticScore}/10, ${r.attempts} attempt(s)`);
}

await Bun.$`rm -rf ${tmpDir}`.nothrow();

console.log(`\n${"=".repeat(60)}`);
console.log(`PIPELINE COMPLETE`);
console.log(`${"=".repeat(60)}`);
