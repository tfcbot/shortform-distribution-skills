import type { VideoSpec } from "../../types/index.js";
import type { LintResult, LintRule } from "../types.js";

export const vl004AudioAlignment: LintRule = {
  id: "VL004",
  name: "Audio Alignment",
  run(spec: VideoSpec): LintResult[] {
    const results: LintResult[] = [];
    const videoDuration = spec.canvas.duration;

    const allAudioTracks = [...(spec.audio ?? [])];

    // Also gather scene-level audio
    for (const entry of spec.timeline) {
      if (entry.scene?.audio) {
        const sceneAudio = entry.scene.audio;
        if (sceneAudio.voiceover) allAudioTracks.push(sceneAudio.voiceover);
        if (sceneAudio.music) allAudioTracks.push(sceneAudio.music);
        if (sceneAudio.sfx) allAudioTracks.push(...sceneAudio.sfx);
      }
    }

    for (const track of allAudioTracks) {
      const trackEnd = track.startTime + track.duration;

      // Audio tracks must not exceed the video duration
      if (trackEnd > videoDuration + 0.01) {
        results.push({
          rule: "VL004",
          severity: "error",
          message: `Audio track "${track.id}" ends at ${trackEnd}s but video duration is ${videoDuration}s`,
          location: `audio.${track.id}`,
        });
      }

      // TTS source must have text
      if (track.source.type === "tts" && !track.source.text) {
        results.push({
          rule: "VL004",
          severity: "error",
          message: `Audio track "${track.id}" uses TTS source but has no text`,
          location: `audio.${track.id}.source`,
        });
      }

      // URL source must have url
      if (track.source.type === "url" && !track.source.url) {
        results.push({
          rule: "VL004",
          severity: "error",
          message: `Audio track "${track.id}" uses URL source but has no url`,
          location: `audio.${track.id}.source`,
        });
      }
    }

    // Check voiceover duration fits within its scene
    for (const entry of spec.timeline) {
      if (entry.type !== "scene" || !entry.scene?.audio?.voiceover) continue;
      const vo = entry.scene.audio.voiceover;
      if (vo.duration > entry.duration) {
        results.push({
          rule: "VL004",
          severity: "error",
          message: `Voiceover "${vo.id}" duration (${vo.duration}s) exceeds scene "${entry.id}" duration (${entry.duration}s)`,
          location: `timeline.${entry.id}.scene.audio.voiceover`,
        });
      }
    }

    return results;
  },
};
