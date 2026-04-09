import type { VideoSpec } from "../../types/index.js";
import type { LintResult, LintRule } from "../types.js";

export const vl002SubjectConsistency: LintRule = {
  id: "VL002",
  name: "Subject Consistency",
  run(spec: VideoSpec): LintResult[] {
    const results: LintResult[] = [];
    const allSubjectIds = new Set<string>();
    const subjectIdLocations = new Map<string, string>();
    const multiSceneSubjects = new Map<string, number>();

    const sceneEntries = spec.timeline.filter((e) => e.type === "scene");

    for (const entry of sceneEntries) {
      if (!entry.scene) continue;
      const subjects = entry.scene.subjects ?? [];

      // Check for unique subject IDs
      for (const subject of subjects) {
        const key = subject.id;
        if (allSubjectIds.has(key)) {
          // Same subject appearing in multiple scenes — track for reference image check
          multiSceneSubjects.set(key, (multiSceneSubjects.get(key) ?? 1) + 1);
        } else {
          allSubjectIds.add(key);
          subjectIdLocations.set(key, `timeline.${entry.id}.scene.subjects`);
        }
      }

      // Check that subjects referenced in keyframe descriptions are declared
      const declaredSubjectNames = new Set(subjects.map((s) => s.name.toLowerCase()));
      const declaredSubjectIds = new Set(subjects.map((s) => s.id.toLowerCase()));

      for (let i = 0; i < entry.scene.keyframes.length; i++) {
        const kf = entry.scene.keyframes[i];
        const desc = kf.description.toLowerCase();

        // Check if any subject from other scenes is referenced but not declared here
        for (const [subId] of subjectIdLocations) {
          if (
            desc.includes(subId.toLowerCase()) &&
            !declaredSubjectIds.has(subId.toLowerCase()) &&
            !declaredSubjectNames.has(subId.toLowerCase())
          ) {
            results.push({
              rule: "VL002",
              severity: "warning",
              message: `Keyframe references subject "${subId}" which is not declared in this scene's subjects`,
              location: `timeline.${entry.id}.scene.keyframes[${i}]`,
            });
          }
        }
      }
    }

    // Check that multi-scene subjects have reference images
    for (const entry of sceneEntries) {
      if (!entry.scene?.subjects) continue;
      for (const subject of entry.scene.subjects) {
        if ((multiSceneSubjects.get(subject.id) ?? 0) > 1 && !subject.referenceImageUrl) {
          results.push({
            rule: "VL002",
            severity: "warning",
            message: `Subject "${subject.name}" (${subject.id}) appears in multiple scenes but has no referenceImageUrl for consistency`,
            location: `timeline.${entry.id}.scene.subjects.${subject.id}`,
          });
        }
      }
    }

    // Check subject IDs are unique within the entire spec
    const idCounts = new Map<string, string[]>();
    for (const entry of sceneEntries) {
      if (!entry.scene?.subjects) continue;
      for (const subject of entry.scene.subjects) {
        const locs = idCounts.get(subject.id) ?? [];
        locs.push(entry.id);
        idCounts.set(subject.id, locs);
      }
    }
    for (const [subId, locs] of idCounts) {
      if (locs.length > 1) {
        // Only flag if descriptions differ (same ID with different descriptions suggests a mistake)
        const descs = new Set<string>();
        for (const loc of locs) {
          const entry = sceneEntries.find((e) => e.id === loc);
          const subject = entry?.scene?.subjects?.find((s) => s.id === subId);
          if (subject) descs.add(subject.description);
        }
        if (descs.size > 1) {
          results.push({
            rule: "VL002",
            severity: "warning",
            message: `Subject "${subId}" has different descriptions across scenes [${locs.join(", ")}] — ensure consistency`,
            location: `subjects.${subId}`,
          });
        }
      }
    }

    return results;
  },
};
