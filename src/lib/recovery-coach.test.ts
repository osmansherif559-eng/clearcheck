import { describe, expect, it } from "vitest";
import {
  RECOVERY_SCENARIOS,
  getRecoveryChecklist,
  normalizeRecoveryScenario,
  resetIncidentDetails,
  resetRecoveryScenario,
  selectRecoveryScenario,
  selectScenario,
  type RecoveryIncidentDetails,
  type RecoveryScenario,
} from "./recovery-coach";

const expectedFirstStep: Record<RecoveryScenario, string> = {
  not_clicked_or_responded: "pause-contact",
  opened_no_info: "close-without-submitting",
  credentials: "change-password",
  otp_or_recovery_code: "contact-account-provider",
  financial_or_identity_info: "contact-financial-institution",
  money_sent: "request-transfer-reversal",
  download_or_install: "isolate-suspicious-device",
  unsure: "pause-and-protect",
};

describe("local recovery coach", () => {
  it.each(RECOVERY_SCENARIOS)("returns a complete checklist for %s", (scenario) => {
    const checklist = getRecoveryChecklist(scenario);

    expect(checklist.scenario).toBe(scenario);
    expect(checklist.scenarioLabel).toBeTruthy();
    expect(checklist.steps.length).toBeGreaterThan(0);
    expect(checklist.steps[0]?.id).toBe(expectedFirstStep[scenario]);

    for (const step of checklist.steps) {
      expect(step.title).toBeTruthy();
      expect(step.whyItMatters).toBeTruthy();
      expect(step.guidance).toBeTruthy();
      expect(step.urgency).toMatch(/^(critical|high|medium|low)$/);
      expect(step.officialChannelCaveat).toBeTruthy();
    }
  });

  it("keeps every scenario's steps in explicit priority order", () => {
    for (const scenario of RECOVERY_SCENARIOS) {
      const first = getRecoveryChecklist(scenario);
      const second = getRecoveryChecklist(scenario);
      const priorities = first.steps.map((step) => step.priority);

      expect(priorities).toEqual([...priorities].sort((left, right) => left - right));
      expect(new Set(first.steps.map((step) => step.id)).size).toBe(first.steps.length);
      expect(second).toEqual(first);
    }
  });

  it("uses the unsure plan for missing or invalid incident details", () => {
    const incomplete = getRecoveryChecklist({});
    const explicitlyMissing = getRecoveryChecklist({ scenario: null });
    const invalid = getRecoveryChecklist({ scenario: "not-a-scenario" } as unknown as RecoveryIncidentDetails);

    expect(getRecoveryChecklist().scenario).toBe("unsure");
    expect(incomplete.scenario).toBe("unsure");
    expect(explicitlyMissing.scenario).toBe("unsure");
    expect(invalid).toEqual(incomplete);
    expect(normalizeRecoveryScenario(undefined)).toBe("unsure");
    expect(normalizeRecoveryScenario("not-a-scenario")).toBe("unsure");
  });

  it("selects a scenario without sharing mutable state", () => {
    const selected = selectScenario("credentials");
    const selectedAlias = selectRecoveryScenario("credentials");

    expect(selected).toEqual({ scenario: "credentials" });
    expect(selectedAlias).toEqual(selected);
    expect(getRecoveryChecklist(selected).scenario).toBe("credentials");

    const firstChecklist = getRecoveryChecklist(selected);
    firstChecklist.steps.pop();
    if (firstChecklist.steps[0]) firstChecklist.steps[0].title = "changed locally";

    const freshChecklist = getRecoveryChecklist(selected);
    expect(freshChecklist.steps.length).toBeGreaterThan(0);
    expect(freshChecklist.steps[0]?.title).not.toBe("changed locally");
  });

  it("resets to an incomplete incident without mutating a prior selection", () => {
    const selected = selectRecoveryScenario("money_sent");
    const reset = resetIncidentDetails();
    const resetAlias = resetRecoveryScenario();

    expect(selected).toEqual({ scenario: "money_sent" });
    expect(reset).toEqual({});
    expect(resetAlias).toEqual({});
    expect(getRecoveryChecklist(reset).scenario).toBe("unsure");
    expect(getRecoveryChecklist(selected).scenario).toBe("money_sent");
  });
});
