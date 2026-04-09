import type { VidLangConfig } from "./src/lint/config.js";

/**
 * Default VidLang configuration — all rules enabled with built-in severities.
 * This is the base config shipped with the framework.
 *
 * Rules:
 *   VL001  Temporal Continuity       error/warning
 *   VL002  Subject Consistency        warning
 *   VL003  Camera Physics             warning
 *   VL004  Audio Alignment            error
 *   VL005  Provider Compatibility     warning/error
 *   VL006  Description Quality        error/warning
 *   VL009  Expression Continuity      warning
 *   VL010  Audio Normalization        warning
 *   VL011  Prosody Control            error
 *   VL012  Anti-Emphasis              error
 *   VL013  Talking Head Stillness     error
 */
export default {} satisfies VidLangConfig;
