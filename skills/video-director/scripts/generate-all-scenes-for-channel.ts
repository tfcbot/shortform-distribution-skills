/**
 * Generate all 30 starting images for a channel launch.
 * Reads the character's scenes and wardrobe, generates one image per video
 * with varied outfit/setting combos.
 *
 * Usage:
 *   bun run marketing/scripts/generate-all-scenes-for-channel.ts <character-dir> [count]
 *
 * Example:
 *   bun run marketing/scripts/generate-all-scenes-for-channel.ts marketing/characters/maya 30
 *
 * Saves to scenes/<name>-video-01.png through scenes/<name>-video-30.png
 */

const KIE_API_KEY = process.env.KIE_API_KEY ?? Bun.env.KIE_API_KEY;
const KIE_BASE = "https://api.kie.ai/api/v1";

if (!KIE_API_KEY) {
  console.error("KIE_API_KEY not set.");
  process.exit(1);
}

const charDir = process.argv[2];
const count = parseInt(process.argv[3] ?? "30");

if (!charDir) {
  console.error("Usage: bun run generate-all-scenes-for-channel.ts <character-dir> [count]");
  process.exit(1);
}

const character = await Bun.file(`${charDir}/character.json`).json();
const name = character.name.toLowerCase();
const refUrl = character.referenceSheet?.url;

if (!refUrl) {
  console.error("No referenceSheet.url. Generate reference sheet first.");
  process.exit(1);
}

const settings = character.settings ?? [];
const wardrobe = character.wardrobe ?? [];
const expressions = character.expressions ?? ["speaking to camera"];

if (!settings.length || !wardrobe.length) {
  console.error("Need settings and wardrobe in character.json");
  process.exit(1);
}

console.log(`Generating ${count} starting images for ${character.name}...`);

async function createTask(prompt: string): Promise<string> {
  const res = await fetch(`${KIE_BASE}/jobs/createTask`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KIE_API_KEY}`,
      "Content-Type": "application/json",
    },
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
  const { data } = await res.json() as { data: { taskId: string } };
  return data.taskId;
}

async function waitForTask(taskId: string): Promise<string | null> {
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const check = await fetch(`${KIE_BASE}/jobs/recordInfo?taskId=${taskId}`, {
      headers: { Authorization: `Bearer ${KIE_API_KEY}` },
    });
    const { data } = await check.json() as { data: { state: string; resultJson: string } };
    if (data.state === "success") {
      return JSON.parse(data.resultJson).resultUrls[0];
    } else if (data.state === "fail") {
      return null;
    }
  }
  return null;
}

// Generate varied combos
const tasks: { num: number; taskId: string; setting: string; outfit: string }[] = [];

for (let i = 0; i < count; i++) {
  const setting = settings[i % settings.length];
  const outfit = wardrobe[i % wardrobe.length];
  const expression = expressions[i % expressions.length];

  const prompt = `${character.promptBase}, ${setting.description}, wearing ${outfit}, ${expression}, portrait 9:16, talking to camera`;

  const taskId = await createTask(prompt);
  tasks.push({ num: i + 1, taskId, setting: setting.name, outfit });
  console.log(`  Video ${String(i + 1).padStart(2, "0")}: ${setting.name} / ${outfit.slice(0, 40)}... → ${taskId}`);

  // Small delay to avoid rate limiting
  await new Promise(r => setTimeout(r, 500));
}

console.log(`\nSubmitted ${tasks.length} tasks. Downloading as they complete...`);

let completed = 0;
for (const task of tasks) {
  const url = await waitForTask(task.taskId);
  const num = String(task.num).padStart(2, "0");
  if (url) {
    const img = await fetch(url);
    const outPath = `${charDir}/scenes/${name}-video-${num}.png`;
    await Bun.write(outPath, await img.arrayBuffer());
    completed++;
    console.log(`  ${num}: saved (${task.setting})`);
  } else {
    console.log(`  ${num}: failed`);
  }
}

console.log(`\nDone. ${completed}/${count} images generated.`);
