"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AnalysisResult, Assessment, Finding } from "@/lib/analysis/types";
import { contextualAdvice, getContextQuestions, type ContextAnswers } from "@/lib/analysis/context";
import { useReportSession } from "./ReportSessionProvider";
import Icon, { type IconName } from "@/components/ui/Icon";

const assessmentCopy: Record<Assessment, { label: string; eyebrow: string; icon: IconName }> = {
  high_concern: { label: "High concern", eyebrow: "Several strong signals need your attention", icon: "alert" },
  needs_caution: { label: "Needs caution", eyebrow: "Pause and verify before you act", icon: "eye" },
  no_major_indicators: { label: "No major warning signs found", eyebrow: "The configured rules found no significant warning signs", icon: "shield-check" },
};

function severityWeight(finding: Finding) {
  return { high: 0, medium: 1, low: 2 }[finding.severity];
}

export default function ResultDialog({ result, open, onClose, onEdit, onReset }: {
  result: AnalysisResult;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onReset: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { setRecoveryScenario } = useReportSession();
  const [answers, setAnswers] = useState<ContextAnswers>({});
  const assessment = assessmentCopy[result.assessment];
  const questions = useMemo(() => getContextQuestions(result), [result]);
  const advice = useMemo(() => contextualAdvice(result, answers), [answers, result]);
  const findings = useMemo(() => result.findings.slice().sort((a, b) => severityWeight(a) - severityWeight(b)).slice(0, 3), [result.findings]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      window.requestAnimationFrame(() => closeRef.current?.focus());
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const cancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", cancel);
    return () => dialog.removeEventListener("cancel", cancel);
  }, [onClose]);

  function choose(questionId: keyof ContextAnswers, value: string) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  function close() {
    onClose();
  }

  function openRecovery() {
    setRecoveryScenario(advice.recoveryScenario);
    close();
  }

  return (
    <dialog ref={dialogRef} className="result-dialog" aria-modal="true" aria-labelledby="report-title" aria-describedby="result-dialog-description">
      <div className="result-dialog-panel">
        <div className="result-dialog-topbar">
          <span className="dialog-kicker">ClearCheck result</span>
          <button ref={closeRef} className="dialog-close" type="button" onClick={close} aria-label="Close result"><Icon name="x" size={18} /> <span>Close</span></button>
        </div>
        <div className={`dialog-assessment ${result.assessment}`}>
          <span className="dialog-assessment-icon" aria-hidden="true"><Icon name={assessment.icon} size={22} /></span>
          <div><span className="section-kicker">Assessment</span><h2 id="report-title">{assessment.label}</h2><p id="result-dialog-description">{assessment.eyebrow}. {result.summary}</p></div>
        </div>

        <section className="dialog-section dialog-explanation" aria-labelledby="dialog-explanation-title">
          <span className="section-kicker">In plain English</span>
          <h3 id="dialog-explanation-title">What this means</h3>
          <p>{advice.explanation}</p>
          {advice.contextNote && <p className="context-note"><Icon name="info" size={15} /> {advice.contextNote}</p>}
        </section>

        <section className="dialog-section" aria-labelledby="dialog-evidence-title">
          <div className="dialog-section-heading"><div><span className="section-kicker">Most important evidence</span><h3 id="dialog-evidence-title">What ClearCheck noticed</h3></div><span className="dialog-count">{findings.length} of {result.findings.length}</span></div>
          {findings.length === 0 ? <p className="dialog-empty">No major rule matched this input. That is not proof of safety.</p> : <div className="dialog-findings">{findings.map((finding, index) => <article className={`dialog-finding severity-${finding.severity}`} key={`${finding.id}-${index}`}><h4>{finding.title}</h4><div className="dialog-evidence"><span>Evidence from your input</span><blockquote>“{finding.evidence}”</blockquote></div><p><strong>Why it matters:</strong> {finding.explanation}</p><p><strong>Safest next action:</strong> {finding.action}</p></article>)}</div>}
        </section>

        <section className="dialog-section dialog-questions" aria-labelledby="dialog-questions-title">
          <div className="dialog-section-heading"><div><span className="section-kicker">Optional context</span><h3 id="dialog-questions-title">Help tailor the next step</h3></div><button className="text-button" type="button" onClick={() => setAnswers({})}>Skip questions</button></div>
          <div className="question-list">{questions.map((question) => <fieldset key={question.id}><legend>{question.prompt}</legend><div className="question-options">{question.options.map((option) => <button key={option.value} className={answers[question.id] === option.value ? "question-option selected" : "question-option"} type="button" aria-pressed={answers[question.id] === option.value} onClick={() => choose(question.id, option.value)}>{option.label}</button>)}</div></fieldset>)}</div>
        </section>

        <section className="dialog-next-step" aria-labelledby="dialog-next-step-title">
          <span className="section-kicker">Your next step</span>
          <h3 id="dialog-next-step-title">{advice.primaryAction}</h3>
          {advice.additionalActions.length > 1 && <ul>{advice.additionalActions.slice(1).map((action) => <li key={action}>{action}</li>)}</ul>}
        </section>

         <div className="dialog-actions"><Link className="primary-button" href="/report" onClick={close}>See full breakdown <Icon name="arrow-up-right" size={16} /></Link><Link className="secondary-button" href="/recover" onClick={openRecovery}><Icon name="shield" size={16} /> Open recovery coach</Link><button className="quiet-button" type="button" onClick={onEdit}><Icon name="edit" size={15} /> Edit input</button><button className="quiet-button" type="button" onClick={onReset}><Icon name="refresh" size={15} /> New check</button></div>
        <p className="dialog-disclaimer">ClearCheck is an assessment tool, not a guarantee. Your answers add context; they do not prove who sent the message or what a destination will do.</p>
      </div>
    </dialog>
  );
}
