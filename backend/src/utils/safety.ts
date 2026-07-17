/**
 * Sanitizes user input to prevent prompt injection attacks
 */
export function sanitizeUserText(text: string): string {
  const injectionPatterns = [
    /ignore\s+previous\s+instructions/i,
    /reveal\s+the\s+system\s+prompt/i,
    /disregard\s+previous/i,
    /system\s+prompt/i,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(text)) {
      throw new Error("Potential prompt injection detected");
    }
  }

  return text.trim();
}

/**
 * Redacts sensitive information like Aadhaar numbers from logs
 */
export function redactedLog(text: string): string {
  // Aadhaar format: 4 digits, space, 4 digits, space, 4 digits
  return text.replace(/\d{4}\s+\d{4}\s+\d{4}/g, "REDACTED_AADHAAR");
}
