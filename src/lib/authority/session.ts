import { createHmac, timingSafeEqual } from "node:crypto";
import type { ActorRole, AuthorityRecord, Party } from "./types.ts";

export const ACTOR_COOKIE = "passage_authority_actor";

function secret() {
  const configured = process.env.AUTHORITY_SANDBOX_COOKIE_SECRET;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") throw new Error("AUTHORITY_SANDBOX_COOKIE_SECRET is required in production.");
  return "local-synthetic-authority-sandbox-only";
}

function signature(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function signedActorCookie(party: Party) {
  const value = `${party.role}.${party.id}`;
  return `${value}.${signature(value)}`;
}

export function resolveActorCookie(record: AuthorityRecord, cookieValue?: string): Party {
  const fallback = record.principal;
  if (!cookieValue) return fallback;
  const [role, actorId, suppliedSignature] = cookieValue.split(".");
  if (!role || !actorId || !suppliedSignature) return fallback;
  const value = `${role}.${actorId}`;
  const expected = Buffer.from(signature(value));
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return fallback;
  return [record.principal, record.representative, record.reviewer].find(
    (party) => party.id === actorId && party.role === role,
  ) ?? fallback;
}

export function partyForRole(record: AuthorityRecord, role: ActorRole) {
  if (role === "principal") return record.principal;
  if (role === "representative") return record.representative;
  if (role === "reviewer") return record.reviewer;
  return undefined;
}

