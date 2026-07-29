export function ensureGigTitlePrefix(value: string | null | undefined) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "I will do Student Support";

  const normalized = trimmed.toLowerCase();
  if (normalized.startsWith("i will ")) {
    return trimmed;
  }

  return `I will do ${trimmed}`;
}
