import { resolve, dirname } from "node:path";
import type { LintRule, LintResult } from "./types.js";

// --- Config Types ---

export interface RuleOverride {
  enabled?: boolean;
  severity?: "error" | "warning" | "info";
}

export interface VidLangConfig {
  rules?: Record<string, boolean | RuleOverride>;
}

// --- Config Validation ---

function validateConfig(raw: unknown): VidLangConfig {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;

  if (!obj.rules || typeof obj.rules !== "object") return {};

  const rules: Record<string, boolean | RuleOverride> = {};
  for (const [key, value] of Object.entries(obj.rules as Record<string, unknown>)) {
    if (typeof value === "boolean") {
      rules[key] = value;
    } else if (value && typeof value === "object") {
      const override: RuleOverride = {};
      const v = value as Record<string, unknown>;
      if (typeof v.enabled === "boolean") override.enabled = v.enabled;
      if (v.severity === "error" || v.severity === "warning" || v.severity === "info") {
        override.severity = v.severity;
      }
      rules[key] = override;
    }
  }

  return { rules };
}

// --- Config Loading ---

const CONFIG_FILENAMES = ["vidlang.config.ts", "vidlang.config.js", "vidlang.config.json"];

export async function loadConfig(startDir?: string): Promise<VidLangConfig> {
  const dir = startDir ?? process.cwd();
  let current = resolve(dir);
  const root = resolve("/");

  while (current !== root) {
    for (const filename of CONFIG_FILENAMES) {
      const configPath = resolve(current, filename);
      try {
        const file = Bun.file(configPath);
        if (await file.exists()) {
          if (filename.endsWith(".json")) {
            const raw = await file.json();
            return validateConfig(raw);
          }
          const mod = await import(configPath);
          const config = mod.default ?? mod;
          return validateConfig(config);
        }
      } catch {
        continue;
      }
    }
    current = dirname(current);
  }

  return {};
}

// --- Rule Filtering ---

function isRuleEnabled(config: VidLangConfig, ruleId: string): boolean {
  const override = config.rules?.[ruleId];
  if (override === undefined) return true;
  if (typeof override === "boolean") return override;
  return override.enabled !== false;
}

export function resolveRules(allRules: LintRule[], config: VidLangConfig): LintRule[] {
  return allRules.filter((rule) => isRuleEnabled(config, rule.id));
}

// --- Severity Overrides ---

export function applySeverityOverrides(results: LintResult[], config: VidLangConfig): LintResult[] {
  if (!config.rules) return results;

  return results.map((result) => {
    const override = config.rules![result.rule];
    if (!override || typeof override === "boolean") return result;
    if (override.severity) {
      return { ...result, severity: override.severity };
    }
    return result;
  });
}
