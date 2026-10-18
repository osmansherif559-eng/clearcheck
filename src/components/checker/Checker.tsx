"use client";

import { FormEvent, useMemo, useState } from "react";
import { analyze, validateInput } from "@/lib/analysis/analyze";
import type { AnalysisMode, AnalysisResult } from "@/lib/analysis/types";
import ResultDialog from "@/components/report/ResultDialog";
import { useReportSession } from "@/components/report/ReportSessionProvider";
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

export default function Checker({ showSamples = true, showRecovery = true }: { showSamples?: boolean; showRecovery?: boolean }) {
  const [inputMethod, setInputMethod] = useState<"text" | "image">("text");
  const { report: existingReport, setReport, clearReport } = useReportSession();
  const [input, setInput] = useState(existingReport?.originalInput ?? "");
  const [mode, setMode] = useState<AnalysisMode>("auto");
  const [result, setResult] = useState<AnalysisResult | null>(existingReport?.result ?? null);
  const [resultVersion, setResultVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const inputHint = useMemo(() => {
    if (mode === "url") return "https://example.com/account/verify…";
    if (mode === "message") return "“Your account will be locked today. Send the code…”";
    return "“Your account will be locked today…” or https://example.com/verify…";
  }, [mode]);

  function completeAnalysis(nextResult: AnalysisResult, sourceInput: string) {
    setResult(nextResult);
    setResultVersion((current) => current + 1);
    setReport({ result: nextResult, originalInput: sourceInput });
    setDialogOpen(true);
    setError(null);
  }

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const validationError = validateInput(input, mode);
    if (validationError) {
      setError(validationError);
      setResult(null);
      clearReport();
      return;
    }
    try {
      completeAnalysis(analyze(input, mode), input);
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "We could not analyze that input.");
      setResult(null);
      clearReport();
    }
  }

  function loadSample(sample: Sample) {
    setInput(sample.input);
    setMode(sample.mode);
    setError(null);
    completeAnalysis(analyze(sample.input, sample.mode), sample.input);
  }

  function reset() {
    setDialogOpen(false);
    setInput("");
    setResult(null);
    setError(null);
    clearReport();
  }

  function editInput() {
    setDialogOpen(false);
    setInputMethod("text");
    window.requestAnimationFrame(() => document.getElementById("check-input")?.focus());
  }

  function closeDialog() {
    setDialogOpen(false);
    window.requestAnimationFrame(() => document.getElementById("check-input")?.focus());
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
          </div> : <ImageInspector onAnalyze={(nextInput, nextMode) => { setInput(nextInput); setMode(nextMode); setInputMethod("text"); completeAnalysis(analyze(nextInput, nextMode), nextInput); }} />}
        </section>
      </div>

      {result && !dialogOpen && <div className="reopen-result"><span><strong>Your result is ready.</strong><small>It remains available only while this page is open.</small></span><button className="secondary-button" type="button" onClick={() => setDialogOpen(true)}>View result <Icon name="arrow-up-right" size={15} /></button></div>}

      {showSamples && inputMethod === "text" && <div className="samples-block">
         <div className="samples-heading"><div><span className="section-kicker">Try a sample</span><h2>See how the signals work</h2></div><span className="samples-note">Safe examples, no real links</span></div>
         <div className="sample-grid">{samples.map((sample) => <button className="sample-card" key={sample.label} type="button" onClick={() => loadSample(sample)}><span className={`sample-icon ${sample.tone}`}><Icon name={sample.icon} size={16} /></span><span><strong>{sample.label}</strong><small>{sample.description}</small></span><span className="sample-arrow" aria-hidden="true"><Icon name="arrow-up-right" size={16} /></span></button>)}</div>
       </div>}

        {showRecovery && <RecoveryCoach compact />}
       {result && <ResultDialog key={resultVersion} result={result} open={dialogOpen} onClose={closeDialog} onEdit={editInput} onReset={reset} />}
    </div>
  );
}
