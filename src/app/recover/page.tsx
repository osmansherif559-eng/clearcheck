import RecoveryCoach from "@/components/recovery/RecoveryCoach";

export default function RecoverPage() {
  return (
    <main className="inner-page shell">
      <div className="page-heading"><span className="eyebrow">Recovery coach</span><h1>Something happened. Start with the next safe step.</h1><p>Choose the closest situation for a local, prioritized checklist. ClearCheck does not contact your bank, account provider, or any reporting service for you.</p></div>
      <RecoveryCoach />
    </main>
  );
}
