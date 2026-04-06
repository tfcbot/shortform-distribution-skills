/**
 * Lofi B-Roll video generator
 *
 * Produces TikTok-style lofi b-roll videos — lifestyle actions, vlog snippets, relatable
 * moments with text overlay. NOT stiff talking-head content. The influencer is doing things
 * (cooking, walking, getting ready, working out, pouring coffee) while overlay text carries
 * the message.
 *
 * Pipeline: Generate (no audio) → Critic Gate (≥8, motion-friendly) → Frame Chain → Concat → Overlay → Final
 *
 * Key differences from generate-multi-scene.ts:
 *   - No STT speech gate (dialogue is overlay text, not spoken words)
 *   - Critic context tuned for b-roll aesthetics (natural motion, lifestyle feel)
 *   - Automatic text overlay burn-in via the video-overlay skill
 *   - Sound disabled — silent video, overlay text only
 *   - Motion is encouraged, not penalized (handheld, tracking, natural movement)
 *
 * Usage:
 *   bun run scripts/generate-lofi-b-roll.ts <model> <character-dir> <scenes-json> <output-path>
 *
 * Models:
 *   kling3    — Kling 3.0 Pro (default)
 *   veo3      — Veo 3.1 Quality
 *   veo3fast  — Veo 3.1 Fast
 *
 * scenes.json format:
 *   {
 *     "overlayText": "me pretending I have my life together",
 *     "overlayPosition": "top",           // optional — default: "top"
 *     "overlayFontSize": 52,              // optional — default: auto
 *     "scenes": [
 *       {
 *         "prompt": "Young woman pouring oat milk into iced coffee in a sunlit kitchen, golden hour light, handheld camera, casual vlog style",
 *         "sceneImageUrl": "https://..."  // optional — character reference
 *       }
 *     ]
 *   }
 *
 * Example:
 *   bun run scripts/generate-lofi-b-roll.ts kling3 characters/maya lofi-scenes.json lofi-output.mp4
 */

const KIE_API_KEY = process.env.KIE_API_KEY ?? Bun.env.KIE_API_KEY;
const KIE_BASE = "https://api.kie.ai/api/v1";

const VIDJUTSU_API_BASE = process.env.VIDJUTSU_API_BASE ?? Bun.env.VIDJUTSU_API_BASE ?? "https://api.vidjutsu.ai";
const VIDJUTSU_API_KEY = process.env.VIDJUTSU_API_KEY ?? Bun.env.VIDJUTSU_API_KEY;

const MAX_RETRIES = 5;
const SUPPORTED_MODELS = ["kling3", "veo3", "veo3fast"] as const;
type Model = (typeof SUPPORTED_MODELS)[number];

if (!KIE_API_KEY) { console.error("KIE_API_KEY not set."); process.exit(1); }
if (!VIDJUTSU_API_KEY) { console.error("VIDJUTSU_API_KEY not set."); process.exit(1); }

const modelArg = process.argv[2] as Model;
const charDir = process.argv[3];
const scenesPath = process.argv[4];
const outputPath = process.argv[5] ?? "output.mp4";

if (!modelArg || !SUPPORTED_MODELS.includes(modelArg) || !charDir || !scenesPath) {
  console.error(`Usage: bun run generate-lofi-b-roll.ts <model> <character-dir> <scenes-json> <output-path>`);
  console.error(`Models: ${SUPPORTED_MODELS.join(", ")}`);
  process.exit(1);
}

const MODEL_LABELS: Record<Model, string> = {
  kling3: "Kling 3.0 Pro",
  veo3: "Veo 3.1 Quality",
  veo3fast: "Veo 3.1 Fast",
};

interface LofiScene {
  prompt: string;
  startPrompt?: string;   // prompt for generating the start frame (defaults to scene prompt)
  endPrompt?: string;     // prompt for generating the end frame
  sceneImageUrl?: string; // override: skip image gen, use this URL as start frame
}

interface MusicSpec {
  prompt?: string;   // generate via Suno — e.g. "phonk plugnb TikTok instrumental"
  url?: string;      // or provide a direct audio URL
  volume?: number;   // 0-1, default 0.6
  fadeIn?: number;   // seconds, default 0.5
  fadeOut?: number;   // seconds, default 1.5
}

