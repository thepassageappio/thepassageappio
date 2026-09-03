import { AuthorityError } from "./errors.ts";

export function isLocalAuthoritySandboxAvailable(nodeEnv = process.env.NODE_ENV) {
  return nodeEnv !== "production";
}

export function requireLocalAuthoritySandbox(nodeEnv = process.env.NODE_ENV) {
  if (!isLocalAuthoritySandboxAvailable(nodeEnv)) {
    throw new AuthorityError("The local sample environment is not available.", "NOT_FOUND", 404);
  }
}

export function localAuthoritySandboxNotFoundResponse() {
  return Response.json(
    { error: { code: "NOT_FOUND", message: "The requested resource is not available." } },
    { status: 404, headers: { "Cache-Control": "private, no-store" } },
  );
}
