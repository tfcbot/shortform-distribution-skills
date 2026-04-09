import type {
  SceneSpec,
  Keyframe,
  CameraSpec,
  LightingSpec,
  Subject,
  MotionSpec,
  ProviderHint,
  EnvironmentSpec,
} from "../types/index.js";

export class SceneBuilder {
  private _duration = 0;
  private _description = "";
  private _keyframes: Keyframe[] = [];
  private _camera?: CameraSpec;
  private _lighting?: LightingSpec;
  private _subjects: Subject[] = [];
  private _motion?: MotionSpec;
  private _provider?: ProviderHint;
  private _environment?: EnvironmentSpec;

  duration(seconds: number): this {
    this._duration = seconds;
    return this;
  }

  description(desc: string): this {
    this._description = desc;
    return this;
  }

  subject(subject: Subject): this {
    this._subjects.push(subject);
    return this;
  }

  keyframe(time: number, type: "start" | "mid" | "end", description: string, imageUrl?: string): this {
    this._keyframes.push({ time, type, description, imageUrl });
    return this;
  }

  camera(spec: CameraSpec): this {
    this._camera = spec;
    return this;
  }

  lighting(spec: LightingSpec): this {
    this._lighting = spec;
    return this;
  }

  motion(spec: MotionSpec): this {
    this._motion = spec;
    return this;
  }

  provider(hint: ProviderHint): this {
    this._provider = hint;
    return this;
  }

  environment(env: EnvironmentSpec): this {
    this._environment = env;
    return this;
  }

  getDuration(): number {
    return this._duration;
  }

  toSpec(): SceneSpec {
    return {
      description: this._description,
      keyframes: this._keyframes,
      camera: this._camera,
      lighting: this._lighting,
      subjects: this._subjects.length > 0 ? this._subjects : undefined,
      environment: this._environment,
      motion: this._motion,
      provider: this._provider,
    };
  }
}
