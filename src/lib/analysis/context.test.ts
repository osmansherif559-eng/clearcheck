import { describe, expect, it } from "vitest";
import { analyze } from "./analyze";
import { contextualAdvice, getContextQuestions } from "./context";

describe("contextual education", () => {
  it("selects account-alert questions without asking for secrets", () => {
    const result = analyze("URGENT: Your bank account is locked. Send the verification code now.");
    const questions = getContextQuestions(result);
    expect(questions.map((question) => question.id)).toEqual(["account-alert-expectedness", "interaction-status"]);
    expect(questions.flatMap((question) => question.options.map((option) => option.label).join(" ")).join(" ")).not.toMatch(/account number|payment details|code you received/i);
  });

  it("keeps observed findings unchanged while adding recovery advice", () => {
    const result = analyze("URGENT: send your one-time verification code now");
    const advice = contextualAdvice(result, { "interaction-status": "shared_code" });
    expect(result.assessment).toBe("high_concern");
    expect(advice.recoveryScenario).toBe("otp_or_recovery_code");
    expect(advice.contextNote).toContain("does not change the observed evidence");
    expect(advice.additionalActions.join(" ")).toMatch(/recovery coach/i);
  });

  it("does not call an expected message proof of safety", () => {
    const result = analyze("Your account needs a verification code. Click the link to confirm your login.");
    const advice = contextualAdvice(result, { expectedness: "expected", "verification-route": "yes" });
    expect(result.assessment).not.toBe("no_major_indicators");
    expect(advice.explanation).toMatch(/not independently verified|warning/i);
  });

  it("uses the optional job and request answers in the next steps", () => {
    const result = analyze("Congratulations, you got the job! Pay the onboarding fee today to secure your position.");
    const advice = contextualAdvice(result, { "job-application": "no", "request-type": "pay_money" });
    expect(advice.additionalActions.join(" ")).toMatch(/unsolicited offer|pay a fee/i);
  });

  it("uses sender recognition to strengthen independent verification advice", () => {
    const result = analyze("Your invoice is overdue. Pay the balance immediately using this link.");
    const advice = contextualAdvice(result, { "sender-recognition": "unrecognized" });
    expect(advice.additionalActions.join(" ")).toMatch(/do not recognize the sender|verify the organization/i);
  });
});
