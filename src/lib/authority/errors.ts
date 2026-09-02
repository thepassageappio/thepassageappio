export type AuthorityErrorCode =
  | "INVALID_TRANSITION"
  | "UNAUTHORIZED_ACTOR"
  | "STALE_VERSION"
  | "INVALID_COMMAND"
  | "REQUIREMENT_FAILED"
  | "WEBHOOK_NOT_REPLAYABLE"
  | "NOT_FOUND";

export class AuthorityError extends Error {
  readonly code: AuthorityErrorCode;
  readonly status: number;

  constructor(message: string, code: AuthorityErrorCode, status: number) {
    super(message);
    this.name = "AuthorityError";
    this.code = code;
    this.status = status;
  }
}

const authorityErrorCodes = new Set<AuthorityErrorCode>([
  "INVALID_TRANSITION",
  "UNAUTHORIZED_ACTOR",
  "STALE_VERSION",
  "INVALID_COMMAND",
  "REQUIREMENT_FAILED",
  "WEBHOOK_NOT_REPLAYABLE",
  "NOT_FOUND",
]);

export function isAuthorityError(error: unknown): error is AuthorityError {
  if (!error || typeof error !== "object") return false;
  const candidate = error as Partial<AuthorityError>;
  return (
    candidate.name === "AuthorityError" &&
    typeof candidate.message === "string" &&
    typeof candidate.status === "number" &&
    typeof candidate.code === "string" &&
    authorityErrorCodes.has(candidate.code as AuthorityErrorCode)
  );
}
