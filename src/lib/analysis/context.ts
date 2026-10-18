import type { AnalysisResult, Finding } from "./types";
import type { RecoveryScenario } from "@/lib/recovery-coach";

export const CONTEXT_VERSION = "1.0.0";

export type ContextQuestionId =
  | "expectedness"
  | "account-alert-expectedness"
  | "job-application"
  | "delivery-expectedness"
  | "sender-recognition"
  | "request-type"
  | "interaction-status"
  | "verification-route";

export interface ContextOption {
  value: string;
  label: string;
}

export interface ContextQuestion {
  id: ContextQuestionId;
  prompt: string;
  options: readonly ContextOption[];
}

export type ContextAnswers = Partial<Record<ContextQuestionId, string>>;

export interface ContextualAdvice {
  explanation: string;
  contextNote?: string;
  primaryAction: string;
  additionalActions: string[];
  recoveryScenario?: RecoveryScenario;
}

const expectedness: ContextQuestion = {
  id: "expectedness",
  prompt: "Were you expecting this message or link?",
  options: [
    { value: "expected", label: "Yes, I was expecting it." },
    { value: "unexpected", label: "No, it was unexpected." },
    { value: "unsure", label: "I’m not sure." },
  ],
};

const accountAlertExpectedness: ContextQuestion = {
  id: "account-alert-expectedness",
  prompt: "Were you expecting a security notification from this service?",
  options: [
    { value: "expected", label: "Yes, I was expecting it." },
    { value: "unexpected", label: "No, it was unexpected." },
    { value: "unsure", label: "I’m not sure." },
  ],
};

const jobApplication: ContextQuestion = {
  id: "job-application",
  prompt: "Did you apply for this position?",
  options: [
    { value: "yes", label: "Yes, I applied." },
    { value: "no", label: "No, I did not." },
    { value: "unsure", label: "I’m not sure." },
  ],
};

const deliveryExpectedness: ContextQuestion = {
  id: "delivery-expectedness",
  prompt: "Were you expecting a delivery?",
  options: [
    { value: "expected", label: "Yes, I was expecting one." },
    { value: "unexpected", label: "No, I was not." },
    { value: "unsure", label: "I’m not sure." },
  ],
};

const senderRecognition: ContextQuestion = {
  id: "sender-recognition",
  prompt: "Do you recognize the sender or organization?",
  options: [
    { value: "recognized", label: "Yes, I recognize them." },
    { value: "unrecognized", label: "No, I do not." },
    { value: "unsure", label: "I’m not sure." },
  ],
};

const requestType: ContextQuestion = {
  id: "request-type",
  prompt: "What is the message asking you to do?",
  options: [
    { value: "sign_in", label: "Sign in or verify an account." },
    { value: "share_code", label: "Share a code or personal information." },
    { value: "pay_money", label: "Pay money or a fee." },
    { value: "open_link", label: "Open a link or download a file." },
    { value: "other", label: "Something else." },
    { value: "unsure", label: "I’m not sure." },
  ],
};

const interactionStatus: ContextQuestion = {
  id: "interaction-status",
  prompt: "What have you done so far?",
  options: [
    { value: "nothing", label: "Nothing yet." },
    { value: "opened", label: "Opened the message or link." },
    { value: "replied", label: "Replied or called." },
    { value: "shared_credentials", label: "Shared login information." },
    { value: "shared_code", label: "Shared a one-time or recovery code." },
    { value: "shared_information", label: "Shared financial or identity information." },
    { value: "sent_money", label: "Sent money." },
    { value: "downloaded", label: "Downloaded or installed something." },
    { value: "unsure", label: "I’m not sure." },
  ],
};

const verificationRoute: ContextQuestion = {
  id: "verification-route",
  prompt: "Can you verify the request through a trusted channel you found yourself?",
  options: [
    { value: "yes", label: "Yes, I can verify it independently." },
    { value: "no", label: "No, I only have the details in this message." },
    { value: "unsure", label: "I’m not sure how." },
  ],
};

function textFor(result: AnalysisResult) {
  return [result.findings.map((finding) => `${finding.title} ${finding.evidence}`).join(" "), ...result.observations.map((observation) => observation.value)].join(" ").toLowerCase();
}

