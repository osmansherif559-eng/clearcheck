import type { Finding, Observation } from "./types";
import { evidenceAround, firstMatch, hasAny, normalizeForMatching } from "./helpers";

const urgency = [/\burgent(?:ly)?\b/iu, /\bimmediately\b/iu, /\bwithin\s+\d+\s*(?:minutes?|hours?|days?)\b/iu, /\blast\s+warning\b/iu, /\bfinal\s+notice\b/iu];
const threats = [/account\s+(?:will be|has been)\s+(?:closed|suspended|locked)/iu, /\b(?:lose|forfeit)\s+(?:access|your account|the offer)\b/iu, /\baction\s+is\s+required\b/iu];
const requestLanguage = [/\bsend\b/iu, /\bshare\b/iu, /\bprovide\b/iu, /\bconfirm\b/iu, /\bclick\b/iu, /\bpay\b/iu, /\bverify\b/iu, /\buse\b/iu];
const credentialTerms = [/password/iu, /one[-\s]?time\s+(?:pass)?code/iu, /\b(?:otp|2fa|mfa)\s+code\b/iu, /verification\s+code/iu, /recovery\s+code/iu, /security\s+code/iu, /login\s+details/iu];
const paymentTerms = [/\b(?:pay|payment|fee|deposit|transfer|invoice|gift card|cryptocurrency|bitcoin|wire)\b/iu, /\baccount\s+details\b/iu];
const riskyPaymentMethods = [/gift\s+cards?/iu, /cryptocurrency|bitcoin|usdt/iu, /wire\s+transfer/iu, /unusual\s+(?:payment|transfer)/iu];
const impersonatedServices = [/\b(?:bank|credit union|government|tax office|delivery|courier|employer|recruiter|microsoft|amazon|paypal|netflix)\b/iu];
const channelChange = [/new\s+(?:number|account|payment details)/iu, /move\s+(?:this|the conversation)\s+to/iu, /contact\s+me\s+on\s+(?:whatsapp|telegram|signal)/iu, /keep\s+this\s+private/iu, /private\s+channel/iu];
const investmentTerms = [/\binvest(?:ment|ing)?\b/iu, /guaranteed\s+returns?/iu, /double\s+your\s+money/iu, /\b(?:crypto|cryptocurrency|bitcoin|usdt|wallet)\b/iu];
const familyEmergencyTerms = [/\b(?:mom|mum|dad|father|mother|son|daughter|grandma|grandmother|grandpa|grandfather|family)\b/iu, /emergency|stranded|hospital/iu];
const techSupportTerms = [/\b(?:microsoft|apple)\s+support\b/iu, /your\s+(?:computer|device)\s+(?:has|is infected|is at risk)/iu, /remote\s+support/iu, /virus\s+detected/iu];
const socialAlertTerms = [/\b(?:copyright|community guidelines|account recovery|social media|instagram|facebook|tiktok)\b/iu];
const downloadTerms = [/\b(?:download|attachment|install|open the (?:file|document))\b/iu];
const subscriptionTerms = [/\b(?:subscription|renewal|payment failed|billing)\b/iu];
const marketplaceTerms = [/\b(?:marketplace|buyer|seller|listing|shipping|overpaid)\b/iu];
const qrTerms = [/\b(?:qr|scan this code|scan the code)\b/iu];

function finding(
  id: string,
  title: string,
  severity: Finding["severity"],
  evidence: string,
  explanation: string,
  action: string,
  limitations?: string,
): Finding {
  return { id, title, severity, evidence, explanation, action, limitations };
}

export interface MessageAnalysis {
  findings: Finding[];
  observations: Observation[];
  unknowns: string[];
}

