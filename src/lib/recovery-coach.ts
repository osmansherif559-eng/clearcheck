export type RecoveryScenario =
  | "not_clicked_or_responded"
  | "opened_no_info"
  | "credentials"
  | "otp_or_recovery_code"
  | "financial_or_identity_info"
  | "money_sent"
  | "download_or_install"
  | "unsure";

export type RecoveryUrgency = "critical" | "high" | "medium" | "low";

export interface RecoveryIncidentDetails {
  scenario?: RecoveryScenario | null;
}

export interface RecoveryStep {
  id: string;
  priority: number;
  title: string;
  whyItMatters: string;
  guidance: string;
  urgency: RecoveryUrgency;
  officialChannelCaveat: string;
}

export interface RecoveryChecklist {
  scenario: RecoveryScenario;
  scenarioLabel: string;
  steps: RecoveryStep[];
}

export type RecoveryCoachInput = RecoveryScenario | RecoveryIncidentDetails | null | undefined;

export const RECOVERY_SCENARIOS: readonly RecoveryScenario[] = Object.freeze([
  "not_clicked_or_responded",
  "opened_no_info",
  "credentials",
  "otp_or_recovery_code",
  "financial_or_identity_info",
  "money_sent",
  "download_or_install",
  "unsure",
]);

export const RECOVERY_SCENARIO_LABELS: Readonly<Record<RecoveryScenario, string>> = Object.freeze({
  not_clicked_or_responded: "Did not click or respond",
  opened_no_info: "Opened it, but shared no information",
  credentials: "Shared credentials",
  otp_or_recovery_code: "Shared an OTP or recovery code",
  financial_or_identity_info: "Shared financial or identity information",
  money_sent: "Sent money",
  download_or_install: "Downloaded or installed something",
  unsure: "Not sure what happened",
});

export const OFFICIAL_CHANNEL_CAVEAT =
  "Use the service's official app, a website you type yourself, or a phone number from a statement or card. Do not use links or contact details from the suspicious message.";

type RecoveryStepTemplate = Omit<RecoveryStep, "officialChannelCaveat">;