export function getContextQuestions(result: AnalysisResult): ContextQuestion[] {
  const text = textFor(result);
  const ids = new Set(result.findings.map((finding) => finding.id));

  if (/(?:job|position|employment|recruit|onboarding)/u.test(text)) return [jobApplication, interactionStatus];
  if (/(?:delivery|package|parcel|courier|shipment|tracking)/u.test(text)) return [deliveryExpectedness, interactionStatus];
  if (ids.has("message.credential-request") || /(?:password|verification code|otp|mfa|login)/u.test(text)) return [accountAlertExpectedness, interactionStatus];
  if (ids.has("message.payment-pressure") || /(?:payment|fee|invoice|refund|transfer|gift card|crypto)/u.test(text)) return [senderRecognition, interactionStatus];
  if (result.mode === "url" || result.analyzedLinks.length > 0) return [expectedness, verificationRoute];
  return [expectedness, requestType];
}

function firstFinding(result: AnalysisResult, predicate: (finding: Finding) => boolean) {
  return result.findings.find(predicate);
}

function recoveryFor(status: string | undefined): RecoveryScenario | undefined {
  const scenarios: Record<string, RecoveryScenario> = {
    shared_credentials: "credentials",
    shared_code: "otp_or_recovery_code",
    shared_information: "financial_or_identity_info",
    sent_money: "money_sent",
    downloaded: "download_or_install",
    opened: "opened_no_info",
    replied: "unsure",
    unsure: "unsure",
  };
  return scenarios[status ?? ""];
}

function contextActions(answers: ContextAnswers) {
  const actions: string[] = [];
  if (answers["job-application"] === "no") actions.push("Do not respond to or pay this unsolicited offer; verify openings through the employer’s official careers site.");
  if (answers["sender-recognition"] === "unrecognized") actions.push("Because you do not recognize the sender, verify the organization through a website or phone number you find yourself.");
  if (answers["request-type"] === "sign_in") actions.push("If you need to sign in, open the service through a bookmark or manually typed address instead of this message.");
  if (answers["request-type"] === "share_code") actions.push("Never share a one-time or recovery code with someone who contacted you unexpectedly.");
  if (answers["request-type"] === "pay_money") actions.push("Do not pay a fee or transfer money until the request is verified through an independent channel.");
  if (answers["request-type"] === "open_link") actions.push("Avoid opening links or downloading files from the message; navigate to the official service independently.");
  return actions;
}

export function contextualAdvice(result: AnalysisResult, answers: ContextAnswers): ContextualAdvice {
  const important = firstFinding(result, (finding) => finding.severity === "high") ?? result.findings[0];
  const unexpected = [answers.expectedness, answers["account-alert-expectedness"], answers["delivery-expectedness"]].includes("unexpected");
  const cannotVerify = answers["verification-route"] === "no";
  const status = answers["interaction-status"];
  const recoveryScenario = recoveryFor(status);
  const tailoredActions = contextActions(answers);
  const subject = result.mode === "url" ? "This link" : "This message";

  if (!important) {
    return {
      explanation: `${subject} did not match a major warning rule. That is not proof that it is safe; the sender, context, and destination still need independent checking.`,
      primaryAction: "Verify the sender through a trusted channel you find yourself.",
      additionalActions: Array.from(new Set(["Do not share sensitive information until you are confident who contacted you.", ...tailoredActions])),
      contextNote: unexpected || tailoredActions.length > 0 ? "Your answers add context, but they do not prove the message is genuine or fraudulent." : undefined,
    };
  }

  const explanation = `${subject} includes ${important.title.toLowerCase()}. ${important.explanation} ClearCheck has not independently verified the sender, website, or outcome.`;
  const additionalActions = [important.action];
  if (unexpected || cannotVerify) additionalActions.push("Because the request was unexpected or cannot be independently verified, do not use links or contact details from it.");
  additionalActions.push(...tailoredActions);
  if (recoveryScenario) additionalActions.push("Use the recovery coach for steps based on what you have already done.");

  return {
    explanation,
    primaryAction: important.action,
    additionalActions: Array.from(new Set(additionalActions)),
    recoveryScenario,
    contextNote: recoveryScenario
      ? "Your answer describes what happened after receiving the message. It does not change the observed evidence, but it changes which protective steps matter now."
      : unexpected || cannotVerify
        ? "Your answer adds context, but it does not prove the message is genuine or fraudulent."
        : undefined,
  };
}
