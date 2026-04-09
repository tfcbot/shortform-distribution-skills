import type { VideoSpec } from "../../types/index.js";
import type { LintResult, LintRule } from "../types.js";

interface ProviderCapability {
  maxDuration: number;
  maxWidth: number;
  maxHeight: number;
  supportedFps: number[];
  name: string;
}

const PROVIDER_CAPS: Record<string, ProviderCapability> = {
  wavespeed: {
    maxDuration: 10,
    maxWidth: 1920,
    maxHeight: 1080,
    supportedFps: [24, 25, 30, 48, 50, 60],
    name: "WaveSpeed Wan 2.6",
  },
  ltx: {
    maxDuration: 20,
    maxWidth: 3840,
    maxHeight: 2160,
    supportedFps: [24, 25, 30, 48],
    name: "LTX-2.3",
  },
  kling: {
    maxDuration: 10,
    maxWidth: 1920,
    maxHeight: 1080,
    supportedFps: [24, 25, 30],
    name: "Kling 2.6",
  },
  sora: {
    maxDuration: 20,
    maxWidth: 1920,
    maxHeight: 1080,
    supportedFps: [24, 30],
    name: "Sora 2",
  },
  veo: {
    maxDuration: 8,
    maxWidth: 1920,
    maxHeight: 1080,
    supportedFps: [24],
    name: "Veo 3.1",
  },
};

export const vl005ProviderCompatibility: LintRule = {
  id: "VL005",
  name: "Provider Compatibility",
  run(spec: VideoSpec): LintResult[] {
    const results: LintResult[] = [];
    const { canvas } = spec;

    const sceneEntries = spec.timeline.filter((e) => e.type === "scene");

    for (const entry of sceneEntries) {
      if (!entry.scene?.provider) continue;
      const hint = entry.scene.provider;
      const providers = [hint.preferred, ...(hint.fallback ?? [])];

      let anyCompatible = false;

      for (const providerName of providers) {
        const caps = PROVIDER_CAPS[providerName];
        if (!caps) continue;

        // Check duration
        if (entry.duration > caps.maxDuration) {
          results.push({
            rule: "VL005",
            severity: "warning",
            message: `Scene "${entry.id}" duration (${entry.duration}s) exceeds ${caps.name} max (${caps.maxDuration}s)`,
            location: `timeline.${entry.id}.scene.provider.${providerName}`,
          });
        } else {
          anyCompatible = true;
        }

        // Check resolution — allow portrait orientation by comparing against max dimensions in either axis
        const maxLong = Math.max(caps.maxWidth, caps.maxHeight);
        const maxShort = Math.min(caps.maxWidth, caps.maxHeight);
        const canvasLong = Math.max(canvas.width, canvas.height);
        const canvasShort = Math.min(canvas.width, canvas.height);
        if (canvasLong > maxLong || canvasShort > maxShort) {
          results.push({
            rule: "VL005",
            severity: "warning",
            message: `Canvas resolution (${canvas.width}x${canvas.height}) exceeds ${caps.name} max (${caps.maxWidth}x${caps.maxHeight})`,
            location: `timeline.${entry.id}.scene.provider.${providerName}`,
          });
        }

        // Check FPS
        if (!caps.supportedFps.includes(canvas.fps)) {
          results.push({
            rule: "VL005",
            severity: "info",
            message: `Canvas FPS (${canvas.fps}) is not natively supported by ${caps.name} — may be upscaled`,
            location: `timeline.${entry.id}.scene.provider.${providerName}`,
          });
        }
      }

      // Error if no provider supports the configuration
      if (!anyCompatible && providers.length > 0) {
        results.push({
          rule: "VL005",
          severity: "error",
          message: `No provider supports scene "${entry.id}" with duration ${entry.duration}s — all providers exceed max duration`,
          location: `timeline.${entry.id}.scene.provider`,
        });
      }
    }

    return results;
  },
};
