import type { VideoSpec } from "../../types/index.js";
import type { LintResult, LintRule } from "../types.js";

const PROSODY_KEYWORDS = [
  "casual", "conversational", "natural", "relaxed",
  "no emphasis", "no dramatic", "don't stress",
  "talking to a friend", "laid back", "easy pace",
  "matter of fact", "even tone", "steady pace",
];

export const vl011ProsodyControl: LintRule = {
  id: "VL011",
  name: "Prosody Control",
  run(spec: VideoSpec): LintResult[] {
    const results: LintResult[] = [];
    const sceneEntries = spec.timeline.filter((e) => e.type === "scene");

    for (const entry of sceneEntries) {
      if (!entry.scene) continue;

      const desc = entry.scene.description.toLowerCase();

      // Check for prosody in scene-level audio TTS text
      const ttsText = entry.scene.audio?.voiceover?.source?.text?.toLowerCase() ?? "";

      // Check passthrough prosody field
      const prosody = (entry.scene as Record<string, unknown>).prosody;
      const prosodyText = typeof prosody === "string" ? prosody.toLowerCase() : "";

      const combined = `${desc} ${ttsText} ${prosodyText}`;
      const hasProsody = PROSODY_KEYWORDS.some((kw) => combined.includes(kw));

      if (!hasProsody) {
        results.push({
          rule: "VL011",
          severity: "error",
          message: `Scene "${entry.id}" has no prosody instructions — add anti-robot cues like "casual pace, conversational, no dramatic emphasis"`,
          location: `timeline.${entry.id}.scene`,
        });
      }
    }

    return results;
  },
};