const STEP_LIBRARY: Readonly<Record<RecoveryScenario, readonly RecoveryStepTemplate[]>> = {
  not_clicked_or_responded: [
    {
      id: "pause-contact",
      priority: 1,
      title: "Stop the conversation and do not interact further",
      whyItMatters: "A suspicious sender may use a reply or a click to confirm that your address or phone number is active.",
      guidance: "Do not click, reply, call, forward, or provide information. Keep the message available until you have recorded what happened, then block or report it.",
      urgency: "medium",
    },
    {
      id: "preserve-message",
      priority: 2,
      title: "Preserve the message details",
      whyItMatters: "The sender, timestamp, request, and any link can help an official service or reporting channel investigate.",
      guidance: "Save a screenshot or the original message without opening links or attachments. Note what the sender asked you to do.",
      urgency: "low",
    },
    {
      id: "verify-concern",
      priority: 3,
      title: "Verify any claimed problem independently",
      whyItMatters: "An account problem may be real, but the message is not proof that the sender is legitimate.",
      guidance: "If the message claims an account issue, open the known app or type the known address yourself and check for alerts there.",
      urgency: "low",
    },
  ],
  opened_no_info: [
    {
      id: "close-without-submitting",
      priority: 1,
      title: "Close the page and submit nothing",
      whyItMatters: "Stopping before entering information limits what the sender can use, even if the page looked convincing.",
      guidance: "Close the tab or message, do not enter or confirm any details, and do not call numbers shown on the page.",
      urgency: "medium",
    },
    {
      id: "check-for-downloads",
      priority: 2,
      title: "Check whether anything downloaded",
      whyItMatters: "A file or browser prompt can create a separate risk even when no information was submitted.",
      guidance: "Review the device's download list and installed-app list. Do not open an unexpected file or approve a prompt you do not recognize.",
      urgency: "medium",
    },
    {
      id: "verify-account-directly",
      priority: 3,
      title: "Check the claimed account through a known route",
      whyItMatters: "Independent verification separates a real service alert from a deceptive page or message.",
      guidance: "Use the official app or a known bookmark and look for security notifications. If nothing is there, treat the message as suspicious.",
      urgency: "low",
    },
  ],
  credentials: [
    {
      id: "change-password",
      priority: 1,
      title: "Change the exposed password immediately",
      whyItMatters: "Someone with the password may be able to sign in, impersonate you, or test it on other services.",
      guidance: "From a known-clean device, sign in through the official service and set a new, unique password. Do not reuse the exposed password.",
      urgency: "critical",
    },
    {
      id: "revoke-sessions",
      priority: 2,
      title: "Sign out other sessions and review account access",
      whyItMatters: "Changing a password may not end sessions or remove an attacker who is already signed in.",
      guidance: "Use the account's security settings to sign out other devices, remove unfamiliar recovery methods, and review recent sign-ins.",
      urgency: "high",
    },
    {
      id: "secure-reused-passwords",
      priority: 3,
      title: "Protect every account that reused the password",
      whyItMatters: "Password reuse lets one exposed password unlock several accounts.",
      guidance: "Change reused passwords on other accounts, starting with email, banking, and accounts that can reset other passwords.",
      urgency: "high",
    },
    {
      id: "enable-multifactor",
      priority: 4,
      title: "Turn on multifactor protection",
      whyItMatters: "A second factor can reduce the chance that a stolen password is enough to regain access.",
      guidance: "Enable the service's built-in multifactor option and save recovery methods in a secure place. Never share a code with another person.",
      urgency: "medium",
    },
  ],
  otp_or_recovery_code: [
    {
      id: "contact-account-provider",
      priority: 1,
      title: "Contact the account provider about the exposed code",
      whyItMatters: "A one-time password or recovery code can authorize a sign-in or account reset while it is valid.",
      guidance: "Tell the provider that an authentication or recovery code was exposed and ask them to secure the account and review recent access.",
      urgency: "critical",
    },
    {
      id: "change-account-password",
      priority: 2,
      title: "Change the account password and end active sessions",
      whyItMatters: "The code may have been used alongside a password or may have helped an attacker establish a session.",
      guidance: "Use the official account security page to change the password, sign out other sessions, and remove unfamiliar devices or recovery options.",
      urgency: "critical",
    },
    {
      id: "reset-authentication-method",
      priority: 3,
      title: "Replace compromised authentication or recovery methods",
      whyItMatters: "An attacker may have changed a recovery email, phone number, authenticator, or backup-code set.",
      guidance: "Review multifactor settings, generate new recovery codes, and remove any method you do not recognize. Keep new codes private.",
      urgency: "high",
    },
    {
      id: "check-mobile-account",
      priority: 4,
      title: "Check for signs of phone-number takeover",
      whyItMatters: "Unexpected loss of service or a carrier notice can indicate that text-message authentication is being redirected.",
      guidance: "If your phone suddenly loses service or you receive an unexpected SIM-change notice, contact your mobile carrier's fraud or security team.",
      urgency: "high",
    },
  ],
  financial_or_identity_info: [
    {
      id: "contact-financial-institution",
      priority: 1,
      title: "Contact the relevant financial institution or issuer",
      whyItMatters: "Exposed card, bank, tax, or identity details can be used for unauthorized transactions or impersonation.",
      guidance: "Ask the bank, card issuer, or relevant institution to place protective controls on the account and tell you which details need replacement.",
      urgency: "critical",
    },
    {
      id: "protect-credit-identity",
      priority: 2,
      title: "Use available identity-protection controls",
      whyItMatters: "A fraud alert, credit freeze, or equivalent local control can make new-account fraud harder.",
      guidance: "Use the official credit bureau or government identity-protection service for your country and follow its current instructions.",
      urgency: "high",
    },
    {
      id: "replace-identity-documents",
      priority: 3,
      title: "Ask whether identity documents or numbers need replacement",
      whyItMatters: "Some exposed identifiers cannot be changed like passwords and may need an issuer-led response.",
      guidance: "Contact the issuing agency through its official channel to report exposed documents or identification numbers and ask about replacement.",
      urgency: "high",
    },
    {
      id: "monitor-financial-accounts",
      priority: 4,
      title: "Monitor statements and account alerts",
      whyItMatters: "Early notice of an unauthorized transaction or account change improves the chance of stopping or disputing it.",
      guidance: "Review recent activity, turn on transaction alerts, and report anything unfamiliar as soon as it appears.",
      urgency: "medium",
    },
  ],
  money_sent: [
    {
      id: "request-transfer-reversal",
      priority: 1,
      title: "Contact the payment provider immediately",
      whyItMatters: "A bank or payment provider may be able to stop, recall, or flag a transfer before it is completed.",
      guidance: "Use the provider's fraud process and give the transaction time, amount, recipient, and reference details. Ask whether a recall or dispute is available.",
      urgency: "critical",
    },
    {
      id: "preserve-payment-evidence",
      priority: 2,
      title: "Preserve payment and conversation evidence",
      whyItMatters: "Transaction records and messages help the provider and official reporting channels understand what happened.",
      guidance: "Save receipts, confirmation numbers, recipient details, messages, and screenshots. Do not delete the conversation until you have recorded it.",
      urgency: "high",
    },
    {
      id: "secure-funding-account",
      priority: 3,
      title: "Secure the account used to send the money",
      whyItMatters: "A scammer who also has account access may attempt additional transfers or password resets.",
      guidance: "Change exposed credentials, sign out other sessions, review payees and transfers, and report unfamiliar activity to the institution.",
      urgency: "high",
    },
    {
      id: "avoid-recovery-scam",
      priority: 4,
      title: "Reject anyone offering to recover the money for a fee",
      whyItMatters: "Victims are often targeted again by people promising refunds in exchange for another payment or more information.",
      guidance: "Use only the payment provider's existing fraud case or an official reporting agency. Do not pay a recovery service that contacts you unexpectedly.",
      urgency: "medium",
    },
  ],
  download_or_install: [
    {
      id: "isolate-suspicious-device",
      priority: 1,
      title: "Disconnect a suspicious device from networks",
      whyItMatters: "A malicious app or remote-access tool may continue sending data or allowing control while connected.",
      guidance: "If the device is behaving unexpectedly or someone had remote access, disconnect Wi-Fi and mobile data and stop using it for sensitive accounts until checked.",
      urgency: "critical",
    },
    {
      id: "run-security-check",
      priority: 2,
      title: "Run the device's trusted security check",
      whyItMatters: "A security scan or platform safety check can identify an unwanted app without relying on the installer's instructions.",
      guidance: "Use built-in security tools or a trusted professional. Do not install a second unknown cleaner or follow removal instructions from the suspicious contact.",
      urgency: "high",
    },
    {
      id: "change-passwords-clean-device",
      priority: 3,
      title: "Change sensitive passwords from a clean device",
      whyItMatters: "A compromised device could capture new passwords, payment details, or recovery codes entered on it.",
      guidance: "Use another trusted device to secure email, financial, and other important accounts, then review sessions and multifactor settings.",
      urgency: "high",
    },
    {
      id: "seek-device-support",
      priority: 4,
      title: "Get trusted device support before reconnecting",
      whyItMatters: "A professional can help preserve needed data and remove persistent access without guessing at risky cleanup steps.",
      guidance: "Contact the device maker, operating-system provider, workplace support team, or a reputable local technician through a known channel.",
      urgency: "medium",
    },
  ],
  unsure: [
    {
      id: "pause-and-protect",
      priority: 1,
      title: "Pause and do not send anything else",
      whyItMatters: "Stopping further clicks, replies, payments, and disclosures limits additional exposure while the facts are unclear.",
      guidance: "Do not follow new instructions from the contact. Do not share passwords, codes, identity details, or payment information to prove a claim.",
      urgency: "high",
    },
    {
      id: "write-down-what-happened",
      priority: 2,
      title: "Write down exactly what happened",
      whyItMatters: "Small details—what was opened, shared, installed, or paid—determine which recovery action is most urgent.",
      guidance: "Record the sender, time, links, files, information shared, device used, and any transaction reference. Do not revisit a suspicious link to investigate.",
      urgency: "medium",
    },
    {
      id: "check-important-accounts",
      priority: 3,
      title: "Check important accounts through known channels",
      whyItMatters: "An unfamiliar sign-in, password reset, transaction, or device can reveal exposure even when the incident is uncertain.",
      guidance: "Review email, financial, and other high-value accounts using their official apps or typed addresses. Secure any account showing unexpected activity.",
      urgency: "medium",
    },
    {
      id: "get-official-help",
      priority: 4,
      title: "Ask an official support or fraud team for guidance",
      whyItMatters: "The service involved can confirm which controls, disputes, or account-recovery steps apply to your situation.",
      guidance: "Describe only the facts you know and ask what to do next. You can return to this checklist after clarifying whether information, codes, money, or software were involved.",
      urgency: "low",
    },
  ],
};

