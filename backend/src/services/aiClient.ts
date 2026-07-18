import { config } from "../config.js";

export async function aiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${config.aiServiceUrl}${path}`;
  const timeoutMs = Number(process.env.AI_SERVICE_TIMEOUT_MS || 30000);
  const maxRetries = Number(process.env.AI_SERVICE_RETRIES || 2);

  const baseHeaders = {
    ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    ...(init?.headers || {}),
  } as Record<string, string>;

  let attempt = 0;

  while (true) {
    attempt++;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...init,
        headers: baseHeaders,
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "<unreadable response body>");
        const bodySnippet = typeof text === "string" ? text.slice(0, 2000) : String(text);

        // Retry on server errors (5xx)
        if (res.status >= 500 && attempt <= maxRetries) {
          const backoff = 300 * attempt;
          // small delay before retrying
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }

        throw new Error(`AI service error (${res.status}): ${bodySnippet}`);
      }

      // Prefer JSON but be resilient if content-type is missing/incorrect
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        return (await res.json()) as Promise<T>;
      }

      const text = await res.text();
      try {
        return JSON.parse(text) as T;
      } catch (e) {
        throw new Error(`AI service returned non-JSON response: ${text.slice(0, 2000)}`);
      }
    } catch (e: any) {
      // Handle abort (timeout) specially
      if (e.name === "AbortError") {
        if (attempt <= maxRetries) {
          await new Promise((r) => setTimeout(r, 300 * attempt));
          continue;
        }
        throw new Error(`AI service request timed out after ${timeoutMs}ms`);
      }

      // Retry on transient network / 5xx-like errors
      const msg = (e && e.message) || String(e);
      if (attempt <= maxRetries && /network|fetch|timeout|ECONNRESET|ECONNREFUSED|EHOSTUNREACH|5\d{2}/i.test(msg)) {
        await new Promise((r) => setTimeout(r, 300 * attempt));
        continue;
      }

      throw e;
    } finally {
      clearTimeout(timeout);
    }
  }
}
