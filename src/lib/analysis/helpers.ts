export const MAX_INPUT_LENGTH = 12_000;

export function normalizeForMatching(input: string): string {
  return input.normalize("NFKC").replace(/\s+/gu, " ").trim();
}

export function excerpt(input: string, start: number, end: number): string {
  const originalStart = Math.max(0, start);
  const originalEnd = Math.min(input.length, end);
  const raw = input.slice(originalStart, originalEnd).replace(/\s+/gu, " ").trim();
  if (raw.length <= 180) return raw;
  return `${raw.slice(0, 177).trim()}…`;
}

export function firstMatch(input: string, pattern: RegExp): string | undefined {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const match = new RegExp(pattern.source, flags).exec(input);
  if (!match || match.index === undefined) return undefined;
  return excerpt(input, match.index, match.index + match[0].length);
}

export function evidenceAround(input: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`).exec(input);
    if (match?.index !== undefined) {
      const start = Math.max(0, match.index - 42);
      const end = Math.min(input.length, match.index + match[0].length + 72);
      return excerpt(input, start, end);
    }
  }
  return undefined;
}

export function hasAny(input: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(input));
}

export function extractUrls(input: string): string[] {
  const matches = input.match(/(?:https?:\/\/|www\.)[^\s<>'"`]+/giu) ?? [];
  return matches
    .flatMap(splitAdjacentUrlCandidates)
    .map((value) => value.replace(/[),.;!?]+$/u, ""))
    .filter(Boolean);
}

function splitAdjacentUrlCandidates(value: string): string[] {
  const starts = Array.from(value.matchAll(/(?:https?:\/\/|www\.)/giu))
    .map((match) => ({ index: match.index ?? 0, isWww: match[0].toLowerCase() === "www." }))
    .filter(({ index, isWww }) => index > 0 && (isWww ? /[,;!?)]/u : /[,.;!?)]/u).test(value[index - 1] ?? ""))
    .map(({ index }) => index);
  if (starts.length === 0) return [value];

  const parts: string[] = [];
  let partStart = 0;
  for (const start of starts) {
    parts.push(value.slice(partStart, start));
    partStart = start;
  }
  parts.push(value.slice(partStart));
  return parts;
}

export function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}
