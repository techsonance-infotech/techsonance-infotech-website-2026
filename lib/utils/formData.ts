import type { Result } from "@/lib/result";

export type FormState<T = void> = {
  result: Result<T>;
  values: Record<string, string>;
};

export function formDataToObject(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const [key, value] of fd.entries()) {
    if (key.startsWith("$ACTION_")) continue;

    if (Object.prototype.hasOwnProperty.call(out, key)) {
      const existing = out[key];
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        out[key] = [existing, value];
      }
    } else {
      out[key] = value;
    }
  }

  return out;
}

const REDACT_KEY_RE = /pass|token|secret|card|cvc|otp/i;

export function echoValues(raw: Record<string, unknown>): Record<string, string> {
  const echoed: Record<string, string> = {};

  for (const [key, val] of Object.entries(raw)) {
    if (REDACT_KEY_RE.test(key)) continue;
    if (typeof val === "string") {
      echoed[key] = val;
    } else if (typeof val === "number" || typeof val === "boolean") {
      echoed[key] = String(val);
    }
  }

  return echoed;
}
