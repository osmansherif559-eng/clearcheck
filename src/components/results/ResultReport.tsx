import { useState } from "react";
import type { AnalysisResult, Assessment, Finding } from "@/lib/analysis/types";
import Icon, { type IconName } from "@/components/ui/Icon";

const assessmentCopy: Record<Assessment, { label: string; eyebrow: string; icon: IconName }> = {
  high_concern: { label: "High concern", eyebrow: "Several strong signals need your attention", icon: "alert" },
  needs_caution: { label: "Needs caution", eyebrow: "Pause and verify before you act", icon: "eye" },
  no_major_indicators: { label: "No major indicators found", eyebrow: "The configured rules found no significant warning signs", icon: "shield-check" },
};

function severityLabel(finding: Finding): string {
  return finding.severity === "high" ? "High signal" : finding.severity === "medium" ? "Meaningful signal" : "Low signal";
}

export default function ResultReport({ result, originalInput, onCopy, copied, onPrint, onReset, onEdit, onRecovery }: { result: AnalysisResult; originalInput: string; onCopy: (includeInput: boolean) => void; copied: boolean; onPrint: () => void; onReset: () => void; onEdit: () => void; onRecovery: () => void }) {
  const assessment = assessmentCopy[result.assessment];
  const [includeInput, setIncludeInput] = useState(false);
  return (
    <section className="report" aria-live="polite" aria-labelledby="report-title">
      <div className={`assessment-banner ${result.assessment}`}>
        <div className="assessment-icon" aria-hidden="true"><Icon name={assessment.icon} size={22} /></div>
        <div><span className="section-kicker">Assessment · {result.mode} analysis</span><h2 id="report-title">{assessment.label}</h2><p>{assessment.eyebrow}. {result.summary}</p></div>
        <button className="report-edit-button" type="button" onClick={onEdit}><Icon name="edit" size={14} /> Edit input</button>
        <span className="ruleset-chip">Ruleset {result.rulesetVersion}</span>
      </div>

      <div className="report-grid">
        <div className="report-main">
          <div className="report-section-heading"><div><span className="section-kicker">Evidence-linked findings</span><h2>What ClearCheck noticed</h2></div><span>{result.findings.length} finding{result.findings.length === 1 ? "" : "s"}</span></div>
          {result.findings.length === 0 ? <div className="empty-findings"><span className="empty-check"><Icon name="shield-check" size={17} /></span><div><h3>Nothing major matched the current rules.</h3><p>That is not proof of safety. Review the sender, context, and destination independently before sharing information or making a payment.</p></div></div> : <div className="finding-list">{result.findings.map((finding, index) => <article className={`finding-card severity-${finding.severity}`} key={`${finding.id}-${index}`}><div className="finding-top"><span className="finding-severity"><i />{severityLabel(finding)}</span><span className="finding-id">{finding.id}</span></div><h3>{finding.title}</h3><div className="evidence-block"><span>Evidence from your input</span><blockquote>“{finding.evidence}”</blockquote></div><p>{finding.explanation}</p><div className="finding-action"><span>Next step</span><p>{finding.action}</p></div>{finding.limitations && <p className="finding-limit"><strong>Context:</strong> {finding.limitations}</p>}</article>)}</div>}
        </div>
        <aside className="report-side">
          <div className="side-card action-card"><span className="section-kicker">Safer next steps</span><h2>What to do now</h2><ol>{result.recommendedActions.length > 0 ? result.recommendedActions.map((action, index) => <li key={action}><span>{String(index + 1).padStart(2, "0")}</span>{action}</li>) : <li><span>01</span>Continue independently verifying the sender and destination.</li>}</ol></div>
          <div className="side-card"><span className="section-kicker">Still unknown</span><h2>What local checks cannot tell you</h2><ul>{result.unknowns.map((unknown) => <li key={unknown}>{unknown}</li>)}</ul></div>
        </aside>
      </div>

      {result.analyzedLinks.length > 0 && <details className="observations link-breakdown"><summary><span>Link and hostname breakdown</span><span>{result.analyzedLinks.length} link{result.analyzedLinks.length === 1 ? "" : "s"} checked <Icon name="chevron-down" size={14} /></span></summary><div className="link-breakdown-list">{result.analyzedLinks.map((link) => <div className="link-breakdown-item" key={link.url}><div><Icon name="link" size={15} /><strong>{link.url}</strong></div>{link.hostnameBreakdown && <p>Hostname labels: {link.hostnameBreakdown.labels.join(" · ")} <span>({link.hostnameBreakdown.labelCount} labels{link.hostnameBreakdown.isIpAddress ? "; IP address" : ""})</span></p>}<small>{link.findings.length} finding{link.findings.length === 1 ? "" : "s"} · No destination was opened</small></div>)}</div></details>}
      {result.observations.length > 0 && <details className="observations"><summary><span>Observed details</span><span>{result.observations.length} available <Icon name="chevron-down" size={14} /></span></summary><div className="observation-list">{result.observations.map((observation) => <div key={observation.id}><span>{observation.label}</span><strong>{observation.value}</strong></div>)}</div></details>}
      <div className="recovery-entry"><div><span className="section-kicker">Need a next step?</span><h3>Already clicked, shared something, or paid?</h3><p>Use the local recovery coach for a prioritized checklist. It does not contact anyone for you.</p></div><button className="secondary-button" type="button" onClick={onRecovery}><Icon name="shield" size={16} /> Open recovery coach</button></div>
      <div className="report-footer"><p>ClearCheck is an assessment tool, not a guarantee. When money, identity, or account access is involved, verify through a trusted channel.</p><div className="report-tools"><label className="include-input"><input type="checkbox" checked={includeInput} disabled={!originalInput} onChange={(event) => setIncludeInput(event.target.checked)} /> Include submitted content</label><button type="button" onClick={() => onCopy(includeInput)}><Icon name={copied ? "check" : "clipboard"} size={14} />{copied ? "Copied" : "Copy report"}</button><button type="button" onClick={onPrint}><Icon name="printer" size={14} />Print</button><button type="button" onClick={onReset}><Icon name="refresh" size={14} />New check</button></div></div>
    </section>
  );
}
