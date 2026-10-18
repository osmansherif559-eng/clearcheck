import corpus from "./corpus/v1.json";
import { analyze } from "./analyze";
import { RULESET_VERSION, type AnalysisMode, type Assessment } from "./types";

export interface CorpusCaseResult {
  id: string;
  category: string;
  label: string;
  passed: boolean;
  assessment: Assessment;
  findingIds: string[];
  missingFindingIds: string[];
  forbiddenFindingIds: string[];
}

export interface CorpusEvaluation {
  corpusVersion: string;
  rulesetVersion: string;
  total: number;
  passed: number;
  failed: number;
  byCategory: Record<string, number>;
  byLabel: Record<string, number>;
  ruleCoverage: string[];
  metrics: { truePositive: number; falsePositive: number; falseNegative: number; trueNegative: number; precision: number | null; recall: number | null };
  results: CorpusCaseResult[];
}

type CorpusCase = (typeof corpus.cases)[number];

export function evaluateCorpus(): CorpusEvaluation {
  if (corpus.rulesetVersion !== RULESET_VERSION) {
    throw new Error(`Corpus expects ruleset ${corpus.rulesetVersion}, but engine is ${RULESET_VERSION}. Update the corpus expectation when rule behavior changes.`);
  }

  const results = corpus.cases.map((entry: CorpusCase): CorpusCaseResult => {
    const result = analyze(entry.input, entry.mode as AnalysisMode);
    const findingIds = result.findings.map((finding) => finding.id);
    const includeFindingIds = entry.expect.includeFindingIds ?? [];
    const excludeFindingIds = entry.expect.excludeFindingIds ?? [];
    const missingFindingIds = includeFindingIds.filter((id) => !findingIds.includes(id));
    const forbiddenFindingIds = excludeFindingIds.filter((id) => findingIds.includes(id));
    const passed = result.assessment === entry.expect.assessment && missingFindingIds.length === 0 && forbiddenFindingIds.length === 0;
    return { id: entry.id, category: entry.category, label: entry.label, passed, assessment: result.assessment, findingIds, missingFindingIds, forbiddenFindingIds };
  });

  const byCategory: Record<string, number> = {};
  const byLabel: Record<string, number> = {};
  for (const entry of corpus.cases) {
    byCategory[entry.category] = (byCategory[entry.category] ?? 0) + 1;
    byLabel[entry.label] = (byLabel[entry.label] ?? 0) + 1;
  }

  const positives = results.filter((entry) => entry.label !== "synthetic-benign");
  const negatives = results.filter((entry) => entry.label === "synthetic-benign");
  const truePositive = positives.filter((entry) => entry.assessment !== "no_major_indicators").length;
  const falseNegative = positives.length - truePositive;
  const falsePositive = negatives.filter((entry) => entry.assessment !== "no_major_indicators").length;
  const trueNegative = negatives.length - falsePositive;

  return {
    corpusVersion: corpus.corpusVersion,
    rulesetVersion: RULESET_VERSION,
    total: results.length,
    passed: results.filter((entry) => entry.passed).length,
    failed: results.filter((entry) => !entry.passed).length,
    byCategory,
    byLabel,
    ruleCoverage: Array.from(new Set(results.flatMap((entry) => entry.findingIds))).sort(),
    metrics: {
      truePositive,
      falsePositive,
      falseNegative,
      trueNegative,
      precision: truePositive + falsePositive === 0 ? null : truePositive / (truePositive + falsePositive),
      recall: truePositive + falseNegative === 0 ? null : truePositive / (truePositive + falseNegative),
    },
    results,
  };
}

export function formatCorpusEvaluation(evaluation: CorpusEvaluation): string {
  return JSON.stringify(evaluation, null, 2);
}
