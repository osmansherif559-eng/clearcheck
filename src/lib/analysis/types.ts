export const RULESET_VERSION = "1.0.0";

export type AnalysisMode = "auto" | "message" | "url";
export type ResolvedMode = "message" | "url";
export type Assessment = "high_concern" | "needs_caution" | "no_major_indicators";
export type Severity = "high" | "medium" | "low";

export interface Observation {
  id: string;
  label: string;
  value: string;
}

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  evidence: string;
  explanation: string;
  action: string;
  limitations?: string;
}

export interface AnalysisResult {
  assessment: Assessment;
  summary: string;
  mode: ResolvedMode;
  findings: Finding[];
  observations: Observation[];
  unknowns: string[];
  recommendedActions: string[];
  rulesetVersion: string;
}

export class AnalysisInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalysisInputError";
  }
}
