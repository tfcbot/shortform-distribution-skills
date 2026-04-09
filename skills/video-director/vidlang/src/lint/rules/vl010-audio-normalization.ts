import type { VideoSpec } from "../../types/index.js";
import type { LintResult, LintRule } from "../types.js";

const NORMALIZATION_KEYWORDS = [
  "loudnorm", "normalized", "normalization", "lufs", "-16",
  "audio level", "volume match", "level match",
];

export const vl010AudioNormalization: LintRule = {
  id: "VL010",
  name: "Audio Normalization",
  run(spec: VideoSpec): LintResult[] {
    const results: LintResult[] = [];
    const sceneEntries = spec.timeline.filter((e) => e.type === "scene");

    if (sceneEntries.length <= 1) return results;

    const hasGlobalAudio = (spec.audio ?? []).length > 0;
    const metaDesc = spec.metadata.description?.toLowerCase() ?? "";
    const tags = (spec.metadata.tags ?? []).map((t) => t.toLowerCase());

    const hasNormRef =
      NORMALIZATION_KEYWORDS.some((kw) => metaDesc.includes(kw)) ||
      NORMALIZATION_KEYWORDS.some((kw) => tags.some((t) => t.includes(kw)));

    const scenesHaveConsistentVolume = sceneEntries.every((e) => {
      const vo = e.scene?.audio?.voiceover;
      return vo?.volume !== undefined;
    });

    if (!hasGlobalAudio && !hasNormRef && !scenesHaveConsistentVolume) {
      results.push({
        rule: "VL010",
        severity: "warning",
        message: `Multi-scene spec (${sceneEntries.length} scenes) has no audio normalization indicated — add loudnorm to post-production or set consistent volume levels`,
        location: "metadata",
      });
    }

    return results;
  },
};
