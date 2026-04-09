/**
 * Generate a 3x3 character reference sheet via KIE Nano Banana 2.
 *
 * Usage:
 *   bun run marketing/scripts/generate-reference-sheet.ts <character-dir>
 *
 * Example:
 *   bun run marketing/scripts/generate-reference-sheet.ts marketing/characters/maya
 *
 * Reads character.json from the directory, generates the reference sheet,
 * and saves it to reference-sheets/<name>-reference-3x3.png
 */

const KIE_API_KEY = process.env.KIE_API_KEY ?? Bun.env.KIE_API_KEY;
const KIE_BASE = "https://api.kie.ai/api/v1";

if (!KIE_API_KEY) {
  console.error("KIE_API_KEY not set. Source .env.local or set it.");
  process.exit(1);
}

const charDir = process.argv[2];
if (!charDir) {
  console.error("Usage: bun run generate-reference-sheet.ts <character-dir>");
  process.exit(1);
}

const character = await Bun.file(`${charDir}/character.json`).json();
const name = character.name.toLowerCase();

console.log(`Generating reference sheet for ${character.name}...`);

// Use the referencePrompt.base if it exists, otherwise build from appearance
const prompt = character.referencePrompt?.base ??
  `3x3 character reference sheet, 9 panels in a grid layout. Subject: ${character.promptBase}. Consistent face across all 9 panels, photorealistic, fashion editorial reference sheet style, shot on 35mm film. White background between panels, clean grid layout.`;

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
      aspect_ratio: "1:1",
      resolution: "2K",
      output_format: "png",
    },
  }),
});

const { data } = await res.json() as { data: { taskId: string } };
console.log(`Task submitted: ${data.taskId}`);

// Poll for completion
let result: string | null = null;
for (let i = 0; i < 30; i++) {
  await new Promise(r => setTimeout(r, 5000));

  const check = await fetch(`${KIE_BASE}/jobs/recordInfo?taskId=${data.taskId}`, {
    headers: { Authorization: `Bearer ${KIE_API_KEY}` },
  });
  const { data: taskData } = await check.json() as { data: { state: string; resultJson: string } };

  if (taskData.state === "success") {
    const parsed = JSON.parse(taskData.resultJson);
    result = parsed.resultUrls[0];
    break;
  } else if (taskData.state === "fail") {
    console.error("Generation failed");
    process.exit(1);
  }

  process.stdout.write(".");
}

if (!result) {
  console.error("\nTimed out waiting for generation");
  process.exit(1);
}

console.log(`\nDownloading...`);
const img = await fetch(result);
const outPath = `${charDir}/reference-sheets/${name}-reference-3x3.png`;
await Bun.write(outPath, await img.arrayBuffer());
console.log(`Saved: ${outPath}`);
console.log(`URL: ${result}`);
