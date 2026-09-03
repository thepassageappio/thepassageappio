"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAuthorityError } from "@/lib/authority/errors";
import { getAuthorityRepository } from "@/lib/authority/repository";
import { requireLocalAuthoritySandbox } from "@/lib/authority/sandbox-boundary";
import { ACTOR_COOKIE, partyForRole, resolveActorCookie, signedActorCookie } from "@/lib/authority/session";
import type { ActorRole, AuthorityCommand, Party, SandboxScenario } from "@/lib/authority/types";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function go(path: string, kind?: "notice" | "error", message?: string): never {
  const query = kind && message ? `?${new URLSearchParams({ [kind]: message })}` : "";
  redirect(`${path}${query}`);
}

async function setActorCookie(party: Party) {
  await (await cookies()).set(ACTOR_COOKIE, signedActorCookie(party), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function selectActorAction(formData: FormData) {
  requireLocalAuthoritySandbox();
  const recordId = text(formData, "recordId");
  const record = getAuthorityRepository().getRecord(recordId);
  const party = partyForRole(record, text(formData, "role") as ActorRole);
  if (!party) go(`/workspace/${recordId}`, "error", "That participant is not available.");
  await setActorCookie(party);
  go(`/workspace/${recordId}`);
}

export async function openReviewerAction(formData: FormData) {
  requireLocalAuthoritySandbox();
  const recordId = text(formData, "recordId");
  const record = getAuthorityRepository().getRecord(recordId);
  await setActorCookie(record.reviewer);
  go(`/workspace/${recordId}`);
}

export async function createAuthorityRequestAction(formData: FormData) {
  requireLocalAuthoritySandbox();
  let destination: { recordId: string; principalName: string };
  try {
    const endDate = text(formData, "validUntil");
    const record = getAuthorityRepository().createRequest({
      principalName: text(formData, "principalName"),
      principalEmail: text(formData, "principalEmail"),
      representativeName: text(formData, "representativeName"),
      representativeEmail: text(formData, "representativeEmail"),
      accountBoundary: text(formData, "accountBoundary"),
      validUntil: `${endDate}T23:59:59.000Z`,
      allowedActionKeys: formData.getAll("allowedActionKeys").map(String),
    });
    await setActorCookie(record.reviewer);
    revalidatePath("/institution");
    revalidatePath("/developer");
    destination = { recordId: record.id, principalName: record.principal.name };
  } catch (error) {
    console.error("Authority request setup failed", error);
    go(
      "/institution/new",
      "error",
      isAuthorityError(error) ? error.message : "The request could not be created. Check the details and try again.",
    );
  }
  go(`/workspace/${destination.recordId}`, "notice", `Request created. ${destination.principalName} owns the next step.`);
}

export async function executeAuthorityAction(formData: FormData) {
  requireLocalAuthoritySandbox();
  const recordId = text(formData, "recordId");
  const repository = getAuthorityRepository();
  const record = repository.getRecord(recordId);
  const actor = resolveActorCookie(record, (await cookies()).get(ACTOR_COOKIE)?.value);
  const base = {
    actorId: actor.id,
    actorRole: actor.role,
    expectedVersion: Number(text(formData, "expectedVersion")),
    idempotencyKey: text(formData, "idempotencyKey"),
  };
  const type = text(formData, "command");
  let command: AuthorityCommand;
  switch (type) {
    case "confirm_grant":
      command = { ...base, type, acknowledged: formData.get("acknowledged") === "on" };
      break;
    case "accept_responsibility":
      command = { ...base, type, acknowledged: formData.get("acknowledged") === "on" };
      break;
    case "decline_responsibility":
      command = {
        ...base,
        type,
        reason: text(formData, "reason"),
        acknowledged: formData.get("acknowledged") === "on",
      };
      break;
    case "withdraw_responsibility":
      command = {
        ...base,
        type,
        reason: text(formData, "reason"),
        acknowledged: formData.get("acknowledged") === "on",
      };
      break;
    case "complete_requirement":
      command = { ...base, type, requirementKey: text(formData, "requirementKey") };
      break;
    case "submit_record":
      command = { ...base, type, consented: formData.get("consented") === "on" };
      break;
    case "request_information":
      command = {
        ...base,
        type,
        requirementKey: text(formData, "requirementKey"),
        message: text(formData, "message"),
      };
      break;
    case "resolve_information":
      command = { ...base, type, response: text(formData, "response") };
      break;
    case "record_decision":
      command = {
        ...base,
        type,
        outcome: text(formData, "outcome") as "accepted" | "accepted_with_limits" | "rejected",
        reason: text(formData, "reason"),
        limitations: text(formData, "limitations").split("\n").map((item) => item.trim()).filter(Boolean),
        acknowledged: formData.get("acknowledged") === "on",
      };
      break;
    case "revoke_authority":
      command = {
        ...base,
        type,
        reason: text(formData, "reason"),
        acknowledged: formData.get("acknowledged") === "on",
      };
      break;
    default:
      go(`/workspace/${recordId}`, "error", "That action is not available.");
  }
  let destination: { kind: "notice" | "error"; message: string };
  try {
    const result = repository.execute(recordId, command);
    destination = {
      kind: "notice",
      message: result.replayed ? "That action was already saved." : result.event.summary,
    };
  } catch (error) {
    destination = {
      kind: "error",
      message: isAuthorityError(error) ? error.message : "The action could not be saved. Try again.",
    };
  }
  revalidatePath(`/workspace/${recordId}`);
  revalidatePath("/institution");
  revalidatePath("/developer");
  go(`/workspace/${recordId}`, destination.kind, destination.message);
}

export async function createScenarioAction(formData: FormData) {
  requireLocalAuthoritySandbox();
  const scenario = text(formData, "scenario") as SandboxScenario;
  let destination: { kind: "notice" | "error"; message: string };
  try {
    const record = getAuthorityRepository().createScenario(scenario);
    revalidatePath("/institution");
    revalidatePath("/developer");
    destination = {
      kind: "notice",
      message: `Created ${scenario.replaceAll("_", " ")} scenario ${record.id}.`,
    };
  } catch (error) {
    destination = {
      kind: "error",
      message: isAuthorityError(error) ? error.message : "The sandbox scenario could not be created.",
    };
  }
  go("/developer", destination.kind, destination.message);
}

export async function replayWebhookAction(formData: FormData) {
  requireLocalAuthoritySandbox();
  let destination: { kind: "notice" | "error"; message: string };
  try {
    const delivery = getAuthorityRepository().replayWebhook(text(formData, "deliveryId"));
    revalidatePath("/developer");
    destination = {
      kind: "notice",
      message: `${delivery.eventType} delivered after ${delivery.attempts} attempts.`,
    };
  } catch (error) {
    destination = {
      kind: "error",
      message: isAuthorityError(error) ? error.message : "The webhook could not be replayed.",
    };
  }
  go("/developer", destination.kind, destination.message);
}

export async function resetSandboxAction() {
  requireLocalAuthoritySandbox();
  const record = getAuthorityRepository().resetSandbox();
  await setActorCookie(record.principal);
  revalidatePath("/");
  revalidatePath("/institution");
  revalidatePath("/developer");
  revalidatePath(`/workspace/${record.id}`);
  go(`/workspace/${record.id}`, "notice", "The sample environment was reset.");
}
