import type { VidLangConfig } from "./vidlang/src/lint/config.js";

/**
 * Video-director rule configuration.
 *
 * All rules are enabled by default (opt-out model).
 * Override individual rules by ID:
 *
 *   false                        → disable entirely
 *   { enabled: false }           → disable entirely
 *   { severity: "warning" }      → override default severity
 *
 * Example:
 *   rules: {
 *     "VL005": false,                       // skip provider compat checks
 *     "VL013": { severity: "warning" },     // demote stillness to warning
 *     "VL003": { enabled: false },          // skip camera physics
 *   }
 */
export default {
  rules: {},
} satisfies VidLangConfig;
