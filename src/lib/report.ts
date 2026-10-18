import type { AnalysisResult } from "./analysis/types";

export function reportText(result: AnalysisResult, originalInput: string, includeInput: boolean): string {
  const lines = [
    `ClearCheck assessment: ${result.assessment.replaceAll("_", " ")}`,
    result.summary,
    "",
    ...result.findings.flatMap((finding) => [
      `${finding.title} [${finding.severity}]`,
      `Evidence: ${finding.evidence}`,
      `Why it matters: ${finding.explanation}`,
      `Next step: ${finding.action}`,
      "",
    ]),
    "Unknowns:",
    ...result.unknowns.map((unknown) => `- ${unknown}`),
  ];
  if (includeInput) lines.unshift("Submitted content:\n" + originalInput, "");
  return lines.join("\n");
}
