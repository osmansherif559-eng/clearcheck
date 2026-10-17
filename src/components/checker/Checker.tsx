"use client";

import { FormEvent, useMemo, useState } from "react";
import { analyze, validateInput } from "@/lib/analysis/analyze";
import type { AnalysisMode, AnalysisResult } from "@/lib/analysis/types";
import ResultReport from "@/components/results/ResultReport";

type Sample = { label: string; description: string; input: string; mode: AnalysisMode; tone: string };

const samples: Sample[] = [
  {
    label: "Account alert",
    description: "Urgent request for a one-time code",
    input: "URGENT: Your bank account will be locked today. Send us your one-time verification code now to keep access.",
    mode: "message",
    tone: "coral",
  },
  {
    label: "Job offer",
    description: "Upfront fee tied to an opportunity",
    input: "Congratulations, you got the job! Pay the $250 onboarding fee upfront today to secure your position.",
    mode: "message",
    tone: "gold",
  },
  {
    label: "Suspicious link",
    description: "A brand name in an unfamiliar domain",
    input: "https://paypal-login.example.net/verify",
    mode: "url",
    tone: "blue",
  },
];

export default function Checker() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<AnalysisMode>("auto");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const inputHint = useMemo(() => {
    if (mode === "url") return "Paste one complete URL, without opening it";
    if (mode === "message") return "Paste an SMS, email, chat, or offer";
    return "Paste a message or URL";
  }, [mode]);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const validationError = validateInput(input, mode);
    if (validationError) {
      setError(validationError);
      setResult(null);
      return;
    }
    try {
      setResult(analyze(input, mode));
      setError(null);
      setCopied(false);
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "We could not analyze that input.");
      setResult(null);
    }
  }

  function loadSample(sample: Sample) {
    setInput(sample.input);
    setMode(sample.mode);
    setError(null);
    setResult(analyze(sample.input, sample.mode));
    setCopied(false);
  }

  function reset() {
    setInput("");
    setResult(null);
    setError(null);
    setCopied(false);
  }

  async function copyReport() {
    if (!result) return;
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
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  return (
    <div className="checker-wrap">
      <div className="checker-card">
        <div className="checker-card-top">
          <div><span className="section-kicker">Start here</span><h2>What did you receive?</h2></div>
          <span className="local-badge"><span>●</span> Local analysis</span>
        </div>
        <div className="mode-tabs" role="tablist" aria-label="Analysis mode">
          {(["auto", "message", "url"] as const).map((tab) => <button key={tab} type="button" role="tab" aria-selected={mode === tab} className={mode === tab ? "mode-tab active" : "mode-tab"} onClick={() => setMode(tab)}>{tab === "auto" ? "Auto-detect" : tab === "message" ? "Message / email" : "URL only"}</button>)}
        </div>
        <form onSubmit={submit}>
          <label className="sr-only" htmlFor="check-input">Suspicious message or URL</label>
          <textarea id="check-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder={inputHint} maxLength={12000} spellCheck="false" />
          <div className="input-meta"><span>Remove passwords, codes, and financial details before pasting.</span><span>{input.length.toLocaleString()} / 12,000</span></div>
          {error && <div className="form-error" role="alert"><span>!</span>{error}</div>}
          <div className="checker-actions"><button className="primary-button" type="submit">{mode === "url" ? "Inspect URL" : "Analyze safely"}<span aria-hidden="true">→</span></button><button className="quiet-button" type="button" onClick={reset} disabled={!input && !result}>Clear</button></div>
        </form>
        <p className="privacy-note"><span aria-hidden="true">⌁</span> Your input stays in this browser. Nothing is saved or sent to an external AI service.</p>
      </div>

      <div className="samples-block">
        <div className="samples-heading"><div><span className="section-kicker">Try a sample</span><h2>See how the signals work</h2></div><span className="samples-note">Safe examples, no real links</span></div>
        <div className="sample-grid">{samples.map((sample) => <button className="sample-card" key={sample.label} type="button" onClick={() => loadSample(sample)}><span className={`sample-icon ${sample.tone}`}>{sample.tone === "coral" ? "!" : sample.tone === "gold" ? "$" : "↗"}</span><span><strong>{sample.label}</strong><small>{sample.description}</small></span><span className="sample-arrow" aria-hidden="true">↗</span></button>)}</div>
      </div>

      {result && <ResultReport result={result} onCopy={copyReport} copied={copied} onPrint={() => window.print()} onReset={reset} />}
    </div>
  );
}