export function isRecoveryScenario(value: unknown): value is RecoveryScenario {
  return typeof value === "string" && (RECOVERY_SCENARIOS as readonly string[]).includes(value);
}

export function normalizeRecoveryScenario(value: unknown): RecoveryScenario {
  return isRecoveryScenario(value) ? value : "unsure";
}

function scenarioFromInput(input: RecoveryCoachInput): RecoveryScenario {
  if (isRecoveryScenario(input)) return input;
  if (input !== null && typeof input === "object") return normalizeRecoveryScenario(input.scenario);
  return "unsure";
}

export function selectScenario(scenario: RecoveryScenario): RecoveryIncidentDetails {
  return { scenario };
}

export function resetIncidentDetails(): RecoveryIncidentDetails {
  return {};
}

export const selectRecoveryScenario = selectScenario;
export const resetRecoveryScenario = resetIncidentDetails;

export function getRecoveryChecklist(input?: RecoveryCoachInput): RecoveryChecklist {
  const scenario = scenarioFromInput(input);
  const orderedSteps = STEP_LIBRARY[scenario]
    .map((template, order): RecoveryStep & { order: number } => ({
      ...template,
      officialChannelCaveat: OFFICIAL_CHANNEL_CAVEAT,
      order,
    }))
    .sort((left, right) => left.priority - right.priority || left.order - right.order);

  const steps = orderedSteps.map(({ order: _order, ...step }) => step);

  return {
    scenario,
    scenarioLabel: RECOVERY_SCENARIO_LABELS[scenario],
    steps,
  };
}
