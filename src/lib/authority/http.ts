import { AuthorityError, isAuthorityError } from "./errors.ts";
import { nextOwnerFor } from "./domain.ts";
import type { ActorRole, AuthorityCommand, AuthorityRecord, AuthorityRecordView, CommandResult } from "./types.ts";

function apiSecret() {
  const configured = process.env.AUTHORITY_SANDBOX_API_KEY;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") throw new Error("AUTHORITY_SANDBOX_API_KEY is required in production.");
  return "passage_sandbox_test_key";
}

export function actorFromRequest(request: Request, record: AuthorityRecord) {
  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${apiSecret()}`) {
    throw new AuthorityError("A valid sandbox API key is required.", "UNAUTHORIZED_ACTOR", 401);
  }
  const actorId = request.headers.get("x-authority-actor");
  const actor = [record.principal, record.representative, record.reviewer].find((party) => party.id === actorId);
  if (!actor) throw new AuthorityError("A valid participant is required.", "UNAUTHORIZED_ACTOR", 403);
  return actor;
}

export function integrationFromRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${apiSecret()}`) {
    throw new AuthorityError("A valid sandbox API key is required.", "UNAUTHORIZED_ACTOR", 401);
  }
  return { id: "integration_hvcu_sandbox", organizationId: "org_hvcu_sandbox" };
}

export function recordProjection(record: AuthorityRecordView, role: ActorRole) {
  return {
    ...record,
    evidenceArtifacts: record.evidenceArtifacts.map((artifact) =>
      role === "reviewer" ? artifact : { ...artifact, providerReference: "withheld_from_participant_view" },
    ),
    events: record.events.filter((event) => event.audience.includes(role)),
  };
}

export function commandFromBody(
  body: Record<string, unknown>,
  actor: { id: string; role: ActorRole },
): AuthorityCommand {
  const base = {
    actorId: actor.id,
    actorRole: actor.role,
    expectedVersion: Number(body.expectedVersion),
    idempotencyKey: String(body.idempotencyKey ?? ""),
  };
  if (!Number.isInteger(base.expectedVersion) || !base.idempotencyKey) {
    throw new AuthorityError("expectedVersion and idempotencyKey are required.", "INVALID_COMMAND", 400);
  }
  switch (body.type) {
    case "confirm_grant": return { ...base, type: body.type, acknowledged: body.acknowledged === true };
    case "accept_responsibility": return { ...base, type: body.type, acknowledged: body.acknowledged === true };
    case "decline_responsibility": return {
      ...base,
      type: body.type,
      reason: String(body.reason ?? ""),
      acknowledged: body.acknowledged === true,
    };
    case "withdraw_responsibility": return {
      ...base,
      type: body.type,
      reason: String(body.reason ?? ""),
      acknowledged: body.acknowledged === true,
    };
    case "complete_requirement": return {
      ...base,
      type: body.type,
      requirementKey: String(body.requirementKey ?? ""),
    };
    case "submit_record": return { ...base, type: body.type, consented: body.consented === true };
    case "request_information": return {
      ...base,
      type: body.type,
      requirementKey: String(body.requirementKey ?? ""),
      message: String(body.message ?? ""),
    };
    case "resolve_information": return { ...base, type: body.type, response: String(body.response ?? "") };
    case "record_decision": return {
      ...base,
      type: body.type,
      outcome: body.outcome as "accepted" | "accepted_with_limits" | "rejected",
      reason: String(body.reason ?? ""),
      limitations: Array.isArray(body.limitations) ? body.limitations.map(String) : [],
      acknowledged: body.acknowledged === true,
    };
    case "revoke_authority": return { ...base, type: body.type, reason: String(body.reason ?? ""), acknowledged: body.acknowledged === true };
    default: throw new AuthorityError("Unknown command type.", "INVALID_COMMAND", 400);
  }
}

export function publicResult(result: CommandResult) {
  return {
    requestId: result.requestId,
    authorityRecordId: result.record.id,
    status: result.record.status,
    version: result.record.version,
    nextActionOwner: nextOwnerFor(result.record.status),
    replayed: result.replayed,
    webhook: {
      deliveryId: result.webhookDelivery.id,
      status: result.webhookDelivery.status,
      attempts: result.webhookDelivery.attempts,
    },
    event: {
      id: result.event.id,
      summary: result.event.summary,
      createdAt: result.event.createdAt,
    },
  };
}

export function errorResponse(error: unknown) {
  if (isAuthorityError(error)) {
    return Response.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }
  return Response.json({ error: { code: "INTERNAL_ERROR", message: "The request could not be completed." } }, { status: 500 });
}
