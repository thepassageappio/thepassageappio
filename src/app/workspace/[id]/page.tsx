import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ActionPanel } from "@/components/authority/ActionPanel";
import { EvidencePanel } from "@/components/authority/EvidencePanel";
import { JourneyProgress } from "@/components/authority/JourneyProgress";
import { ReceiptTimeline } from "@/components/authority/ReceiptTimeline";
import { RecordHeader } from "@/components/authority/RecordHeader";
import { RoleSwitcher } from "@/components/authority/RoleSwitcher";
import { ScopePanel } from "@/components/authority/ScopePanel";
import { StatusCard } from "@/components/authority/StatusCard";
import { authorityPurposeLabel } from "@/lib/authority/display-copy";
import { isAuthorityError } from "@/lib/authority/errors";
import { getAuthorityRepository } from "@/lib/authority/repository";
import { isLocalAuthoritySandboxAvailable } from "@/lib/authority/sandbox-boundary";
import { ACTOR_COOKIE, resolveActorCookie } from "@/lib/authority/session";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; error?: string }>;
};

export default async function AuthorityWorkspace({ params, searchParams }: Props) {
  if (!isLocalAuthoritySandboxAvailable()) notFound();
  const { id } = await params;
  const messages = await searchParams;
  let record;
  try {
    record = getAuthorityRepository().getRecord(id);
  } catch (error) {
    if (isAuthorityError(error) && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  const actor = resolveActorCookie(record, (await cookies()).get(ACTOR_COOKIE)?.value);

  return (
    <main>
      <RecordHeader actor={actor} />
      <div className="workspace-shell">
        <RoleSwitcher record={record} actor={actor} />
        <div className="workspace-content">
          <div className="workspace-title">
            <div>
              <p>Authority request · {record.authoritySource.instrumentName}</p>
              <h1>{record.principal.name} to {record.representative.name}</h1>
              <span>For {record.relyingParty.name} · {record.accountBoundary}</span>
            </div>
            <div className="workspace-purpose"><strong>Purpose</strong>{authorityPurposeLabel(record.purpose)}</div>
          </div>
          {messages.notice ? <div className="notice" role="status">{messages.notice}</div> : null}
          {messages.error ? <div className="error-notice" role="alert">{messages.error}</div> : null}
          <StatusCard record={record} role={actor.role} />
          <JourneyProgress record={record} />
          <div className="workspace-columns">
            <div className="workspace-main">
              <ActionPanel record={record} actor={actor} />
              <EvidencePanel record={record} />
              <ScopePanel record={record} />
            </div>
            <ReceiptTimeline events={record.events} role={actor.role} />
          </div>
        </div>
      </div>
    </main>
  );
}
