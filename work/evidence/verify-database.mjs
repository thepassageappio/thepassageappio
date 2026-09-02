import { DatabaseSync } from "node:sqlite";

const database = new DatabaseSync(".data/authority.sqlite", { readOnly: true });

function scalar(sql, ...params) {
  return database.prepare(sql).get(...params);
}

const mismatchId = "ar_test_8637b987-fccf-4f88-a508-0c97fd7c35fb";
const apiRecordId = "ar_test_0f996356-662c-47e6-9e57-92e73b5e3fb5";
const mismatchRow = scalar(
  "SELECT status, version, snapshot_json FROM authority_records WHERE id = ?",
  mismatchId,
);
const mismatchRecord = JSON.parse(mismatchRow.snapshot_json);
const apiRow = scalar(
  "SELECT status, version FROM authority_records WHERE id = ?",
  apiRecordId,
);
const retryRow = scalar(
  "SELECT status, delivery_json FROM webhook_deliveries WHERE id = ?",
  "delivery_evt_sandbox_brooks_6",
);
const retryDelivery = JSON.parse(retryRow.delivery_json);

const report = {
  schemaVersion: scalar("PRAGMA user_version").user_version,
  totals: {
    records: scalar("SELECT COUNT(*) AS value FROM authority_records").value,
    events: scalar("SELECT COUNT(*) AS value FROM authority_events").value,
    webhookDeliveries: scalar("SELECT COUNT(*) AS value FROM webhook_deliveries").value,
  },
  mismatchRollback: {
    status: mismatchRow.status,
    version: mismatchRow.version,
    eventCount: scalar(
      "SELECT COUNT(*) AS value FROM authority_events WHERE authority_record_id = ?",
      mismatchId,
    ).value,
    completedRepresentativeIdentity: mismatchRecord.requirements.find(
      (requirement) => requirement.key === "representative_identity",
    ).status,
    evidenceArtifactCount: mismatchRecord.evidenceArtifacts.length,
  },
  apiIdempotency: {
    status: apiRow.status,
    version: apiRow.version,
    eventCount: scalar(
      "SELECT COUNT(*) AS value FROM authority_events WHERE authority_record_id = ?",
      apiRecordId,
    ).value,
    idempotencyRows: scalar(
      "SELECT COUNT(*) AS value FROM idempotency_results WHERE idempotency_key = ?",
      "qa-api-confirm-001",
    ).value,
  },
  webhookReplay: {
    status: retryRow.status,
    attempts: retryDelivery.attempts,
    responseCode: retryDelivery.responseCode,
  },
};

database.close();
console.log(JSON.stringify(report, null, 2));
