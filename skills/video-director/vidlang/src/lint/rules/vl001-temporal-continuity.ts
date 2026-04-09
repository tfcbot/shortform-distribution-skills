import type { VideoSpec } from "../../types/index.js";
import type { LintResult, LintRule } from "../types.js";

export const vl001TemporalContinuity: LintRule = {
  id: "VL001",
  name: "Temporal Continuity",
  run(spec: VideoSpec): LintResult[] {
    const results: LintResult[] = [];

    const sceneEntries = spec.timeline.filter((e) => e.type === "scene");

    // Check keyframes within each scene are in ascending temporal order
    for (const entry of sceneEntries) {
      if (!entry.scene?.keyframes) continue;
      const keyframes = entry.scene.keyframes;
      for (let i = 1; i < keyframes.length; i++) {
        if (keyframes[i].time < keyframes[i - 1].time) {
          results.push({
            rule: "VL001",
            severity: "error",
            message: `Keyframe at index ${i} (time=${keyframes[i].time}) is before keyframe at index ${i - 1} (time=${keyframes[i - 1].time}) — keyframes must be in ascending order`,
            location: `timeline.${entry.id}.scene.keyframes[${i}]`,
          });
        }
      }
    }

    // Check scene start/end times do not overlap
    const sorted = [...sceneEntries].sort((a, b) => a.startTime - b.startTime);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const prevEnd = prev.startTime + prev.duration;
      if (curr.startTime < prevEnd) {
        results.push({
          rule: "VL001",
          severity: "error",
          message: `Scene "${curr.id}" (start=${curr.startTime}s) overlaps with scene "${prev.id}" (ends at ${prevEnd}s)`,
          location: `timeline.${curr.id}`,
        });
      }
    }

    // Check total timeline duration matches canvas.duration
    if (sceneEntries.length > 0) {
      const lastScene = sorted[sorted.length - 1];
      const timelineDuration = lastScene.startTime + lastScene.duration;
      if (Math.abs(timelineDuration - spec.canvas.duration) > 0.01) {
        results.push({
          rule: "VL001",
          severity: "warning",
          message: `Timeline duration (${timelineDuration}s) does not match canvas.duration (${spec.canvas.duration}s)`,
          location: "canvas.duration",
        });
      }
    }

    return results;
  },
};
