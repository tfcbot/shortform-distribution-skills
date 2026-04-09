import type { VideoSpec } from "../../types/index.js";
import type { LintResult, LintRule } from "../types.js";

const VAGUE_PATTERNS = [
  /\bsomething happens\b/i,
  /\bstuff moving\b/i,
  /\bthings happen\b/i,
  /\betc\.?\b/i,
  /\bwhatever\b/i,
  /\bsome stuff\b/i,
  /\bgeneric\b/i,
  /\bplaceholder\b/i,
  /\btodo\b/i,
  /\btbd\b/i,
  /\bfiller\b/i,
  /\bblah\b/i,
  /\basdf\b/i,
  /\bxyz\b/i,
];

export const vl006DescriptionQuality: LintRule = {
  id: "VL006",
  name: "Description Quality",
  run(spec: VideoSpec): LintResult[] {
    const results: LintResult[] = [];

    const sceneEntries = spec.timeline.filter((e) => e.type === "scene");

    for (const entry of sceneEntries) {
      if (!entry.scene) continue;

      // Scene descriptions must be >10 characters
      if (entry.scene.description.length <= 10) {
        results.push({
          rule: "VL006",
          severity: "error",
          message: `Scene "${entry.id}" description is too short (${entry.scene.description.length} chars, minimum 11)`,
          location: `timeline.${entry.id}.scene.description`,
        });
      }

      // Warn on vague scene descriptions
      for (const pattern of VAGUE_PATTERNS) {
        if (pattern.test(entry.scene.description)) {
          results.push({
            rule: "VL006",
            severity: "warning",
            message: `Scene "${entry.id}" description contains vague language: "${entry.scene.description.match(pattern)?.[0]}"`,
            location: `timeline.${entry.id}.scene.description`,
          });
          break;
        }
      }

      // Keyframe descriptions must be >5 characters
      for (let i = 0; i < entry.scene.keyframes.length; i++) {
        const kf = entry.scene.keyframes[i];
        if (kf.description.length <= 5) {
          results.push({
            rule: "VL006",
            severity: "error",
            message: `Keyframe ${i} in scene "${entry.id}" description is too short (${kf.description.length} chars, minimum 6)`,
            location: `timeline.${entry.id}.scene.keyframes[${i}].description`,
          });
        }

        // Warn on vague keyframe descriptions
        for (const pattern of VAGUE_PATTERNS) {
          if (pattern.test(kf.description)) {
            results.push({
              rule: "VL006",
              severity: "warning",
              message: `Keyframe ${i} in scene "${entry.id}" contains vague language: "${kf.description.match(pattern)?.[0]}"`,
              location: `timeline.${entry.id}.scene.keyframes[${i}].description`,
            });
            break;
          }
        }
      }
    }

    return results;
  },
};
