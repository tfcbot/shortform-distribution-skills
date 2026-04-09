import type { VideoSpec } from "../../types/index.js";
import type { LintResult, LintRule } from "../types.js";

const ACRONYM_ALLOWLIST = new Set([
  "URL", "API", "CDN", "TTS", "STS", "STT", "FFM", "QA",
  "UGC", "DTC", "B2C", "SAAS", "CTA", "SEO", "ROI",
  "POV", "OOTD", "GRWM", "FYP", "DIY", "FAQ", "PDF",
  "USB", "LED", "LCD", "GPS", "CEO", "CFO", "CTO",
  "USA", "NYC", "THE", "AND", "FOR", "NOT",
]);

const ALL_CAPS_PATTERN = /\b[A-Z]{3,}\b/g;

function findAllCaps(text: string): string[] {
  const matches = text.match(ALL_CAPS_PATTERN) ?? [];
  return matches.filter((m) => !ACRONYM_ALLOWLIST.has(m));
}

export const vl012AntiEmphasis: LintRule = {
  id: "VL012",
  name: "Anti-Emphasis",
  run(spec: VideoSpec): LintResult[] {
    const results: LintResult[] = [];
    const sceneEntries = spec.timeline.filter((e) => e.type === "scene");

    for (const entry of sceneEntries) {
      if (!entry.scene) continue;

      // Check scene description
      const descCaps = findAllCaps(entry.scene.description);
      for (const word of descCaps) {
        results.push({
          rule: "VL012",
          severity: "error",
          message: `Scene "${entry.id}" description contains ALL-CAPS word "${word}" — AI models interpret this as shouting. Use natural casing.`,
          location: `timeline.${entry.id}.scene.description`,
        });
      }

      // Check keyframe descriptions
      for (let i = 0; i < entry.scene.keyframes.length; i++) {
        const kf = entry.scene.keyframes[i];
        const kfCaps = findAllCaps(kf.description);
        for (const word of kfCaps) {
          results.push({
            rule: "VL012",
            severity: "error",
            message: `Keyframe ${i} in scene "${entry.id}" contains ALL-CAPS word "${word}" — use natural casing`,
            location: `timeline.${entry.id}.scene.keyframes[${i}].description`,
          });
        }
      }

      // Check TTS text
      const ttsText = entry.scene.audio?.voiceover?.source?.text;
      if (ttsText) {
        const ttsCaps = findAllCaps(ttsText);
        for (const word of ttsCaps) {
          results.push({
            rule: "VL012",
            severity: "error",
            message: `TTS text in scene "${entry.id}" contains ALL-CAPS word "${word}" — use natural casing`,
            location: `timeline.${entry.id}.scene.audio.voiceover.source.text`,
          });
        }
      }

      // Check passthrough dialogue field
      const dialogue = (entry.scene as Record<string, unknown>).dialogue;
      if (typeof dialogue === "string") {
        const dialogueCaps = findAllCaps(dialogue);
        for (const word of dialogueCaps) {
          results.push({
            rule: "VL012",
            severity: "error",
            message: `Dialogue in scene "${entry.id}" contains ALL-CAPS word "${word}" — use natural casing`,
            location: `timeline.${entry.id}.scene.dialogue`,
          });
        }
      }
    }

    return results;
  },
};
