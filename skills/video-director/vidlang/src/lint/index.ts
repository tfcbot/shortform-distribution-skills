import type { VideoSpec } from "../types/index.js";
import type { LintResult, LintRule } from "./types.js";
import { loadConfig, resolveRules, applySeverityOverrides } from "./config.js";
import type { VidLangConfig } from "./config.js";
import { vl001TemporalContinuity } from "./rules/vl001-temporal-continuity.js";
import { vl002SubjectConsistency } from "./rules/vl002-subject-consistency.js";
import { vl003CameraPhysics } from "./rules/vl003-camera-physics.js";
import { vl004AudioAlignment } from "./rules/vl004-audio-alignment.js";
import { vl005ProviderCompatibility } from "./rules/vl005-provider-compatibility.js";
import { vl006DescriptionQuality } from "./rules/vl006-description-quality.js";
import { vl009ExpressionContinuity } from "./rules/vl009-expression-continuity.js";
import { vl010AudioNormalization } from "./rules/vl010-audio-normalization.js";
import { vl011ProsodyControl } from "./rules/vl011-prosody-control.js";
import { vl012AntiEmphasis } from "./rules/vl012-anti-emphasis.js";
import { vl013TalkingHeadStillness } from "./rules/vl013-talking-head-stillness.js";

export type { LintResult, LintRule } from "./types.js";
export type { VidLangConfig } from "./config.js";
export { loadConfig, resolveRules, applySeverityOverrides } from "./config.js";

export const ALL_RULES: LintRule[] = [
  vl001TemporalContinuity,
  vl002SubjectConsistency,
  vl003CameraPhysics,
  vl004AudioAlignment,
  vl005ProviderCompatibility,
  vl006DescriptionQuality,
  vl009ExpressionContinuity,
  vl010AudioNormalization,
  vl011ProsodyControl,
  vl012AntiEmphasis,
  vl013TalkingHeadStillness,
];

export function lintSpec(spec: VideoSpec, rules?: LintRule[]): LintResult[] {
  const rulesToRun = rules ?? ALL_RULES;
  const results: LintResult[] = [];

  for (const rule of rulesToRun) {
    results.push(...rule.run(spec));
  }

  return results;
}

export async function lintSpecWithConfig(
  spec: VideoSpec,
  configPath?: string,
): Promise<LintResult[]> {
  const config = await loadConfig(configPath);
  const enabledRules = resolveRules(ALL_RULES, config);
  const results = lintSpec(spec, enabledRules);
  return applySeverityOverrides(results, config);
}
