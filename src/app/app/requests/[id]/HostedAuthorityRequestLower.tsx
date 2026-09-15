import Link from "next/link";
import { randomUUID } from "node:crypto";
import { recordInstitutionDecisionAction, requestHostedAuthorityInformationAction, reviewEvidenceArtifactAction } from "@/app/account-actions";
import { HOSTED_ACTIONS, hostedStatusLabel } from "@/lib/authority/hosted-records";
import { NySoleRefusalNotice } from "@/components/app/NySoleRefusalNotice";
import { hostedDecisionLabel } from "@/lib/authority/hosted-decisions";
import { CancelRequestForm } from "./CancelRequestForm";
import styles from "@/components/app/app-shell.module.css";

type LowerProps = {
  access: any;
  record: any;
  closedMessage: string | null;
  reviewFinished: boolean;
  events: any[];
  canCoordinate: boolean;
  canRecordDecision: boolean;
  canReviewEvidence: boolean;
  decision: any;
  decisionReady: boolean;
  decisionSinceChanged: boolean;
  requirements: any[];
  evidenceArtifacts: any[];
  informationRequests: any[];
  informationResponses: any[];
  openInformationRequest: any;
  responseByRequest: Map<string, any>;
  requirementStatusLabel: (status: unknown) => string;
  activityDetail: (event: { eventType: string; detail: string }) => string;
  activitySummary: (event: { eventType: string; summary: string }) => string;
  formClassLabel: string | null;
  showSoleRefusalNotice: boolean;
};

export function HostedAuthorityRequestLower({ p }: { p: LowerProps }) {
  const {
    access,
    record,
    closedMessage,
    reviewFinished,
    events,
    canCoordinate,
    canRecordDecision,
    canReviewEvidence,
    decision,
    decisionReady,
    decisionSinceChanged,
    requirements,
    evidenceArtifacts,
    informationRequests,
    informationResponses,
    openInformationRequest,
    responseByRequest,
    requirementStatusLabel,
    activityDetail,
    activitySummary,
    formClassLabel,
    showSoleRefusalNotice,
  } = p;

  const requirementRows = requirements ?? [];
  const evidenceRows = evidenceArtifacts ?? [];
  const informationRequestRows = informationRequests ?? [];

  return <>
        {requirementRows.length > 0 ? <section className={styles.panel} id="required-information">
          <div className={styles.panelHead}><div><h2>Required information</h2><p>{reviewFinished ? "These files and confirmations are part of the saved history." : "Review each file or confirmation before making a decision."}</p></div><span className={styles.badge}>{requirementRows.filter((item) => item.status === "completed").length} of {requirementRows.length} complete</span></div>
          <ul className={styles.activity}>{requirementRows.map((requirement) => {
            const artifact = evidenceRows.find((item) => String(item.requirement_id) === String(requirement.id));
            return <li key={String(requirement.id)}>
              <div>
                <strong>{String(requirement.title)}</strong>
                <span>{String(requirement.reason)}</span>
                <span>Status: {requirementStatusLabel(requirement.status)}</span>
           