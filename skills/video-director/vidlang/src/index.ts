// Main entry point — exports the public API

// Builder API (fluent interface)
export { vidlang, VideoBuilder, SceneBuilder, AudioBuilder } from "./builder/index.js";

// Types
export type {
  VideoSpec,
  CanvasConfig,
  TimelineEntry,
  SceneSpec,
  Keyframe,
  CameraSpec,
  CameraPosition,
  LightingSpec,
  LightSource,
  Subject,
  MotionSpec,
  AudioTrack,
  AudioSource,
  SceneAudio,
  TransitionSpec,
  ProviderHint,
  EnvironmentSpec,
  GlobalStyles,
  ColorGrading,
  VideoMetadata,
  VerificationResult,
} from "./types/index.js";

// Lint engine
export { lintSpec, lintSpecWithConfig, ALL_RULES } from "./lint/index.js";
export type { LintResult, LintRule } from "./lint/index.js";
export type { VidLangConfig } from "./lint/config.js";
export { loadConfig, resolveRules, applySeverityOverrides } from "./lint/config.js";