interface LofiSpec {
  overlayText: string;
  overlayPosition?: "top" | "center" | "bottom";
  overlayFontSize?: number;
  music?: MusicSpec;  // optional — if omitted, no music
  scenes: LofiScene[];
}

const character = await Bun.file(`${charDir}/character.json`).json();
const spec = (await Bun.file(scenesPath).json()) as LofiSpec;
const scenes = spec.scenes;
const promptBase: string = character.promptBase ?? "";

const refUrl = character.referenceSheet?.url;
if (!refUrl) { console.error("No referenceSheet.url in character.json. Generate reference sheet first."); process.exit(1); }

const tmpDir = `/tmp/vidjutsu-lofi-${Date.now()}`;
await Bun.$`mkdir -p ${tmpDir}`;

console.log(`=== Lofi B-Roll Generator PIPELINE ===`);
console.log(`Character: ${character.name}`);
console.log(`Scenes: ${scenes.length}`);
console.log(`Model: ${MODEL_LABELS[modelArg]}`);
console.log(`Pipeline: Scene Image Gen → ${MODEL_LABELS[modelArg]} (no audio) → Critic Gate (≥8) → Concat → Overlay → ${spec.music ? "Music → " : ""}Final\n`);

// --- Video Generation ---

async function generateKling(prompt: string, imageUrls: string[]): Promise<string | null> {
  const res = await fetch(`${KIE_BASE}/jobs/createTask`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "kling-3.0/video",
      input: {
        prompt,
        negative_prompt: "smooth plastic skin, airbrushed skin, beauty filter, floating limbs, disconnected body parts, distorted hands, extra fingers, morphing clothes",
        image_urls: imageUrls,
        sound: false,
        duration: "10",
        aspect_ratio: "9:16",
        mode: "pro",
        multi_shots: false,
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

async function generateVeo(prompt: string, imageUrls: string[], quality: boolean): Promise<string | null> {
  const res = await fetch(`${KIE_BASE}/veo/generate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, imageUrls, model: quality ? "veo3" : "veo3_fast", aspectRatio: "9:16" }),
  });
  const data = (await res.json()) as { code: number; msg: string; data: { taskId: string } };
  if (data.code !== 200) { console.error(`  Veo error: ${data.msg}`); return null; }
  console.log(`  Task: ${data.data.taskId}`);

  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 15000));
    const check = await fetch(`${KIE_BASE}/veo/record-info?taskId=${data.data.taskId}`, {
      headers: { Authorization: `Bearer ${KIE_API_KEY}` },
    });
    const { data: d } = (await check.json()) as {
      data: { successFlag: number; response?: { resultUrls?: string[] }; errorMessage?: string };
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
  const data = (await res.json()) as { url?: string };
  return data.url ?? null;
}

// --- Critic (tuned for b-roll aesthetics) ---

interface CriticResult {
  overallScore: number;
  issues: Array<{ category: string; description: string; severity: string }>;
  verdict: string;
}

async function runCritic(mediaUrl: string, sceneNum: number, scenePrompt: string): Promise<CriticResult> {
  const res = await fetch(`${VIDJUTSU_API_BASE}/v1/analyze`, {
    method: "POST",
    headers: { "X-Api-Key": VIDJUTSU_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      mediaUrl,
      mode: "critic",
      mediaType: "video",
      context: [
        `Scene ${sceneNum} of a lofi b-roll TikTok/Instagram reel. AI-generated lifestyle vlog snippet.`,
        `Intended action: "${scenePrompt}"`,
        `This is NOT a talking-head video. The subject should be doing a relatable lifestyle action.`,
        `CHECK:`,
        `1) Subject is performing a natural, believable action — not frozen or stiff?`,
        `2) Camera feels organic — handheld wobble, slow tracking, or natural pan is GOOD?`,
        `3) Lighting and environment feel authentic — not sterile or over-produced?`,
        `4) Face and body are consistent — no morphing, warping, or drift?`,
        `5) Movement is fluid — no jank, teleporting limbs, or unnatural physics?`,
        `BODY PHYSICS (flag as CRITICAL if any fail):`,
        `6) Limb-to-torso connectivity — every visible arm/leg MUST trace back to a shoulder/hip attached to a visible torso. If an arm or leg appears to float independently with no anatomical origin point, this is CRITICAL. A disembodied limb entering from offscreen with no body connection is a failure.`,
        `7) Arms and hands — do elbows, wrists, and fingers bend at anatomically possible angles? No hyperextension, impossible rotation, or joints bending the wrong way.`,
        `8) Spatial consistency — does the position of each limb make geometric sense relative to the torso? An arm extending from the left while the body is on the right is CRITICAL.`,
        `9) Body proportions — do torso, arm, and hand ratios stay consistent throughout? No sudden size changes or stretching.`,
        `10) Weight and gravity — do movements show realistic weight and inertia? Arms should not float weightlessly.`,
        `DO NOT penalize: natural camera motion, casual framing, or slight motion blur.`,
        `DO penalize: anatomically impossible body positions, disconnected limbs, or broken spatial relationships between body parts.`,
        `Flag issues as CRITICAL or MAJOR for visual artifacts, identity drift, broken physics, or disconnected anatomy.`,
      ].join(" "),
    }),
  });
  return (await res.json()) as CriticResult;
}

// --- Frame Anatomy Check (spatial body connectivity on stills) ---

async function runFrameAnatomy(imageUrl: string, scenePrompt: string): Promise<CriticResult> {
  const res = await fetch(`${VIDJUTSU_API_BASE}/v1/analyze`, {
    method: "POST",
    headers: { "X-Api-Key": VIDJUTSU_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      mediaUrl: imageUrl,
      mode: "critic",
      mediaType: "image",
      context: [
        `Single frame from an AI-generated lofi b-roll video.`,
        `Intended scene: "${scenePrompt}"`,
        `SPATIAL ANATOMY CHECK — focus ONLY on body connectivity:`,
        `1) Trace every visible arm from fingertips back to a shoulder. Does it connect to a visible torso? If the arm floats independently with no anatomical origin, score 3 or below — CRITICAL.`,
        `2) Check spatial consistency: if the torso is on one side of the frame, do the limbs originate from that same body? An arm entering from the opposite side with no connection is CRITICAL.`,
        `3) Check for disembodied body parts — hands, legs, or arms that appear without any connection to a body.`,
        `4) Verify that the number of visible limbs is anatomically possible (max 2 arms, 2 legs).`,
        `5) Check that joints (shoulder, elbow, wrist, knee) are positioned where they anatomically belong.`,
        `Ignore: text rendering, background details, lighting, camera quality.`,
        `Score 6+ ONLY if all visible body parts are spatially connected and anatomically plausible.`,
      ].join(" "),
    }),
  });
  return (await res.json()) as CriticResult;
}

// --- Overlay (inline ASS burn-in) ---

async function probeVideo(path: string): Promise<{ width: number; height: number }> {
  try {
    const result = await Bun.$`ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 ${path}`.text();
    const parts = result.trim().split(",");
    if (parts.length >= 2) {
      const width = parseInt(parts[0], 10);
      const height = parseInt(parts[1], 10);
      if (width > 0 && height > 0) return { width, height };
    }
  } catch { /* fallback */ }
  return { width: 1080, height: 1920 };
}

function generateASS(
  text: string,
  videoW: number,
  videoH: number,
  position: "top" | "center" | "bottom",
  fontSize?: number,
): string {
  const isPortrait = videoH > videoW;
  const safeTop = isPortrait ? Math.round(videoH * (250 / 1920)) : 0;
  const safeBottom = isPortrait ? Math.round(videoH * (367 / 1920)) : 0;
  const safeSide = isPortrait ? Math.round(videoW * (120 / 1080)) : 0;

  const alignmentMap = { top: 8, center: 5, bottom: 2 } as const;
  const alignment = alignmentMap[position];
  const marginV = position === "top" ? safeTop : position === "bottom" ? safeBottom : 0;
  const defaultFontSize = Math.round(videoH * 0.04);
  const size = fontSize ?? defaultFontSize;
  const assText = text.replace(/\n/g, "\\N").replace(/\r/g, "");

  return [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${videoW}`,
    `PlayResY: ${videoH}`,
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Default,Roboto Bold,${size},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,0,${alignment},${safeSide},${safeSide},${marginV},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    `Dialogue: 0,0:00:00.00,99:00:00.00,Default,,0,0,0,,${assText}`,
  ].join("\n");
}

