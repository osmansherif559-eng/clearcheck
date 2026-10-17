import type { Finding, Observation } from "./types";
import { extractUrls, firstMatch, uniqueStrings } from "./helpers";

const SHORTENERS = new Set(["bit.ly", "tinyurl.com", "t.co", "is.gd", "ow.ly", "lnkd.in"]);
const BRAND_DOMAINS: Record<string, string[]> = {
  amazon: ["amazon.com", "amazon.co.uk"],
  microsoft: ["microsoft.com"],
  paypal: ["paypal.com"],
  netflix: ["netflix.com"],
  google: ["google.com"],
  apple: ["apple.com"],
  linkedin: ["linkedin.com"],
};

export interface UrlAnalysis {
  findings: Finding[];
  observations: Observation[];
  unknowns: string[];
}

function asUrl(value: string): URL | undefined {
  const trimmed = value.trim();
  const candidate = /^www\./iu.test(trimmed) ? `https://${trimmed}` : trimmed;
  try {
    return new URL(candidate);
  } catch {
    return undefined;
  }
}

function urlFinding(
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

function isTrustedBrandHost(hostname: string, brand: string): boolean {
  return BRAND_DOMAINS[brand]?.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`)) ?? false;
}

export function analyzeUrl(input: string): UrlAnalysis {
  const findings: Finding[] = [];
  const observations: Observation[] = [];
  const unknowns = [
    "No DNS lookup, redirect following, page download, reputation check, or domain ownership check was performed.",
    "HTTPS encrypts the connection but does not prove that the destination is trustworthy.",
  ];
  const url = asUrl(input);

  if (!url) {
    return {
      findings: [
        urlFinding(
          "url.invalid",
          "This does not look like a complete URL",
          "medium",
          input.trim().slice(0, 180),
          "ClearCheck could not parse the input with the standard URL parser. A typo or missing scheme can change where a link goes.",
          "Do not open it. If you need to investigate it, copy the full address from the original source and inspect it again.",
        ),
      ],
      observations,
      unknowns,
    };
  }

  const hostname = url.hostname.toLowerCase();
  const hostEvidence = url.host || hostname;
  observations.push({ id: "url.scheme", label: "Connection scheme", value: url.protocol.replace(":", "").toUpperCase() });
  observations.push({ id: "url.hostname", label: "Parsed hostname", value: hostname });

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    findings.push(
      urlFinding(
        "url.unsupported-scheme",
        "The link uses a non-web scheme",
        "high",
        url.protocol,
        "This address does not use the normal web protocols. Custom schemes can launch apps or actions that are harder to inspect safely.",
        "Do not open it from the message. Find the service's official app or website independently instead.",
      ),
    );
  }

  if (url.username || url.password) {
    findings.push(
      urlFinding(
        "url.embedded-credentials",
        "The URL contains embedded login information",
        "high",
        `${url.username}${url.password ? ":••••" : ""}@${hostname}`,
        "Text before the @ symbol can disguise the real destination or expose credentials in the address itself.",
        "Do not open or copy credentials from this link. Navigate to the service independently and sign in there.",
      ),
    );
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/u.test(hostname) || hostname.includes(":")) {
    findings.push(
      urlFinding(
        "url.ip-host",
        "The destination is an IP address, not a recognizable domain",
        "high",
        hostEvidence,
        "An IP address can be used for a temporary or disposable destination. It does not identify an organization in the way a verified domain name can.",
        "Do not sign in or pay through this link. Find the organization's official site independently.",
      ),
    );
  }

  if (hostname.includes("xn--")) {
    findings.push(
      urlFinding(
        "url.punycode",
        "The hostname uses encoded international characters",
        "medium",
        hostname,
        "Punycode can be legitimate, but visually similar characters can also make a lookalike domain harder to recognize.",
        "Treat the link cautiously and type the expected service address yourself instead of opening this one.",
      ),
    );
  }

  if (url.port && !["80", "443"].includes(url.port)) {
    findings.push(
      urlFinding(
        "url.unusual-port",
        "The URL uses an unusual port",
        "medium",
        `${hostname}:${url.port}`,
        "A non-standard port can be legitimate, but it is unusual for a normal public sign-in or payment link and deserves verification.",
        "Do not enter sensitive information. Verify the destination through a trusted route.",
      ),
    );
  }

  const labels = hostname.split(".").filter(Boolean);
  if (labels.length >= 5) {
    findings.push(
      urlFinding(
        "url.deep-subdomain",
        "The hostname has an unusually deep subdomain structure",
        "medium",
        hostname,
        "Long chains of subdomains can make the actual registrable domain harder to notice. The final domain owner controls the destination.",
        "Read the hostname from right to left and independently navigate to the expected service instead.",
      ),
    );
  }

  for (const [brand, domains] of Object.entries(BRAND_DOMAINS)) {
    if (hostname.includes(brand) && !isTrustedBrandHost(hostname, brand)) {
      findings.push(
        urlFinding(
          "url.lookalike-brand",
          "The hostname contains a recognizable brand name",
          "medium",
          hostname,
          `The name “${brand}” appears in the hostname, but the parsed domain is not one of the familiar ${brand} domains configured for this check. A brand name in a subdomain or path is not proof of ownership.`,
          "Do not use the link for sign-in or payment. Type the organization's known address or use its official app.",
        ),
      );
      break;
    }
  }

  if (SHORTENERS.has(hostname)) {
    findings.push(
      urlFinding(
        "url.shortener",
        "The link hides its final destination",
        "medium",
        hostname,
        "A URL shortener can be used for legitimate sharing, but the final destination cannot be inspected without following the redirect.",
        "Do not open it if you were not expecting it. Find the destination through a trusted source instead.",
        "ClearCheck does not follow redirects in order to preserve privacy and avoid contacting arbitrary sites.",
      ),
    );
  }

  if (url.pathname.length > 180 || url.search.length > 220 || url.searchParams.size >= 7) {
    observations.push({ id: "url.complexity", label: "URL structure", value: "The address has a long path or many query parameters." });
    unknowns.push("A long URL can be legitimate; ClearCheck cannot infer the page's purpose without opening it.");
  }

  if (url.protocol === "https:") {
    observations.push({ id: "url.https", label: "Transport", value: "The link uses HTTPS, which encrypts the connection." });
  }

  return { findings, observations, unknowns: uniqueStrings(unknowns) };
}

export function analyzeUrlsInText(input: string): UrlAnalysis {
  const urls = extractUrls(input);
  if (urls.length === 0) return { findings: [], observations: [], unknowns: [] };

  const all = urls.map(analyzeUrl);
  return {
    findings: all.flatMap((result) => result.findings.map((finding) => ({ ...finding, evidence: firstMatch(input, new RegExp(escapeRegExp(finding.evidence), "iu")) ?? finding.evidence }))),
    observations: [
      { id: "message.url-count", label: "Links found", value: `${urls.length} URL${urls.length === 1 ? "" : "s"} detected in the input.` },
      ...all.flatMap((result) => result.observations),
    ],
    unknowns: uniqueStrings(all.flatMap((result) => result.unknowns)),
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
