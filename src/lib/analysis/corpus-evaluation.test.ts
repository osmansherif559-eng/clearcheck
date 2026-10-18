import { describe, expect, it } from "vitest";
import corpus from "./corpus/v1.json";
import { evaluateCorpus } from "./corpus-evaluation";
import { RULESET_VERSION } from "./types";

describe("versioned ClearCheck corpus", () => {
  it("matches the declared ruleset and passes every curated case", () => {
    const evaluation = evaluateCorpus();
    expect(evaluation.rulesetVersion).toBe(RULESET_VERSION);
    expect(evaluation.total).toBe(corpus.cases.length);
    console.info("ClearCheck corpus evaluation", { total: evaluation.total, passed: evaluation.passed, failed: evaluation.failed, byCategory: evaluation.byCategory, byLabel: evaluation.byLabel, metrics: evaluation.metrics });
    expect(evaluation.failed, JSON.stringify(evaluation.results.filter((entry) => !entry.passed), null, 2)).toBe(0);
  });

  it("covers every requested category with provenance metadata", () => {
    const required = [
      "account-takeover", "otp-and-recovery-code-theft", "bank-and-payment-impersonation", "package-delivery-fee",
      "job-recruitment-fee", "invoice-refund-payment-demand", "investment-and-cryptocurrency-fraud", "romance-and-relationship-manipulation",
      "family-emergency-impersonation", "government-tax-law-enforcement-impersonation", "tech-support-remote-access", "shopping-giveaway-prize",
      "subscription-renewal-payment-failure", "qr-code-phishing", "deceptive-url-patterns", "malicious-download-and-attachment-lure",
      "social-media-recovery-and-copyright-phishing", "marketplace-buyer-seller-payment-scam", "private-channel-change-request", "legitimate-benign-counterexample",
    ];
    expect(new Set(corpus.cases.map((entry) => entry.category))).toEqual(new Set(required));
    expect(corpus.provenance.sources.length).toBeGreaterThanOrEqual(4);
    expect(corpus.cases.every((entry) => entry.id && entry.provenance && entry.input && entry.expect)).toBe(true);
  });
});
