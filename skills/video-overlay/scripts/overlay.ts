/**
 * Video text overlay via FFmpeg ASS subtitles
 *
 * Burns text onto a video with TikTok-safe zone awareness, configurable positioning and styling.
 * Uses ASS (Advanced SubStation Alpha) subtitle format for precise text rendering.
 *
 * Usage:
 *   bun run scripts/overlay.ts <input-video> <output-video> [options-json]
 *
 * Options JSON:
 *   {
 *     "text": "Your overlay text",        // required
 *     "position": "top"|"center"|"bottom", // default: "center"
 *     "fontSize": 48,                      // default: 4% of video height
 *     "strokeThickness": 2,                // default: 2
 *     "topBottomMargin": 131,              // default: auto (TikTok safe zone)
 *     "fontName": "Roboto Bold",           // default: "Roboto Bold"
 *     "fontDir": "/path/to/fonts"          // default: none
 *   }
 *
 * Example:
 *   bun run scripts/overlay.ts raw.mp4 overlaid.mp4 '{"text":"Follow for more","position":"bottom"}'
 */

interface OverlayOptions {
  text: string;
  position?: "top" | "center" | "bottom";
  fontSize?: number;
  strokeThickness?: number;
  topBottomMargin?: number;
  fontName?: string;
  fontDir?: string;
}

// --- Video probing ---

async function probeVideo(path: string): Promise<{ width: number; height: number }> {
  try {
    const result = await Bun.$`ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 ${path}`.text();
    const parts = result.trim().split(",");
    if (parts.length >= 2) {
      const width = parseInt(parts[0], 10);
      const height = parseInt(parts[1], 10);
      if (width > 0 && height > 0) return { width, height };
    }
  } catch {
    console.warn("[OVERLAY] ffprobe failed, using default 1080x1920");
  }
  return { width: 1080, height: 1920 };
}

// --- Safe zone calculation ---

function calculateSafeZones(w: number, h: number) {
  const isPortrait = h > w;
  return {
    safeTop: isPortrait ? Math.round(h * (131 / 1920)) : 0,
    safeBottom: isPortrait ? Math.round(h * (367 / 1920)) : 0,
    safeSide: isPortrait ? Math.round(w * (120 / 1080)) : 0,
  };
}

// --- ASS subtitle generation ---

function generateASS(
  options: OverlayOptions,
  videoW: number,
  videoH: number,
  safeZones: { safeTop: number; safeBottom: number; safeSide: number }
): string {
  const text = options.text.replace(/\n/g, "\\N").replace(/\r/g, "");
  const fontName = options.fontName ?? "Roboto Bold";
  const outline = options.strokeThickness ?? 2;
  const defaultFontSize = Math.round(videoH * 0.04);
  const fontSize = options.fontSize ?? defaultFontSize;

  const alignmentMap = { top: 8, center: 5, bottom: 2 } as const;
  const alignment = alignmentMap[options.position ?? "center"];

  let marginV: number;
  if (options.position === "top") {
    marginV = options.topBottomMargin ?? safeZones.safeTop;
  } else if (options.position === "bottom") {
    marginV = options.topBottomMargin ?? safeZones.safeBottom;
  } else {
    marginV = 0;
  }

  const marginL = safeZones.safeSide;
  const marginR = safeZones.safeSide;

  return [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${videoW}`,
    `PlayResY: ${videoH}`,
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Default,${fontName},${fontSize},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,${outline},0,${alignment},${marginL},${marginR},${marginV},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    `Dialogue: 0,0:00:00.00,99:00:00.00,Default,,0,0,0,,${text}`,
  ].join("\n");
}

// --- Main ---

const inputPath = process.argv[2];
const outputPath = process.argv[3];
const optionsArg = process.argv[4];

if (!inputPath || !outputPath) {
  console.error("Usage: bun run overlay.ts <input-video> <output-video> [options-json]");
  process.exit(1);
}

// Parse options
let options: OverlayOptions;
if (!optionsArg) {
  console.error("Options JSON is required (must include at least \"text\").");
  process.exit(1);
}

try {
  // Check if it's a file path
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

if (!options.text?.trim()) {
  console.error("Overlay text is required and must be non-empty.");
  process.exit(1);
}

// Validate input exists
if (!(await Bun.file(inputPath).exists())) {
  console.error(`Input video not found: ${inputPath}`);
  process.exit(1);
}

const tmpDir = `/tmp/vidjutsu-overlay-${Date.now()}`;
await Bun.$`mkdir -p ${tmpDir}`;
const assPath = `${tmpDir}/overlay.ass`;

try {
  console.log(`=== Video Overlay ===`);
  console.log(`Input:    ${inputPath}`);
  console.log(`Output:   ${outputPath}`);
  console.log(`Text:     ${options.text}`);
  console.log(`Position: ${options.position ?? "center"}\n`);

  // Probe video dimensions
  console.log("[OVERLAY] Probing video dimensions...");
  const { width, height } = await probeVideo(inputPath);
  console.log(`[OVERLAY] Dimensions: ${width}x${height}`);

  // Calculate safe zones
  const safeZones = calculateSafeZones(width, height);

  // Generate ASS subtitle file
  const ass = generateASS(options, width, height, safeZones);
  await Bun.write(assPath, ass);
  console.log("[OVERLAY] Generated ASS subtitle file");

  // Build ffmpeg filter — requires ffmpeg with libass (subtitles filter)
  const ffmpegBin = process.env.FFMPEG_BIN ?? "/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg";
  const fontDirSuffix = options.fontDir ? `:fontsdir=${options.fontDir}` : "";
  const filter = `subtitles=${assPath}${fontDirSuffix}`;

  // Run ffmpeg
  console.log("[OVERLAY] Running ffmpeg...");
  await Bun.$`${ffmpegBin} -i ${inputPath} -vf ${filter} -c:a copy -y ${outputPath}`.quiet();

  console.log(`[OVERLAY] Done: ${outputPath}`);
} catch (err) {
  console.error(`[OVERLAY] Failed:`, err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await Bun.$`rm -rf ${tmpDir}`.quiet().nothrow();
}
