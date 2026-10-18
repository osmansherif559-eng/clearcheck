"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ResultReport from "@/components/results/ResultReport";
import { useReportSession } from "./ReportSessionProvider";
import { reportText } from "@/lib/report";

export default function ReportPageClient() {
  const router = useRouter();
  const { report, clearReport } = useReportSession();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const resetScroll = () => window.scrollTo({ top: 0, behavior: "auto" });
    resetScroll();
    const timer = window.setTimeout(resetScroll, 80);
    return () => window.clearTimeout(timer);
  }, []);

  if (!report) {
    return <main className="inner-page shell report-empty-page"><div className="page-heading"><span className="eyebrow">Full breakdown</span><h1>No report is open.</h1><p>Reports stay in memory on this device and are cleared when you reload or leave the session. Run a check first, then return here for the complete evidence.</p><Link className="primary-button report-return-link" href="/check">Return to checker <span aria-hidden="true">→</span></Link></div></main>;
  }
  const session = report;

  async function copyReport(includeInput: boolean) {
    try {
      await navigator.clipboard.writeText(reportText(session.result, session.originalInput, includeInput));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // The report remains available in the page; print is the fallback action.
      setCopied(false);
    }
  }

  function reset() {
    clearReport();
    router.push("/check");
  }

  return <main className="inner-page shell full-report-page"><div className="page-heading report-page-heading"><span className="eyebrow">Full breakdown</span><h1>What ClearCheck found.</h1><p>This report stays in this browser session. It includes the complete evidence, limitations, and recommended next steps.</p></div><ResultReport result={session.result} originalInput={session.originalInput} onCopy={copyReport} copied={copied} onPrint={() => window.print()} onReset={reset} onEdit={() => router.push("/check")} onRecovery={() => router.push("/recover")} /></main>;
}
