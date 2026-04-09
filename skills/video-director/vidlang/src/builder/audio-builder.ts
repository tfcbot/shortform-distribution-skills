import type { AudioTrack } from "../types/index.js";

let audioIdCounter = 0;

interface AudioEntryOpts {
  prompt?: string;
  url?: string;
  text?: string;
  voice?: string;
  startTime: number;
  duration: number;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
}

export class AudioBuilder {
  private _tracks: AudioTrack[] = [];

  voiceover(opts: AudioEntryOpts): this {
    audioIdCounter++;
    this._tracks.push({
      id: `voiceover-${audioIdCounter}`,
      type: "voiceover",
      startTime: opts.startTime,
      duration: opts.duration,
      source: {
        type: opts.text ? "tts" : opts.url ? "url" : "generated",
        text: opts.text,
        voice: opts.voice,
        url: opts.url,
        prompt: opts.prompt,
      },
      volume: opts.volume,
      fadeIn: opts.fadeIn,
      fadeOut: opts.fadeOut,
    });
    return this;
  }

  music(opts: AudioEntryOpts): this {
    audioIdCounter++;
    this._tracks.push({
      id: `music-${audioIdCounter}`,
      type: "music",
      startTime: opts.startTime,
      duration: opts.duration,
      source: {
        type: opts.url ? "url" : "generated",
        url: opts.url,
        prompt: opts.prompt,
      },
      volume: opts.volume,
      fadeIn: opts.fadeIn,
      fadeOut: opts.fadeOut,
    });
    return this;
  }

  sfx(opts: AudioEntryOpts): this {
    audioIdCounter++;
    this._tracks.push({
      id: `sfx-${audioIdCounter}`,
      type: "sfx",
      startTime: opts.startTime,
      duration: opts.duration,
      source: {
        type: opts.url ? "url" : "generated",
        url: opts.url,
        prompt: opts.prompt,
      },
      volume: opts.volume,
      fadeIn: opts.fadeIn,
      fadeOut: opts.fadeOut,
    });
    return this;
  }

  ambient(opts: AudioEntryOpts): this {
    audioIdCounter++;
    this._tracks.push({
      id: `ambient-${audioIdCounter}`,
      type: "ambient",
      startTime: opts.startTime,
      duration: opts.duration,
      source: {
        type: opts.url ? "url" : "generated",
        url: opts.url,
        prompt: opts.prompt,
      },
      volume: opts.volume,
      fadeIn: opts.fadeIn,
      fadeOut: opts.fadeOut,
    });
    return this;
  }

  getTracks(): AudioTrack[] {
    return this._tracks;
  }
}
