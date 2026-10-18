"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { AnalysisResult } from "@/lib/analysis/types";
import type { RecoveryScenario } from "@/lib/recovery-coach";

export interface ReportSession {
  result: AnalysisResult;
  originalInput: string;
  recoveryScenario?: RecoveryScenario;
}

interface ReportSessionContextValue {
  report: ReportSession | null;
  setReport: (report: ReportSession) => void;
  setRecoveryScenario: (scenario?: RecoveryScenario) => void;
  clearReport: () => void;
}

const ReportSessionContext = createContext<ReportSessionContextValue | null>(null);
let inMemoryReport: ReportSession | null = null;

export default function ReportSessionProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [report, setReportState] = useState<ReportSession | null>(inMemoryReport);
  function setReport(nextReport: ReportSession) {
    inMemoryReport = nextReport;
    setReportState(nextReport);
  }
  function setRecoveryScenario(scenario?: RecoveryScenario) {
    if (!inMemoryReport) return;
    const nextReport = { ...inMemoryReport, recoveryScenario: scenario };
    inMemoryReport = nextReport;
    setReportState(nextReport);
  }
  function clearReport() {
    inMemoryReport = null;
    setReportState(null);
  }
  const value = useMemo(() => ({
    report,
    setReport,
    setRecoveryScenario,
    clearReport,
  }), [report]);

  return <ReportSessionContext.Provider value={value}>{children}</ReportSessionContext.Provider>;
}

export function useReportSession() {
  const context = useContext(ReportSessionContext);
  if (!context) throw new Error("useReportSession must be used inside ReportSessionProvider");
  return context;
}
