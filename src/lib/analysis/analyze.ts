import { analyzeMessage } from "./message-rules";
import { analyzeUrl, analyzeUrlsInText } from "./url-analysis";
import { AnalysisInputError, RULESET_VERSION, type AnalyzedLink, type AnalysisMode, type AnalysisResult, type Finding, type Observation, type ResolvedMode } from "./types";
import { extractUrls, MAX_INPUT_LENGTH, uniqueStrings } from "./helpers";

export function validateInput(input: string, mode: AnalysisMode): string | undefined {
  if (!input.trim()) return "Paste a message or URL before analyzing.";
  if (input.length > MAX_INPUT_LENGTH) return `Please keep the input under ${MAX_INPUT_LENGTH.toLocaleString()} characters.`;
  if (mode === "url" && input.includes("\n")) return "URL mode accepts one direct URL. Use message mode for text containing links.";
  return undefined;
}

function resolveMode(input: string, mode: AnalysisMode): ResolvedMode {
  if (mode === "message" || mode === "url") return mode;
  const urls = extractUrls(input.trim());
  return urls.length === 1 && urls[0] === input.trim() ? "url" : "message";
}

function assessmentFor(findings: Finding[]): AnalysisResult["assessment"] {
  const high = findings.filter((finding) => finding.severity === "high").length;
  if (high >= 1) return "high_concern";
  if (findings.length > 0) return "needs_caution";
  return "no_major_indicators";
}

function summaryFor(assessment: AnalysisResult["assessment"], findingCount: number): string {
  if (assessment === "high_concern") return `${findingCount} evidence-linked warning${findingCount === 1 ? "" : "s"} deserve immediate caution.`;
  if (assessment === "needs_caution") return `${findingCount} meaningful signal${findingCount === 1 ? "" : "s"} should be independently checked before you act.`;
  return "The configured rules found no major warning signs. That does not prove the message or link is safe.";
}

export function analyze(input: string, mode: AnalysisMode = "auto"): AnalysisResult {
  const error = validateInput(input, mode);
  if (error) throw new AnalysisInputError(error);

  const resolvedMode = resolveMode(input, mode);
  let findings: Finding[] = [];
  let observations: Observation[] = [];
  let unknowns: string[] = [];
  let analyzedLinks: AnalyzedLink[] = [];

  if (resolvedMode === "url") {
    const result = analyzeUrl(input.trim());
    findings = result.findings;
    observations = result.observations;
    unknowns = result.unknowns;
    analyzedLinks = [{
      url: input.trim(),
      hostname: result.hostname,
      hostnameBreakdown: result.hostnameBreakdown,
      findings: result.findings,
      observations: result.observations,
      unknowns: result.unknowns,
    }];
  } else {
    const message = analyzeMessage(input);
    const urls = analyzeUrlsInText(input);
    findings = [...message.findings, ...urls.findings];
    observations = [...message.observations, ...urls.observations];
    unknowns = [...message.unknowns, ...urls.unknowns];
    analyzedLinks = urls.analyzedLinks;
  }

  const assessment = assessmentFor(findings);
  const recommendedActions = uniqueStrings(
    findings
      .slice()
      .sort((a, b) => ({ high: 0, medium: 1, low: 2 })[a.severity] - ({ high: 0, medium: 1, low: 2 })[b.severity])
      .map((finding) => finding.action),
  );

  return {
    assessment,
    summary: summaryFor(assessment, findings.length),
    mode: resolvedMode,
    findings,
    observations,
    unknowns: uniqueStrings(unknowns),
    analyzedLinks,
    recommendedActions,
    rulesetVersion: RULESET_VERSION,
  };
}
