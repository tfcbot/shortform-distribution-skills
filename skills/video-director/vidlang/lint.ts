#!/usr/bin/env bun
/**
 * Lint a .vidlang.ts spec file.
 *
 * Usage:
 *   bun vidlang/lint.ts <spec-file> [--no-config]
 */

import { resolve } from "node:path";
import { lintSpec, lintSpecWithConfig } from "./src/lint/index.js";
import type { LintResult } from "./src/lint/types.js";

const file = process.argv[2];
const noConfig = process.argv.includes("--no-config");

if (!file) {
  console.error("Usage: bun vidlang/lint.ts <spec-file> [--no-config]");
  process.exit(1);
}

const absPath = resolve(file);
const mod = await import(absPath);
const spec = mod.default ?? mod.video ?? mod.spec;

if (!spec) {
  console.error(`No default/video/spec export found in ${file}`);
  process.exit(1);
}

const results: LintResult[] = noConfig
  ? lintSpec(spec)
  : await lintSpecWithConfig(spec);

if (results.length === 0) {
  console.log("No lint issues found");
  process.exit(0);
}

for (const r of results) {
  const icon = r.severity === "error" ? "ERR" : r.severity === "warning" ? "WARN" : "INFO";
  console.log(`  [${icon}] [${r.rule}] ${r.message}`);
  console.log(`    at ${r.location}`);
}

const errors = results.filter((r) => r.severity === "error");
const warnings = results.filter((r) => r.severity === "warning");
console.log(`\n  ${errors.length} error(s), ${warnings.length} warning(s)`);

if (errors.length > 0) process.exit(1);
