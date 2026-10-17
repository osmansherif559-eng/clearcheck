"use client";

import { FormEvent, useMemo, useState } from "react";
import { analyze, validateInput } from "@/lib/analysis/analyze";
import type { AnalysisMode, AnalysisResult } from "@/lib/analysis/types";
import ResultReport from "@/components/results/ResultReport";
import Icon, { type IconName } from "@/components/ui/Icon";
import ImageInspector from "./ImageInspector";
import RecoveryCoach from "@/components/recovery/RecoveryCoach";

type Sample = { label: string; description: string; input: string; mode: AnalysisMode; tone: string; icon: IconName };

const samples: Sample[] = [
  {
    label: "Account alert",
    description: "Urgent request for a one-time code",
    input: "URGENT: Your bank account will be locked today. Send us your one-time verification code now to keep access.",
    mode: "message",
    tone: "coral",
    icon: "key",
  },
  {
    label: "Job offer",
    description: "Upfront fee tied to an opportunity",
    input: "Congratulations, you got the job! Pay the $250 onboarding fee upfront today to secure your position.",
    mode: "message",
    tone: "gold",
    icon: "briefcase",
  },
  {
    label: "Suspicious link",
    description: "A brand name in an unfamiliar domain",
    input: "https://paypal-login.example.net/verify",
    mode: "url",
    tone: "blue",
    icon: "link",
  },
  {
    label: "Appointment reminder",
    description: "A routine message with no major signals",
    input: "Reminder: your dental appointment is tomorrow at 10:00 AM. Reply YES to confirm.",
    mode: "message",
    tone: "mint",
    icon: "check",
  },
];

export default function Checker() {
  const [inputMethod, setInputMethod] = useState<"text" | "image">("text");
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

  async function copyReport(includeInput: boolean) {
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
    if (includeInput) lines.unshift("Submitted content:\n" + input, "");
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setError("Copy is unavailable in this browser. You can use Print to save the report instead.");
    }
  }

  return (
    <div className="checker-wrap">
      <div className="checker-methods" role="group" aria-label="Investigation input type"><button className={inputMethod === "text" ? "checker-method active" : "checker-method"} type="button" onClick={() => setInputMethod("text")}><Icon name="message" size={16} /> Message or URL</button><button className={inputMethod === "image" ? "checker-method active" : "checker-method"} type="button" onClick={() => setInputMethod("image")}><Icon name="eye" size={16} /> Screenshot or QR</button></div>
      {inputMethod === "text" ? <div className="checker-card">
        <div className="checker-card-top">
          <div><span className="section-kicker">Start here</span><h2>What did you receive?</h2></div>
          <span className="local-badge"><span>●</span> Local analysis</span>
        </div>
        <div className="mode-tabs" role="group" aria-label="Analysis mode">
          {(["auto", "message", "url"] as const).map((tab) => <button key={tab} type="button" aria-pressed={mode === tab} className={mode === tab ? "mode-tab active" : "mode-tab"} onClick={() => setMode(tab)}>{tab === "auto" ? "Auto-detect" : tab === "message" ? "Message / email" : "URL only"}</button>)}
        </div>
        <form onSubmit={submit}>
          <label className="sr-only" htmlFor="check-input">Suspicious message or URL</label>
          <textarea id="check-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder={inputHint} maxLength={12000} spellCheck="false" />
          <div className="input-meta"><span>Remove passwords, codes, and financial details before pasting.</span><span>{input.length.toLocaleString()} / 12,000</span></div>
          {error && <div className="form-error" role="alert"><span>!</span>{error}</div>}
          <div className="checker-actions"><button className="primary-button" type="submit">{mode === "url" ? "Inspect URL" : "Analyze safely"}<Icon name="arrow-up-right" size={17} /></button><button className="quiet-button" type="button" onClick={reset} disabled={!input && !result}><Icon name="refresh" size={15} /> Clear</button></div>
        </form>
        <p className="privacy-note"><span aria-hidden="true">⌁</span> Your input stays in this browser. Nothing is saved or sent to an external AI service.</p>
      </div> : <ImageInspector onAnalyze={(nextInput, nextMode) => { setInput(nextInput); setMode(nextMode); setInputMethod("text"); setResult(analyze(nextInput, nextMode)); setError(null); }} />}

      {inputMethod === "text" && <div className="samples-block">
        <div className="samples-heading"><div><span className="section-kicker">Try a sample</span><h2>See how the signals work</h2></div><span className="samples-note">Safe examples, no real links</span></div>
        <div className="sample-grid">{samples.map((sample) => <button className="sample-card" key={sample.label} type="button" onClick={() => loadSample(sample)}><span className={`sample-icon ${sample.tone}`}><Icon name={sample.icon} size={16} /></span><span><strong>{sample.label}</strong><small>{sample.description}</small></span><span className="sample-arrow" aria-hidden="true"><Icon name="arrow-up-right" size={16} /></span></button>)}</div>
      </div>}

      {result && <ResultReport result={result} originalInput={input} onCopy={copyReport} copied={copied} onPrint={() => window.print()} onReset={reset} onRecovery={() => document.getElementById("recovery-coach")?.scrollIntoView({ behavior: "smooth", block: "start" })} />}
      <RecoveryCoach compact />
    </div>
  );
}
