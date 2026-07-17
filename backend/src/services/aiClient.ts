import { config } from "../config.js";

export async function aiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${config.aiServiceUrl}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI service error (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}
