/**
 * Lightweight prompt-injection / abuse filters before forwarding to AI.
 */
const BLOCK_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s*prompt/i,
  /disclose\s+(your|the)\s+(system|hidden)\s+prompt/i,
  /<\s*script\b/i,
];

export function sanitizeUserText(input: string, maxLen = 8000): string {
  const trimmed = input.trim().slice(0, maxLen);
  for (const pattern of BLOCK_PATTERNS) {
    if (pattern.test(trimmed)) {
      throw new Error("Message rejected by safety filters. Please rephrase your question.");
    }
  }
  return trimmed;
}

export function redactedLog(message: string): string {
  return message
    .replace(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, "[REDACTED_AADHAAR]")
    .replace(/\b[A-Z]{5}\d{4}[A-Z]\b/gi, "[REDACTED_PAN]");
}
