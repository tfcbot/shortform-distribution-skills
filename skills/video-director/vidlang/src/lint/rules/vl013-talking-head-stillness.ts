import type { VideoSpec } from "../../types/index.js";
import type { LintResult, LintRule } from "../types.js";

const MOTION_PHRASES = [
  "leans forward", "leans back", "leans in",
  "sits back", "sits up", "sits down",
  "stands up", "stands down",
  "gestures", "gesturing", "hand gesture",
  "nods", "nodding", "head nod",
  "waves", "waving",
  "walks", "walking", "walks toward",
  "turns around", "turning around",
  "looks away", "looking away", "looks down",
  "reaches", "reaching", "reaches for",
  "points", "pointing", "points at",
  "shrugs", "shrugging",
  "crosses arms", "crossing arms",
  "tilts head", "head tilt",
  "shifts weight", "shifting",
  "moves closer", "moves away",
  "steps forward", "steps back",
];

export const vl013TalkingHeadStillness: LintRule = {
  id: "VL013",
  name: "Talking Head Stillness",
  run(spec: VideoSpec): LintResult[] {
    const results: LintResult[] = [];
    const sceneEntries = spec.timeline.filter((e) => e.type === "scene");

    for (const entry of sceneEntries) {
      if (!entry.scene) continue;

      const desc = entry.scene.description.toLowerCase();

      for (const phrase of MOTION_PHRASES) {
        if (desc.includes(phrase)) {
          results.push({
            rule: "VL013",
            severity: "error",
            message: `Scene "${entry.id}" description contains motion instruction "${phrase}" — talking head scenes must be still. Movement causes pose jumps between cuts.`,
            location: `timeline.${entry.id}.scene.description`,
          });
          break;
        }
      }

      // Check keyframe descriptions
      for (let i = 0; i < entry.scene.keyframes.length; i++) {
        const kf = entry.scene.keyframes[i];
        const kfDesc = kf.description.toLowerCase();

        for (const phrase of MOTION_PHRASES) {
          if (kfDesc.includes(phrase)) {
            results.push({
              rule: "VL013",
              severity: "error",
              message: `Keyframe ${i} in scene "${entry.id}" contains motion instruction "${phrase}" — keep still for talking head scenes`,
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