export function analyzeMessage(input: string): MessageAnalysis {
  const text = normalizeForMatching(input);
  const findings: Finding[] = [];
  const observations: Observation[] = [];
  const unknowns = [
    "ClearCheck cannot verify who sent the message, whether the account is genuine, or what happens after you respond.",
  ];

  const hasUrgency = hasAny(text, urgency);
  const hasThreat = hasAny(text, threats);
  const hasRequest = hasAny(text, requestLanguage);
  const hasCredential = hasAny(text, credentialTerms);
  const hasPayment = hasAny(text, paymentTerms);
  const hasRiskyPayment = hasAny(text, riskyPaymentMethods);
  const serviceMentioned = hasAny(text, impersonatedServices);

  if (hasUrgency && (hasThreat || hasRequest)) {
    const evidence = evidenceAround(text, [...threats, ...urgency]) ?? firstMatch(text, urgency[0]) ?? "Urgent language";
    findings.push(
      finding(
        "message.urgency-threat",
        "Pressure to act quickly",
        hasThreat ? "high" : "medium",
        evidence,
        "Artificial deadlines and consequences can push someone to act before independently checking the request.",
        "Pause. Verify the situation through an official app, website, or phone number you find independently.",
        "Urgent language can also appear in legitimate reminders, so it is stronger evidence when paired with a sensitive request or threat.",
      ),
    );
  }

  if (hasCredential && hasRequest) {
    const evidence = evidenceAround(text, credentialTerms) ?? "A request for a password or verification code";
    findings.push(
      finding(
        "message.credential-request",
        "Request for a password or authentication code",
        "high",
        evidence,
        "Legitimate services generally do not ask you to disclose passwords or one-time codes in an unsolicited message. A code can allow someone else to sign in.",
        "Do not share the code or password. Open the service through its official app or a trusted bookmark and check for alerts there.",
      ),
    );
  }

  if (hasPayment && (hasUrgency || hasThreat || hasRiskyPayment || /upfront|before\s+(?:starting|delivery|release)/iu.test(text) || (hasRequest && /(?:subscription|renewal|payment failed|refund|invoice|shipping|delivery)/iu.test(text)))) {
    const evidence = evidenceAround(text, [riskyPaymentMethods[0], riskyPaymentMethods[1], /upfront/iu, /payment/iu]) ?? "A payment request with pressure or unusual instructions";
    const jobFee = /job|position|employment|recruit/iu.test(text) && /fee|deposit|pay/iu.test(text);
    findings.push(
      finding(
        "message.payment-pressure",
        jobFee ? "Upfront payment tied to an opportunity" : "Payment request with pressure or unusual instructions",
        "high",
        evidence,
        jobFee
          ? "A legitimate employer should not require an unexplained fee before you can start work. Upfront payment is a consequential warning sign."
          : "Unexpected fees, gift cards, cryptocurrency, or urgent transfers are difficult to reverse and deserve independent verification.",
        "Do not send money or codes from this message. Verify the organization and payment request using contact details you locate independently.",
      ),
    );
  }

  if (serviceMentioned && (hasCredential || hasPayment || hasThreat)) {
    const evidence = evidenceAround(text, [...impersonatedServices, ...credentialTerms, ...paymentTerms, ...threats]) ?? "A service or organization name paired with a sensitive request";
    findings.push(
      finding(
        "message.impersonation",
        "Organization identity cannot be verified",
        "medium",
        evidence,
        "A familiar brand or authority name can be copied by anyone. The name alone does not prove that the message came from that organization.",
        "Do not use contact details or links in the message. Find the organization through a known-good channel and ask whether the request is real.",
      ),
    );
  }

  if (hasAny(text, channelChange) && (hasPayment || hasCredential || hasRequest)) {
    const evidence = evidenceAround(text, channelChange) ?? "A request to change the communication or payment channel";
    findings.push(
      finding(
        "message.channel-change",
        "Request to move the conversation or change details",
        "medium",
        evidence,
        "Moving a conversation to a private channel or changing payment details can remove the normal safety checks around the original service.",
        "Confirm the new number, account, or payment destination through a separate trusted channel before continuing.",
      ),
    );
  }

  if (hasAny(text, investmentTerms) && (hasPayment || hasRiskyPayment || hasUrgency)) {
    findings.push(
      finding(
        "message.investment-pressure",
        "Investment or cryptocurrency promise with a request",
        "high",
        evidenceAround(text, [...investmentTerms, ...paymentTerms, ...riskyPaymentMethods]) ?? "An investment or cryptocurrency request",
        "Guaranteed returns and requests to send money or cryptocurrency are common pressure tactics. A familiar investment term does not verify the opportunity.",
        "Do not send money or connect a wallet from this message. Verify the organization through an independently found regulator or official channel.",
      ),
    );
  }

  if (hasAny(text, familyEmergencyTerms) && (hasPayment || hasRiskyPayment || hasUrgency)) {
    findings.push(
      finding(
        "message.family-emergency",
        "Family emergency or impersonation pressure",
        "high",
        evidenceAround(text, [...familyEmergencyTerms, ...paymentTerms, ...urgency]) ?? "A family emergency paired with a request",
        "An urgent request that uses a family relationship can make it harder to pause and verify who is really contacting you.",
        "Contact the person through a number you already know. Do not send money or codes based only on this message.",
      ),
    );
  }

  if (hasAny(text, techSupportTerms) && (hasPayment || hasThreat || hasUrgency || /remote|call/iu.test(text))) {
    findings.push(
      finding(
        "message.tech-support",
        "Unexpected technical-support request",
        "high",
        evidenceAround(text, [...techSupportTerms, ...paymentTerms, ...threats]) ?? "A technical-support warning paired with a request",
        "Unexpected virus warnings, remote-access requests, or payment demands can give a stranger control of a device or account.",
        "Do not call the number or install remote-access software from the message. Use the device maker's official support site independently.",
      ),
    );
  }

  if (hasAny(text, socialAlertTerms) && (hasRequest || hasUrgency || hasCredential)) {
    findings.push(
      finding(
        "message.social-account-alert",
        "Social-media account alert with a verification request",
        "medium",
        evidenceAround(text, [...socialAlertTerms, ...credentialTerms, ...urgency]) ?? "A social-account alert paired with a request",
        "Copyright, policy, and recovery alerts can be copied to pressure people into signing in through an unexpected route.",
        "Open the platform's official app or type its known website yourself. Do not sign in through the message.",
      ),
    );
  }

  if (hasAny(text, downloadTerms) && (hasUrgency || hasThreat || /invoice|resume|document|attachment/iu.test(text))) {
    findings.push(
      finding(
        "message.download-lure",
        "Urgent download or attachment request",
        "high",
        evidenceAround(text, [...downloadTerms, ...urgency, ...threats]) ?? "An urgent download or attachment request",
        "Unexpected files can contain malware or lead to a fake sign-in page. The message context is not proof that a file is safe.",
        "Do not open or install the file. Confirm the sender and obtain the document through a trusted channel instead.",
      ),
    );
  }

  if (hasAny(text, qrTerms) && (hasRequest || hasUrgency || hasCredential || hasPayment)) {
    findings.push(
      finding(
        "message.qr-phishing",
        "QR code used to direct a sensitive action",
        "high",
        evidenceAround(text, [...qrTerms, ...credentialTerms, ...paymentTerms, ...urgency]) ?? "A QR code paired with a sensitive request",
        "A QR code can hide the destination until after it is scanned. That makes an unexpected sign-in or payment request harder to inspect first.",
        "Do not scan it for a sensitive action. Find the organization's official app or website independently.",
      ),
    );
  }

  if (hasAny(text, marketplaceTerms) && (hasPayment || hasRiskyPayment || hasUrgency)) {
    findings.push(
      finding(
        "message.marketplace-payment",
        "Marketplace payment or shipping pressure",
        "high",
        evidenceAround(text, [...marketplaceTerms, ...paymentTerms, ...urgency]) ?? "A marketplace payment request",
        "Marketplace conversations can be manipulated with fake buyers, sellers, overpayments, or shipping fees that move payment outside normal protections.",
        "Keep payment and delivery inside the marketplace's official process. Do not send a refund or fee to contact details in the message.",
      ),
    );
  }

  if (hasRequest && !hasCredential && !hasPayment && !hasUrgency && /\b(?:appointment|delivery|reservation|meeting)\b/iu.test(text)) {
    observations.push({ id: "message.routine-context", label: "Routine context", value: "The message contains a routine notification context without a matched sensitive request." });
  }

  if (hasCredential) observations.push({ id: "message.credential-term", label: "Authentication language", value: "The message mentions a password, code, or account credential." });
  if (hasPayment) observations.push({ id: "message.payment-term", label: "Payment language", value: "The message mentions money, fees, transfers, or payment details." });
  if (hasUrgency) observations.push({ id: "message.urgency-term", label: "Urgency language", value: "The message includes a deadline, threat, or pressure to act quickly." });

  return { findings, observations, unknowns };
}
