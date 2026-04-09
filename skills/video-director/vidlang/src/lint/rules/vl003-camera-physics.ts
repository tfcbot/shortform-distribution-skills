import type { VideoSpec } from "../../types/index.js";
import type { LintResult, LintRule } from "../types.js";

export const vl003CameraPhysics: LintRule = {
  id: "VL003",
  name: "Camera Physics",
  run(spec: VideoSpec): LintResult[] {
    const results: LintResult[] = [];

    const sceneEntries = spec.timeline.filter((e) => e.type === "scene");

    for (const entry of sceneEntries) {
      if (!entry.scene?.camera) continue;
      const cam = entry.scene.camera;

      // Check that camera movements are physically plausible (no teleporting)
      if (cam.startPosition && cam.endPosition) {
        const dx = cam.endPosition.x - cam.startPosition.x;
        const dy = cam.endPosition.y - cam.startPosition.y;
        const dz = cam.endPosition.z - cam.startPosition.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // If distance is very large relative to duration, it's implausible
        const maxSpeedPerSecond = cam.speed === "fast" ? 50 : cam.speed === "medium" ? 30 : 15;
        const maxDistance = maxSpeedPerSecond * entry.duration;
        if (distance > maxDistance) {
          results.push({
            rule: "VL003",
            severity: "warning",
            message: `Camera moves ${distance.toFixed(1)} units in ${entry.duration}s (max plausible: ${maxDistance} units at ${cam.speed ?? "slow"} speed)`,
            location: `timeline.${entry.id}.scene.camera`,
          });
        }
      }

      // Check focal length changes within a scene should be gradual
      const keyframes = entry.scene.keyframes;
      if (keyframes.length >= 2) {
        for (let i = 1; i < keyframes.length; i++) {
          const prevCam = keyframes[i - 1].camera;
          const currCam = keyframes[i].camera;
          // Keyframe cameras don't have focalLength directly, but we check position jumps
          if (prevCam && currCam) {
            const posDist = Math.sqrt(
              (currCam.x - prevCam.x) ** 2 +
              (currCam.y - prevCam.y) ** 2 +
              (currCam.z - prevCam.z) ** 2,
            );
            const timeDiff = keyframes[i].time - keyframes[i - 1].time;
            if (timeDiff > 0 && posDist / timeDiff > 100) {
              results.push({
                rule: "VL003",
                severity: "warning",
                message: `Camera position jumps ${posDist.toFixed(1)} units between keyframes ${i - 1} and ${i} — consider more gradual movement`,
                location: `timeline.${entry.id}.scene.keyframes[${i}].camera`,
              });
            }
          }
        }
      }

      // Handheld camera can't have precise tracking movements
      if (cam.movement === "handheld") {
        if (cam.startPosition && cam.endPosition) {
          results.push({
            rule: "VL003",
            severity: "warning",
            message: `Handheld camera has precise start/end positions — handheld movement is inherently imprecise`,
            location: `timeline.${entry.id}.scene.camera`,
          });
        }
      }

      // Focal length sanity checks
      if (cam.focalLength !== undefined) {
        if (cam.focalLength < 8 || cam.focalLength > 800) {
          results.push({
            rule: "VL003",
            severity: "warning",
            message: `Focal length ${cam.focalLength}mm is outside typical range (8-800mm)`,
            location: `timeline.${entry.id}.scene.camera.focalLength`,
          });
        }
      }
    }

    // Check focal length changes between consecutive scenes
    for (let i = 1; i < sceneEntries.length; i++) {
      const prevCam = sceneEntries[i - 1].scene?.camera;
      const currCam = sceneEntries[i].scene?.camera;
      if (prevCam?.focalLength && currCam?.focalLength) {
        const change = Math.abs(currCam.focalLength - prevCam.focalLength);
        if (change > 100) {
          results.push({
            rule: "VL003",
            severity: "info",
            message: `Large focal length change (${prevCam.focalLength}mm → ${currCam.focalLength}mm) between scenes "${sceneEntries[i - 1].id}" and "${sceneEntries[i].id}"`,
            location: `timeline.${sceneEntries[i].id}.scene.camera.focalLength`,
          });
        }
      }
    }

    return results;
  },
};
