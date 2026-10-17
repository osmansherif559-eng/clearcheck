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
    expect(result.analyzedLinks).toHaveLength(1);
    expect(result.analyzedLinks[0]?.url).toBe("https://paypal-login.example.net/verify");
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

  it("analyzes each embedded link with its own observations and hostname breakdown", () => {
    const firstUrl = "https://192.0.2.8/login";
    const secondUrl = "https://paypal-login.example.net/verify";
    const result = analyze(`Review ${firstUrl} and then ${secondUrl}.`);

    expect(result.analyzedLinks).toHaveLength(2);
    expect(result.analyzedLinks.map((link) => link.url)).toEqual([firstUrl, secondUrl]);
    expect(result.analyzedLinks[0]?.findings.map((finding) => finding.id)).toContain("url.ip-host");
    expect(result.analyzedLinks[1]?.findings.map((finding) => finding.id)).toContain("url.lookalike-brand");
    expect(result.analyzedLinks[0]?.observations.map((observation) => observation.id)).toEqual(expect.arrayContaining(["url.scheme", "url.hostname", "url.https"]));
    expect(result.analyzedLinks[0]?.hostnameBreakdown).toEqual({
      hostname: "192.0.2.8",
      labels: ["192", "0", "2", "8"],
      labelCount: 4,
      isIpAddress: true,
    });
    expect(result.observations.find((observation) => observation.id === "message.url-count")?.value).toBe("2 URLs detected in the input.");
  });

  it("attributes every URL finding to the exact URL that produced it", () => {
    const firstUrl = "https://192.0.2.8/first";
    const secondUrl = "https://198.51.100.7/second";
    const result = analyze(`Links: ${firstUrl}, ${secondUrl}.`);

    expect(result.analyzedLinks.flatMap((link) => link.findings.map((finding) => finding.evidence))).toEqual([firstUrl, secondUrl]);
    expect(result.findings.filter((finding) => finding.id === "url.ip-host").map((finding) => finding.evidence)).toEqual([firstUrl, secondUrl]);
  });

  it("does not flag legitimate trusted or long URLs solely because they are URLs", () => {
    const result = analyze("Use https://paypal.com/account and https://example.com/calendar/appointments/2026/10/17/confirm?invite=abc123&source=calendar");

    expect(result.analyzedLinks).toHaveLength(2);
    expect(result.analyzedLinks.every((link) => link.findings.length === 0)).toBe(true);
    expect(result.findings.filter((finding) => finding.id.startsWith("url.")).map((finding) => finding.id)).toEqual([]);
    expect(result.assessment).toBe("no_major_indicators");
  });

  it("keeps network and reputation checks explicit as unknowns for every link", () => {
    const firstUrl = "https://example.com/notice";
    const secondUrl = "https://bit.ly/example";
    const result = analyze(`${firstUrl} ${secondUrl}`);

    expect(result.unknowns).toEqual(expect.arrayContaining([
      expect.stringContaining("No DNS lookup"),
      expect.stringContaining("HTTPS encrypts"),
    ]));
    expect(result.analyzedLinks.every((link) => link.unknowns.some((unknown) => unknown.includes("No DNS lookup")))).toBe(true);
    expect(result.analyzedLinks[1]?.findings[0]?.evidence).toBe(secondUrl);
  });
});
