// ---- Camera Position ----
export interface CameraPosition {
  x: number;
  y: number;
  z: number;
  lookAt: { x: number; y: number; z: number };
}

// ---- Camera Spec ----
export type CameraMovement =
  | "static" | "pan_left" | "pan_right" | "tilt_up" | "tilt_down"
  | "dolly_in" | "dolly_out" | "orbit" | "tracking" | "handheld" | "crane";

export interface CameraSpec {
  movement: CameraMovement;
  focalLength?: number;
  aperture?: number;
  speed?: "slow" | "medium" | "fast";
  startPosition?: CameraPosition;
  endPosition?: CameraPosition;
}

// ---- Lighting ----
export interface LightSource {
  type: "natural" | "artificial" | "practical" | "rim" | "key" | "fill";
  direction?: "front" | "back" | "left" | "right" | "top" | "bottom";
  intensity?: number;
  color?: string;
}

export interface LightingSpec {
  timeOfDay?: "dawn" | "morning" | "noon" | "afternoon" | "golden_hour" | "dusk" | "night";
  mood?: "bright" | "moody" | "dramatic" | "soft" | "harsh" | "neon" | "warm" | "cool";
  sources?: LightSource[];
}

// ---- Subject ----
export interface Subject {
  id: string;
  name: string;
  type: "person" | "animal" | "object" | "vehicle" | "text_overlay";
  description: string;
  action?: string;
  position?: "center" | "left" | "right" | "background" | "foreground";
  referenceImageUrl?: string;
}

// ---- Motion Spec ----
export interface MotionSpec {
  intensity: "minimal" | "subtle" | "moderate" | "dynamic" | "extreme";
  type?: "natural" | "cinematic" | "animated" | "timelapse" | "slowmo";
  motionBlur?: boolean;
}

// ---- Audio ----
export interface AudioSource {
  type: "tts" | "url" | "generated";
  text?: string;
  voice?: string;
  url?: string;
  prompt?: string;
}

export interface AudioTrack {
  id: string;
  type: "voiceover" | "music" | "sfx" | "ambient";
  startTime: number;
  duration: number;
  source: AudioSource;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
}

export interface SceneAudio {
  voiceover?: AudioTrack;
  music?: AudioTrack;
  sfx?: AudioTrack[];
}

// ---- Transition ----
export type TransitionType =
  | "cut" | "crossfade" | "dissolve" | "wipe_left" | "wipe_right"
  | "zoom_in" | "zoom_out" | "fade_black" | "fade_white" | "morph";

export interface TransitionSpec {
  type: TransitionType;
  duration: number;
  easing?: "linear" | "ease_in" | "ease_out" | "ease_in_out";
}

// ---- Provider Hint ----
export type ProviderName = "wavespeed" | "ltx" | "kling" | "sora" | "veo";

export interface ProviderHint {
  preferred: ProviderName;
  fallback?: ProviderName[];
  quality?: "draft" | "standard" | "high" | "ultra";
  speed?: "fast" | "balanced" | "quality";
}

// ---- Environment ----
export interface EnvironmentSpec {
  setting?: string;
  weather?: string;
  time?: string;
}

// ---- Keyframe ----
export interface Keyframe {
  time: number;
  type: "start" | "mid" | "end";
  description: string;
  imageUrl?: string;
  embedding?: number[];
  camera?: CameraPosition;
}

// ---- Scene Spec ----
// Production fields (dialogue, prosody, startExpression) are allowed via index signature
export interface SceneSpec {
  description: string;
  keyframes: Keyframe[];
  camera?: CameraSpec;
  lighting?: LightingSpec;
  subjects?: Subject[];
  environment?: EnvironmentSpec;
  motion?: MotionSpec;
  audio?: SceneAudio;
  provider?: ProviderHint;
  [key: string]: unknown; // passthrough for production fields
}

// ---- Timeline Entry ----
export interface TimelineEntry {
  id: string;
  type: "scene" | "transition";
  startTime: number;
  duration: number;
  scene?: SceneSpec;
  transition?: TransitionSpec;
}

// ---- Canvas Config ----
export type SupportedFps = 24 | 25 | 30 | 48 | 50 | 60;

export interface CanvasConfig {
  width: number;
  height: number;
  fps: SupportedFps;
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:3";
  colorSpace?: "sRGB" | "rec709" | "rec2020";
  duration: number;
}

// ---- Global Styles ----
export interface ColorGrading {
  preset?: "cinematic" | "vintage" | "vibrant" | "desaturated" | "noir" | "warm" | "cool";
  temperature?: number;
  contrast?: number;
  saturation?: number;
}

export interface GlobalStyles {
  colorGrading?: ColorGrading;
  defaultTransition?: TransitionSpec;
  style?: "photorealistic" | "cinematic" | "animation" | "anime" | "watercolor" | "oil_painting";
}

// ---- Video Metadata ----
export interface VideoMetadata {
  title: string;
  description?: string;
  tags?: string[];
  author?: string;
}

// ---- VideoSpec (Top-level) ----
export interface VideoSpec {
  id: string;
  version: "1.0";
  metadata: VideoMetadata;
  canvas: CanvasConfig;
  timeline: TimelineEntry[];
  audio?: AudioTrack[];
  globalStyles?: GlobalStyles;
}

// ---- Verification Result ----
export interface VerificationResult {
  passed: boolean;
  overallScore: number;
  textVideoAlignment: number;
  keyframeScores: Array<{ keyframeId: string; score: number }>;
  suggestions?: string[];
}
