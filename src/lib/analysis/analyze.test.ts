import { describe, expect, it } from "vitest";
import { analyze, validateInput } from "./analyze";

describe("ClearCheck analysis", () => {
  it("flags an urgent authentication-code request with evidence and an action", () => {
    const result = analyze("URGENT: Your bank account will be locked today. Send us your one-time verification code now.");

    expect(result.assessment).toBe("high_concern");
    expect(result.findings.map((finding) => finding.id)).toEqual(expect.arrayContaining([
      "message.urgency-threat",
      "message.credential-request",
      "message.impersonation",
    ]));
    expect(result.findings.some((finding) => finding.evidence.includes("verification code"))).toBe(true);
    expect(result.recommendedActions.some((action) => action.includes("Do not share"))).toBe(true);
  });

  it("flags an upfront recruitment fee", () => {
    const result = analyze("Congratulations, you got the job! Pay the $250 onboarding fee upfront today to secure your position.");

    expect(result.assessment).toBe("high_concern");
    expect(result.findings.some((finding) => finding.title.includes("Upfront payment"))).toBe(true);
  });

  it("does not overreact to a routine appointment reminder", () => {
    const result = analyze("Reminder: your dental appointment is tomorrow at 10:00 AM. Reply YES to confirm.");

    expect(result.assessment).toBe("no_major_indicators");
    expect(result.findings).toHaveLength(0);
  });

  it("inspects a deceptive hostname without opening it", () => {
    const result = analyze("https://paypal-login.example.net/verify", "url");

    expect(result.mode).toBe("url");
    expect(result.findings.some((finding) => finding.id === "url.lookalike-brand")).toBe(true);
    expect(result.unknowns.some((unknown) => unknown.includes("DNS lookup"))).toBe(true);
  });

  it("accepts a legitimate long URL without treating length as proof of danger", () => {
    const result = analyze("https://example.com/calendar/appointments/2026/10/17/confirm?invite=abc123&source=calendar", "url");

    expect(result.findings).toHaveLength(0);
    expect(result.assessment).toBe("no_major_indicators");
  });

  it("handles malformed URLs and invalid input clearly", () => {
    expect(analyze("not a valid URL", "url").findings[0]?.id).toBe("url.invalid");
    expect(validateInput("", "auto")).toBeTruthy();
    expect(validateInput("x".repeat(12_001), "message")).toContain("12,000");
  });

  it("finds links embedded in a message", () => {
    const result = analyze("Please verify your account at https://192.0.2.8/login immediately.");

    expect(result.observations.some((observation) => observation.id === "message.url-count")).toBe(true);
    expect(result.findings.some((finding) => finding.id === "url.ip-host")).toBe(true);
  });
});
