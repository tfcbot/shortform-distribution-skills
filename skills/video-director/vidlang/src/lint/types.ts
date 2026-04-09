export interface LintResult {
  rule: string;
  severity: "error" | "warning" | "info";
  message: string;
  location: string;
}

export interface LintRule {
  id: string;
  name: string;
  run(spec: import("../types/index.js").VideoSpec): LintResult[];
}
