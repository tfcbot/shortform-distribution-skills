import type { VideoSpec } from "../../types/index.js";
import type { LintResult, LintRule } from "../types.js";

const EXPRESSION_KEYWORDS = [
  "expression", "facial", "smiling", "frowning", "neutral",
  "grinning", "serious", "relaxed", "animated", "calm",
  "startexpression", "start expression", "matching previous",
  "continuing from", "same expression", "maintaining",
];

export const vl009ExpressionContinuity: LintRule = {
  id: "VL009",
  name: "Expression Continuity",
  run(spec: VideoSpec): LintResult[] {
    const results: LintResult[] = [];
    const sceneEntries = spec.timeline.filter((e) => e.type === "scene");

    if (sceneEntries.length <= 1) return results;

    for (let i = 1; i < sceneEntries.length; i++) {
      const entry = sceneEntries[i];
      if (!entry.scene) continue;

      const desc = entry.scene.description.toLowerCase();
      const firstKeyframe = entry.scene.keyframes[0]?.description?.toLowerCase() ?? "";
      const combined = `${desc} ${firstKeyframe}`;

      const hasExpressionRef = EXPRESSION_KEYWORDS.some((kw) => combined.includes(kw));

      if (!hasExpressionRef) {
        results.push({
          rule: "VL009",
          severity: "warning",
          message: `Scene "${entry.id}" (scene ${i + 1}) has no expression continuity reference from the previous scene — specify startExpression or describe facial continuity`,
          location: `timeline.${entry.id}.scene.description`,
        });
      }
    }

    return results;
  },
};
