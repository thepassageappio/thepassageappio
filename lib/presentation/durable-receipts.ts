import type { DurableReceiptData } from '@/components/operations/DurableReceipt';
import { humanizeMemberIdentity, humanizePreviewLabel } from '@/lib/presentation/plain-language';

export type DurableReceiptInput = Omit<DurableReceiptData, 'savedLabel'>;

export function formatDurableReceiptTime(savedAt: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'long',
    timeZone: 'America/Los_Angeles',
  }).format(new Date(savedAt));
}

export function durableReceipt(input: DurableReceiptInput): DurableReceiptData {
  return {
    ...input,
    savedLabel: formatDurableReceiptTime(input.savedAt),
  };
}

type TaskAssignmentReceiptInput = {
  eventId: string;
  savedAt: string;
  actorName: string | null | undefined;
  actorEmail?: string | null;
  actorRole?: string;
  assigneeName: string | null | undefined;
  assigneeEmail?: string | null;
  assigneeRole?: string;
  taskTitle: string | null | undefined;
  taskStatus: string;
};

export function taskAssignmentReceipt(input: TaskAssignmentReceiptInput): DurableReceiptData {
  const changedBy = humanizeMemberIdentity(input.actorName, input.actorEmail, input.actorRole ?? 'director');
  const assigneeName = humanizeMemberIdentity(input.assigneeName, input.assigneeEmail, input.assigneeRole ?? 'staff');
  const taskTitle = humanizePreviewLabel(input.taskTitle ?? '', 'this commitment');

  return durableReceipt({
    eventId: input.eventId,
    heading: `${assigneeName} owns this commitment.`,
    changedBy,
    savedAt: input.savedAt,
    result: `${changedBy} assigned ${taskTitle} to ${assigneeName}.`,
    visibleTo: `Northstar directors and ${assigneeName}`,
    savedIn: 'Case activity and task history',
    next: input.taskStatus === 'assigned'
      ? `${assigneeName} starts the work.`
      : `${assigneeName} continues the work shown above.`,
  });
}

type VendorRequestSentReceiptInput = {
  eventId: string;
  savedAt: string;
  actorName: string | null | undefined;
  actorEmail?: string | null;
  actorRole?: string;
  requestTitle: string | null | undefined;
  partnerName: string | null | undefined;
};

export function vendorRequestSentReceipt(input: VendorRequestSentReceiptInput): DurableReceiptData {
  const changedBy = humanizeMemberIdentity(input.actorName, input.actorEmail, input.actorRole ?? 'director');
  const requestTitle = humanizePreviewLabel(input.requestTitle ?? '', 'Memorial flowers');
  const partnerName = humanizePreviewLabel(input.partnerName ?? '', 'the selected vendor');

  return durableReceipt({
    eventId: input.eventId,
    heading: 'Vendor request saved.',
    changedBy,
    savedAt: input.savedAt,
    result: `${changedBy} sent ${requestTitle} to ${partnerName}.`,
    visibleTo: `Northstar directors and ${partnerName}`,
    savedIn: 'Case and vendor request history',
    next: `${partnerName} reviews the request and responds.`,
  });
}
