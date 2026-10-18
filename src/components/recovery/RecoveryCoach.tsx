"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/ui/Icon";
import { useReportSession } from "@/components/report/ReportSessionProvider";
import { getRecoveryChecklist, RECOVERY_SCENARIOS, RECOVERY_SCENARIO_LABELS, type RecoveryScenario } from "@/lib/recovery-coach";

const scenarioIcons: Record<RecoveryScenario, "shield" | "eye" | "key" | "alert" | "clipboard" | "briefcase" | "download" | "search"> = {
  not_clicked_or_responded: "shield",
  opened_no_info: "eye",
  credentials: "key",
  otp_or_recovery_code: "key",
  financial_or_identity_info: "clipboard",
  money_sent: "briefcase",
  download_or_install: "download",
  unsure: "search",
};

const scenarioDescriptions: Record<RecoveryScenario, string> = {
  not_clicked_or_responded: "You paused before interacting.",
  opened_no_info: "You opened it but did not submit details.",
  credentials: "A password or login was entered.",
  otp_or_recovery_code: "A one-time or recovery code was shared.",
  financial_or_identity_info: "Card, bank, identity, or tax details were shared.",
  money_sent: "A transfer, payment, or fee was sent.",
  download_or_install: "A file was downloaded or an app was installed.",
  unsure: "You are not sure what happened.",
};

export default function RecoveryCoach({ compact = false }: { compact?: boolean }) {
  const { report } = useReportSession();
  const [scenario, setScenario] = useState<RecoveryScenario | null>(report?.recoveryScenario ?? null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const checklist = useMemo(() => getRecoveryChecklist(scenario ?? "unsure"), [scenario]);
  const selected = scenario !== null;

  function select(next: RecoveryScenario) {
    setScenario(next);
    setCompleted(new Set());
  }

  function toggleStep(id: string) {
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <section className={compact ? "recovery-coach compact" : "recovery-coach"} id="recovery-coach" aria-labelledby="recovery-title">
      <div className="recovery-header"><div><span className="section-kicker">After the moment</span><h2 id="recovery-title">I already clicked. What now?</h2><p>Choose the closest situation for calm, prioritized steps. Nothing here is sent or saved.</p></div>{selected && <button className="quiet-button" type="button" onClick={() => { setScenario(null); setCompleted(new Set()); }}><Icon name="refresh" size={15} /> Change situation</button>}</div>
      {!selected ? <div className="scenario-grid">{RECOVERY_SCENARIOS.map((item) => <button className="scenario-card" type="button" key={item} onClick={() => select(item)}><span className="scenario-icon"><Icon name={scenarioIcons[item]} size={18} /></span><span><strong>{RECOVERY_SCENARIO_LABELS[item]}</strong><small>{scenarioDescriptions[item]}</small></span><Icon name="arrow-up-right" size={15} /></button>)}</div> : <div className="recovery-plan"><div className="recovery-plan-heading"><div><span className="section-kicker">Your checklist</span><h3>{checklist.scenarioLabel}</h3></div><span className="progress-label" role="status" aria-live="polite">{completed.size} / {checklist.steps.length} complete</span></div><div className="recovery-steps">{checklist.steps.map((step) => <label className={completed.has(step.id) ? "recovery-step complete" : "recovery-step"} key={step.id}><input type="checkbox" checked={completed.has(step.id)} onChange={() => toggleStep(step.id)} /><span className="recovery-step-check"><Icon name="check" size={14} /></span><span className="recovery-step-body"><span className="recovery-step-meta"><strong>{step.urgency === "critical" ? "Do this first" : step.urgency === "high" ? "Priority" : "Next step"}</strong><span>Step {step.priority}</span></span><b>{step.title}</b><small><strong>Why:</strong> {step.whyItMatters}</small><small>{step.guidance}</small><small className="recovery-caveat"><Icon name="lock" size={12} /> {step.officialChannelCaveat}</small></span></label>)}</div><button className="secondary-button" type="button" onClick={() => { setScenario(null); setCompleted(new Set()); }}><Icon name="refresh" size={15} /> Start over</button></div>}
    </section>
  );
}
