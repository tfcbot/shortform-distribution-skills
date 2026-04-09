/**
 * Clone a voice from a video/audio file via ElevenLabs.
 * Saves the voice_id to the character's character.json.
 *
 * Usage:
 *   bun run marketing/scripts/clone-voice.ts <character-dir> <video-or-audio-path> [voice-name]
 *
 * Example:
 *   bun run marketing/scripts/clone-voice.ts \
 *     marketing/characters/maya \
 *     marketing/characters/maya/videos/maya-video-01-desk.mp4 \
 *     "Maya - AI Creative Lab"
 */

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY ?? Bun.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  console.error("ELEVENLABS_API_KEY not set.");
  process.exit(1);
}

const charDir = process.argv[2];
const inputPath = process.argv[3];
const voiceName = process.argv[4];

if (!charDir || !inputPath) {
  console.error("Usage: bun run clone-voice.ts <character-dir> <video-or-audio-path> [voice-name]");
  process.exit(1);
}

const character = await Bun.file(`${charDir}/character.json`).json();
const name = voiceName ?? `${character.name} - VidJutsu`;

// Extract audio if input is a video
let audioPath = inputPath;
if (inputPath.endsWith(".mp4") || inputPath.endsWith(".mov") || inputPath.endsWith(".webm")) {
  console.log("Extracting audio from video...");
  audioPath = `/tmp/voice-clone-${Date.now()}.wav`;
  await Bun.$`ffmpeg -i ${inputPath} -vn -acodec pcm_s16le -ar 44100 ${audioPath} -y 2>&1`;
}

console.log(`Cloning voice as "${name}"...`);

const form = new FormData();
form.append("name", name);
form.append("description", `AI character voice for ${character.name}. ${character.personality?.voice ?? ""}`);
form.append("files", Bun.file(audioPath));

const res = await fetch("https://api.elevenlabs.io/v1/voices/add", {
  method: "POST",
  headers: { "xi-api-key": ELEVENLABS_API_KEY },
  body: form,
});

const data = await res.json() as { voice_id?: string; detail?: unknown };

if (!data.voice_id) {
  console.error("Failed:", JSON.stringify(data.detail ?? data));
  process.exit(1);
}

console.log(`Voice cloned: ${data.voice_id}`);

// Save to character.json
character.voiceId = data.voice_id;
character.voiceProvider = "elevenlabs";
character.voiceName = name;
await Bun.write(`${charDir}/character.json`, JSON.stringify(character, null, 2));

console.log(`Updated ${charDir}/character.json`);

// Cleanup temp audio
if (audioPath !== inputPath) {
  await Bun.$`rm ${audioPath}`;
}
