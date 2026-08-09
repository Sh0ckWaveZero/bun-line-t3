export const PUBLIC_AUTH_ERROR_CODES = [
  "invalid_code",
  "line_oauth",
  "please_restart_the_process",
  "state_mismatch",
] as const;

export type PublicAuthErrorCode = (typeof PUBLIC_AUTH_ERROR_CODES)[number];

const publicAuthErrorCodeSet = new Set<string>(PUBLIC_AUTH_ERROR_CODES);

export const getPublicAuthErrorCode = (value: unknown): PublicAuthErrorCode => {
  if (typeof value !== "string" || !publicAuthErrorCodeSet.has(value)) {
    return "line_oauth";
  }

  return value as PublicAuthErrorCode;
};
