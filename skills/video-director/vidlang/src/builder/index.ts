import type {
  VideoSpec,
  CanvasConfig,
  GlobalStyles,
  TransitionSpec,
  TimelineEntry,
  AudioTrack,
} from "../types/index.js";
import { SceneBuilder } from "./scene-builder.js";
import { AudioBuilder } from "./audio-builder.js";
import { lintSpec } from "../lint/index.js";

export { SceneBuilder } from "./scene-builder.js";
export { AudioBuilder } from "./audio-builder.js";

function validateSpec(spec: VideoSpec): string[] {
  const errors: string[] = [];

  if (!spec.id || typeof spec.id !== "string") errors.push("id: required string");
  if (spec.version !== "1.0") errors.push("version: must be '1.0'");
  if (!spec.metadata?.title) errors.push("metadata.title: required");
  if (!spec.canvas) {
    errors.push("canvas: required");
  } else {
    if (!spec.canvas.width || !spec.canvas.height) errors.push("canvas: width and height required");
    if (!spec.canvas.fps) errors.push("canvas.fps: required");
    if (!spec.canvas.aspectRatio) errors.push("canvas.aspectRatio: required");
    if (!spec.canvas.duration || spec.canvas.duration <= 0) errors.push("canvas.duration: must be positive");
  }
  if (!Array.isArray(spec.timeline) || spec.timeline.length === 0) {
    errors.push("timeline: must be a non-empty array");
  } else {
    for (let i = 0; i < spec.timeline.length; i++) {
      const entry = spec.timeline[i];
      if (!entry.id) errors.push(`timeline[${i}].id: required`);
      if (entry.type !== "scene" && entry.type !== "transition") errors.push(`timeline[${i}].type: must be 'scene' or 'transition'`);
      if (typeof entry.duration !== "number" || entry.duration <= 0) errors.push(`timeline[${i}].duration: must be positive`);
      if (entry.type === "scene" && entry.scene) {
        if (!entry.scene.description) errors.push(`timeline[${i}].scene.description: required`);
        if (!Array.isArray(entry.scene.keyframes)) errors.push(`timeline[${i}].scene.keyframes: must be an array`);
      }
    }
  }

  return errors;
}

export class VideoBuilder {
  private _id: string;
  private _canvas?: CanvasConfig;
  private _globalStyles?: GlobalStyles;
  private _timeline: TimelineEntry[] = [];
  private _audio: AudioTrack[] = [];
  private _currentTime = 0;
  private _metadata: { title: string; description?: string; tags?: string[]; author?: string };

  constructor(id: string) {
    this._id = id;
    this._metadata = { title: id };
  }

  metadata(meta: { title?: string; description?: string; tags?: string[]; author?: string }): this {
    if (meta.title) this._metadata.title = meta.title;
    if (meta.description) this._metadata.description = meta.description;
    if (meta.tags) this._metadata.tags = meta.tags;
    if (meta.author) this._metadata.author = meta.author;
    return this;
  }

  canvas(config: CanvasConfig): this {
    this._canvas = config;
    return this;
  }

  style(styles: GlobalStyles): this {
    this._globalStyles = styles;
    return this;
  }

  scene(id: string, builder: (scene: SceneBuilder) => SceneBuilder): this {
    const sceneBuilder = new SceneBuilder();
    builder(sceneBuilder);
    const sceneDuration = sceneBuilder.getDuration();

    this._timeline.push({
      id,
      type: "scene",
      startTime: this._currentTime,
      duration: sceneDuration,
      scene: sceneBuilder.toSpec(),
    });

    this._currentTime += sceneDuration;
    return this;
  }

  transition(spec: TransitionSpec): this {
    const transId = `transition-${this._timeline.length}`;
    this._timeline.push({
      id: transId,
      type: "transition",
      startTime: this._currentTime - spec.duration,
      duration: spec.duration,
      transition: spec,
    });
    return this;
  }

  audio(builder: (audio: AudioBuilder) => AudioBuilder): this {
    const audioBuilder = new AudioBuilder();
    builder(audioBuilder);
    this._audio.push(...audioBuilder.getTracks());
    return this;
  }

  build(): VideoSpec {
    if (!this._canvas) {
      throw new Error("Canvas config is required. Call .canvas() before .build()");
    }

    const spec: VideoSpec = {
      id: this._id,
      version: "1.0",
      metadata: this._metadata,
      canvas: this._canvas,
      timeline: this._timeline,
      audio: this._audio.length > 0 ? this._audio : undefined,
      globalStyles: this._globalStyles,
    };

    // Validate structure
    const errors = validateSpec(spec);
    if (errors.length > 0) {
      throw new Error(`VideoSpec validation failed:\n${errors.map(e => `  - ${e}`).join("\n")}`);
    }

    // Run lint rules
    const lintResults = lintSpec(spec);
    const lintErrors = lintResults.filter((r) => r.severity === "error");
    if (lintErrors.length > 0) {
      const msgs = lintErrors.map((e) => `  - [${e.rule}] ${e.message} (${e.location})`).join("\n");
      throw new Error(`Lint errors found:\n${msgs}`);
    }

    return spec;
  }
}

export const vidlang = {
  create(id: string): VideoBuilder {
    return new VideoBuilder(id);
  },
};
