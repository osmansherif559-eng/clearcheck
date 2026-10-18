# ClearCheck analysis corpus

ClearCheck uses a small, versioned, offline regression corpus. It is **not** a claim of real-world scam detection accuracy or complete protection.

## Corpus and sources

- Corpus file: `src/lib/analysis/corpus/v1.json`
- Corpus version: `1.0.0`
- Ruleset version evaluated by the corpus: `1.2.0`
- Examples: 100% synthetic, redacted, non-functional fixtures. No user-submitted content, credentials, active malware, live QR payloads, or functional destinations are included.
- Categories: 21, including account takeover, OTP theft, bank/payment impersonation, delivery fees, recruitment fees, recruitment-sensitive-information requests, invoice/refund demands, investment/crypto, romance, family emergency, government/tax, tech support, prizes, subscription phishing, QR phishing, URL patterns, downloads, social-account alerts, marketplace payment scams, private-channel changes, and benign counterexamples.

The corpus includes provenance for the public guidance used to shape the categories. Sources include CISA phishing guidance, the UCI SMS Spam Collection (CC BY 4.0, evaluated as a possible benchmark but not redistributed here), UK NCSC QR guidance (OGL v3), and Investor.gov fraud education. Source text and media are not copied into the application. The complete source metadata, access dates, licenses, and transformation policy are in the corpus file.

## Evaluation

Run the deterministic evaluation offline:

```bash
npm run evaluate:corpus
```

The evaluator checks the declared ruleset version, assessment, required finding IDs, forbidden finding IDs, category coverage, labels, and provenance metadata. It reports per-case results, counts by category and label, rule coverage, and a curated confusion matrix. Precision and recall are calculated only for the synthetic labels in this corpus; they are not estimates of field performance. The evaluator can also be imported through `evaluateCorpus()` for tooling.

The current corpus is curated regression coverage, not a statistically representative test set. Positive/negative labels are synthetic and subjective. Results should not be converted into a population precision, recall, or safety guarantee. The engine still cannot verify sender identity, ownership, DNS, redirects, page contents, malware, or live reputation.

## Versioning

Update `RULESET_VERSION` whenever a rule changes its triggers, severity, evidence, or output. Add a new corpus version or update expected outcomes with a documented reason; do not silently relabel failures. Context-question behavior has its own `CONTEXT_VERSION` and is additive to the base result.