async function burnOverlay(
  inputPath: string,
  outputPath: string,
  text: string,
  position: "top" | "center" | "bottom" = "top",
  fontSize?: number,
): Promise<void> {
  const { width, height } = await probeVideo(inputPath);
  const ass = generateASS(text, width, height, position, fontSize);
  const assPath = `${tmpDir}/overlay-${Date.now()}.ass`;
  await Bun.write(assPath, ass);
  // Use ffmpeg-full for subtitles filter (requires libass, not in default brew ffmpeg)
  const ffmpegBin = process.env.FFMPEG_BIN ?? "/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg";
  const filter = `subtitles=${assPath}`;
  await Bun.$`${ffmpegBin} -i ${inputPath} -vf ${filter} -an -y ${outputPath}`.quiet();
}

// --- Music Generation (Suno via KIE) ---

async function generateMusic(prompt: string): Promise<string | null> {
  console.log("  [MUSIC] Generating via Suno V5...");
  const res = await fetch(`${KIE_BASE}/generate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      instrumental: true,
      model: "V5",
      customMode: false,
      callBackUrl: `${VIDJUTSU_API_BASE}/api/webhooks/kie`,
    }),
  });
  const data = (await res.json()) as { data?: { taskId: string }; msg?: string };
  if (!data.data?.taskId) { console.error(`  [MUSIC] Submit failed: ${JSON.stringify(data)}`); return null; }
  console.log(`  [MUSIC] Task: ${data.data.taskId}`);

  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const check = await fetch(`${KIE_BASE}/generate/record-info?taskId=${data.data.taskId}`, {
      headers: { Authorization: `Bearer ${KIE_API_KEY}` },
    });
    const d = (await check.json()) as { data?: { status?: string; response?: { sunoData?: Array<{ audioUrl: string; duration?: number }> } } };
    const status = d.data?.status;
    if (status === "SUCCESS" || status === "FIRST_SUCCESS") {
      const audioUrl = d.data?.response?.sunoData?.[0]?.audioUrl;
      if (audioUrl) return audioUrl;
    }
    if (status === "CREATE_TASK_FAILED" || status === "GENERATE_AUDIO_FAILED" || status === "SENSITIVE_WORD_ERROR") {
      console.error(`\n  [MUSIC] Failed: ${status}`);
      return null;
    }
    process.stdout.write(".");
  }
  console.error("\n  [MUSIC] Timed out");
  return null;
}

// --- Starting Image Generation (nano-banana-2 via KIE) ---

async function generateSceneImage(prompt: string, imageRef?: string): Promise<string | null> {
  for (let retry = 0; retry < 3; retry++) {
    if (retry > 0) console.log(`  Retry ${retry + 1}/3...`);
    const res = await fetch(`${KIE_BASE}/jobs/createTask`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "nano-banana-2",
        input: {
          prompt,
          image_input: [imageRef ?? refUrl],
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

// --- Generate start + end images for all scenes ---

console.log(`\n${"=".repeat(60)}`);
console.log(`SCENE IMAGE GENERATION (start + end per scene)`);
console.log(`${"=".repeat(60)}`);

interface SceneImages { startUrl: string; endUrl: string | null; }
const sceneImages: SceneImages[] = [];

for (let i = 0; i < scenes.length; i++) {
  const scene = scenes[i];
  const num = String(i + 1).padStart(2, "0");

  // Start image: use previous scene's end image for cohesion, or generate fresh
  let startUrl: string;
  if (i > 0 && sceneImages[i - 1].endUrl) {
    // Reuse previous scene's end frame as this scene's start for seamless flow
    startUrl = sceneImages[i - 1].endUrl!;
    console.log(`\n  Scene ${num} start: reusing scene ${String(i).padStart(2, "0")} end frame`);
  } else if (scene.sceneImageUrl) {
    startUrl = scene.sceneImageUrl;
    console.log(`\n  Scene ${num} start: using provided sceneImageUrl`);
  } else {
    const startPrompt = `${promptBase}, ${scene.startPrompt ?? scene.prompt}`;
    console.log(`\n  Scene ${num} start: generating...`);
    const url = await generateSceneImage(startPrompt);
    if (!url) { console.error(`  ABORT: Failed to generate start image for scene ${num}.`); process.exit(1); }
    startUrl = url;
    console.log(`\n  Scene ${num} start: ${url}`);
  }

  // End image: generate from start image as reference (keeps outfit/setting consistent)
  let endUrl: string | null = null;
  if (scene.endPrompt) {
    console.log(`  Scene ${num} end: generating (from start image)...`);
    const url = await generateSceneImage(`${promptBase}, ${scene.endPrompt}`, startUrl);
    if (!url) { console.error(`  ABORT: Failed to generate end image for scene ${num}.`); process.exit(1); }
    endUrl = url;
    console.log(`\n  Scene ${num} end: ${url}`);
  }

  sceneImages.push({ startUrl, endUrl });
}

// --- Main Pipeline ---

const passedClips: string[] = [];
const sceneReports: Array<{ scene: number; criticScore: number; attempts: number }> = [];

for (let i = 0; i < scenes.length; i++) {
  const scene = scenes[i];
  const num = String(i + 1).padStart(2, "0");
  console.log(`\n${"=".repeat(60)}`);
  console.log(`SCENE ${num}`);
  console.log(`${"=".repeat(60)}`);

  let passed = false;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`\n  Attempt ${attempt}/${MAX_RETRIES}`);

    // Build image_urls: [start] or [start, end] for Kling to interpolate
    const imageUrls: string[] = [sceneImages[i].startUrl];
    if (sceneImages[i].endUrl) {
      imageUrls.push(sceneImages[i].endUrl!);
      console.log(`  [GEN] Start + end frames provided`);
    }
    console.log(`  [GEN] Generating via ${MODEL_LABELS[modelArg]}...`);
    const videoUrl = await generate(`${promptBase}, ${scene.prompt}`, imageUrls);
    if (!videoUrl) { console.log("  [GEN] Failed. Retrying..."); continue; }

    const rawPath = `${tmpDir}/scene-${num}-attempt-${attempt}.mp4`;
    const resp = await fetch(videoUrl);
    await Bun.write(rawPath, await resp.arrayBuffer());
    console.log("\n  [GEN] Video ready.");

    // Frame Anatomy Gate (first — cheap, fast, catches spatial disconnects early)
    console.log("  [ANATOMY] Extracting keyframes for spatial check...");
    const clipDur = parseFloat(await Bun.$`ffprobe -v quiet -show_entries format=duration -of csv=p=0 ${rawPath}`.text());
    const totalFrames = Math.floor(clipDur * 30);
    const frameChecks = [0, Math.floor(totalFrames * 0.5), Math.max(0, totalFrames - 5)]; // start, mid, near-end
    let anatomyPassed = true;
    for (const frameIdx of frameChecks) {
      const framePath = `${tmpDir}/scene-${num}-frame-${frameIdx}.png`;
      const ffmpegProc = Bun.spawn(["ffmpeg", "-i", rawPath, "-vf", `select=eq(n\\,${frameIdx})`, "-frames:v", "1", framePath, "-y"], { stdout: "ignore", stderr: "ignore" });
      await ffmpegProc.exited;
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
      console.log("  [ANATOMY] REJECTED — spatial anatomy failure");
      if (attempt < MAX_RETRIES) console.log(`  Regenerating...`);
      continue;
    }
    console.log("  [ANATOMY] PASSED");

    // Critic Visual Gate (second — full video quality, motion, lighting)
    console.log("  [CRITIC] Uploading for visual QA...");
    const cdnUrl = await uploadToCdn(rawPath, "video/mp4");
    if (!cdnUrl) { console.log("  [CRITIC] Upload failed. Retrying..."); continue; }

    console.log("  [CRITIC] Running visual analysis...");
    const critic = await runCritic(cdnUrl, i + 1, scene.prompt);
    console.log(`  [CRITIC] Score: ${critic.overallScore}/10 — ${critic.verdict}`);

    const blockingIssues = critic.issues.filter(
      (issue) => (issue.severity === "major" || issue.severity === "critical") && issue.category !== "text_rendering"
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

    console.log(`  [QA] PASSED (critic ${critic.overallScore}/10)`);
    if (critic.issues.length > 0) {
      for (const issue of critic.issues) console.log(`    - [${issue.severity}] ${issue.description.slice(0, 100)}`);
    }

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

// Concat raw clips (no overlay yet — overlay is the final step)
console.log(`\n  [CONCAT] Joining ${passedClips.length} clips (hard cuts)...`);
const concatRawPath = `${tmpDir}/concat-raw.mp4`;
await Bun.write(`${tmpDir}/concat.txt`, passedClips.map((p) => `file '${p}'`).join("\n"));
await Bun.$`ffmpeg -f concat -safe 0 -i ${tmpDir}/concat.txt -c copy ${concatRawPath} -y 2>/dev/null`;

// Strip any audio track from concat (Kling sound=false, but just in case)
console.log("  [STRIP] Removing audio track...");
const silentPath = `${tmpDir}/concat-silent.mp4`;
await Bun.$`ffmpeg -i ${concatRawPath} -an -c:v copy ${silentPath} -y 2>/dev/null`;

// Overlay — single static text burned onto the final video as the last step
console.log(`  [OVERLAY] Burning text: "${spec.overlayText}" (${spec.overlayPosition ?? "top"})`);
await burnOverlay(
  silentPath,
  outputPath,
  spec.overlayText,
  spec.overlayPosition ?? "top",
  spec.overlayFontSize,
);
console.log("  [OVERLAY] Done.");

// Music — generate or download, then mix onto the video
if (spec.music?.prompt || spec.music?.url) {
  let audioUrl: string | null = null;

  if (spec.music.url) {
    audioUrl = spec.music.url;
    console.log(`  [MUSIC] Using provided URL: ${audioUrl}`);
  } else if (spec.music.prompt) {
    audioUrl = await generateMusic(spec.music.prompt);
    if (audioUrl) console.log(`\n  [MUSIC] Generated: ${audioUrl}`);
    else console.log("  [MUSIC] Generation failed — skipping music.");
  }

  if (audioUrl) {
    const audioPath = `${tmpDir}/music-track.mp3`;
    const audioResp = await fetch(audioUrl);
    await Bun.write(audioPath, await audioResp.arrayBuffer());

    const vol = spec.music.volume ?? 0.6;
    const fadeIn = spec.music.fadeIn ?? 0.5;
    const videoDur = parseFloat(await Bun.$`ffprobe -v quiet -show_entries format=duration -of csv=p=0 ${outputPath}`.text());
    const fadeOutStart = Math.max(0, videoDur - (spec.music.fadeOut ?? 1.5));
    const fadeOutDur = spec.music.fadeOut ?? 1.5;
    const audioFilter = `afade=t=in:st=0:d=${fadeIn},afade=t=out:st=${fadeOutStart}:d=${fadeOutDur},volume=${vol}`;

    const withMusicPath = `${tmpDir}/with-music.mp4`;
    console.log(`  [MUSIC] Mixing audio (vol=${vol}, fadeIn=${fadeIn}s, fadeOut=${fadeOutDur}s)...`);
    await Bun.$`ffmpeg -i ${outputPath} -i ${audioPath} -t ${videoDur} -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -af ${audioFilter} -shortest -y ${withMusicPath} 2>/dev/null`;
    await Bun.$`mv ${withMusicPath} ${outputPath}`;
    console.log("  [MUSIC] Done.");
  }
} else {
  console.log("  [MUSIC] No music specified — skipping.");
}

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
console.log(`Model: ${MODEL_LABELS[modelArg]}`);
console.log(`Style: Lofi B-Roll`);

console.log(`Overlay: "${spec.overlayText}" (${spec.overlayPosition ?? "top"})`);
console.log(`Music: ${spec.music?.prompt ? `generated ("${spec.music.prompt}")` : spec.music?.url ? `provided URL` : "none"}`);

console.log(`\n--- Per-Scene Results ---`);
for (const r of sceneReports) {
  console.log(`  Scene ${r.scene}: critic ${r.criticScore}/10, ${r.attempts} attempt(s)`);
}

await Bun.$`rm -rf ${tmpDir}`.nothrow();

console.log(`\n${"=".repeat(60)}`);
console.log(`PIPELINE COMPLETE`);
console.log(`${"=".repeat(60)}`);
