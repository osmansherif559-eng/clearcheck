"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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
  const resultRef = useRef<HTMLElement>(null);

  const inputHint = useMemo(() => {
    if (mode === "url") return "https://example.com/account/verify…";
    if (mode === "message") return "“Your account will be locked today. Send the code…”";
    return "“Your account will be locked today…” or https://example.com/verify…";
  }, [mode]);

  useEffect(() => {
    if (!result || !window.matchMedia("(max-width: 800px)").matches) return;
    window.requestAnimationFrame(() => {
      const resultTop = resultRef.current?.getBoundingClientRect().top;
      if (resultTop === undefined) return;
      window.scrollTo({ top: Math.max(0, window.scrollY + resultTop - 76), behavior: "smooth" });
    });
  }, [result]);

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

  function editInput() {
    setInputMethod("text");
    window.requestAnimationFrame(() => document.getElementById("check-input")?.focus());
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
      <div className="checker-workspace">
        <section className="checker-input-panel" aria-labelledby="checker-title">
          <div className="checker-card-top">
            <div><span className="section-kicker">Start with what you received</span><h2 id="checker-title">Paste or upload</h2><p className="checker-panel-intro">ClearCheck looks for observable signals without opening links or sending your content anywhere.</p></div>
            <span className="local-badge"><Icon name="lock" size={13} /> Local analysis</span>
          </div>
          <div className="checker-methods" role="group" aria-label="Choose what to check">
            <button aria-pressed={inputMethod === "text" && mode !== "url"} className={inputMethod === "text" && mode !== "url" ? "checker-method active" : "checker-method"} type="button" onClick={() => { setInputMethod("text"); setMode("auto"); }}><Icon name="message" size={16} /> Message</button>
            <button aria-pressed={inputMethod === "text" && mode === "url"} className={inputMethod === "text" && mode === "url" ? "checker-method active" : "checker-method"} type="button" onClick={() => { setInputMethod("text"); setMode("url"); }}><Icon name="link" size={16} /> Link</button>
            <button aria-pressed={inputMethod === "image"} className={inputMethod === "image" ? "checker-method active" : "checker-method"} type="button" onClick={() => setInputMethod("image")}><Icon name="eye" size={16} /> Screenshot or QR</button>
          </div>
          {inputMethod === "text" ? <div className="checker-card">
            <form onSubmit={submit}>
              <label className="input-label" htmlFor="check-input">Paste the content to check</label>
              <textarea id="check-input" aria-label="Suspicious message or URL" value={input} onChange={(event) => setInput(event.target.value)} placeholder={inputHint} maxLength={12000} spellCheck="false" aria-describedby="input-privacy" />
              <div className="input-meta"><span>Remove passwords, codes, and financial details first.</span><span>{input.length.toLocaleString()} / 12,000</span></div>
              {error && <div className="form-error" role="alert"><span>!</span>{error}</div>}
              <div className="checker-actions"><button className="primary-button" type="submit">{mode === "url" ? "Inspect URL" : "Analyze safely"}<Icon name="arrow-up-right" size={17} /></button><button className="quiet-button" type="button" onClick={reset} disabled={!input && !result}><Icon name="refresh" size={15} /> Clear</button></div>
            </form>
            <p className="privacy-note" id="input-privacy"><Icon name="lock" size={13} /> Your input stays in this browser. Nothing is saved or sent to an external AI service.</p>
          </div> : <ImageInspector onAnalyze={(nextInput, nextMode) => { setInput(nextInput); setMode(nextMode); setInputMethod("text"); setResult(analyze(nextInput, nextMode)); setError(null); }} />}
        </section>

        <section className="result-panel" ref={resultRef} aria-label={result ? "ClearCheck result" : "ClearCheck result preview"} aria-live="polite">
          {result ? <ResultReport result={result} originalInput={input} onCopy={copyReport} copied={copied} onPrint={() => window.print()} onReset={reset} onEdit={editInput} onRecovery={() => document.getElementById("recovery-coach")?.scrollIntoView({ behavior: "smooth", block: "start" })} /> : <div className="result-empty"><div className="result-empty-mark"><Icon name="search" size={18} /></div><span className="section-kicker">Your result</span><h2>Evidence, not a mystery score.</h2><p>Analyze something to see the signals ClearCheck found, why they matter, and a safer next step.</p><dl><div><dt>Assessment</dt><dd>A concise concern level</dd></div><div><dt>Evidence</dt><dd>Words or URL details from your input</dd></div><div><dt>Action</dt><dd>A practical way to verify independently</dd></div></dl></div>}
        </section>
      </div>

      {inputMethod === "text" && <div className="samples-block">
         <div className="samples-heading"><div><span className="section-kicker">Try a sample</span><h2>See how the signals work</h2></div><span className="samples-note">Safe examples, no real links</span></div>
         <div className="sample-grid">{samples.map((sample) => <button className="sample-card" key={sample.label} type="button" onClick={() => loadSample(sample)}><span className={`sample-icon ${sample.tone}`}><Icon name={sample.icon} size={16} /></span><span><strong>{sample.label}</strong><small>{sample.description}</small></span><span className="sample-arrow" aria-hidden="true"><Icon name="arrow-up-right" size={16} /></span></button>)}</div>
       </div>}

       <RecoveryCoach compact />
    </div>
  );
}
