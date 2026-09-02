import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { applyAuthorityCommand, nextOwnerFor } from "./domain.ts";
import { AuthorityError } from "./errors.ts";
import {
  createRequestFixture,
  createSandboxSeed,
  createScenarioFixture,
  SANDBOX_ORGANIZATION,
  SANDBOX_POLICY,
  SANDBOX_RECORD_ID,
} from "./fixture.ts";
import type {
  AuthorityCommand,
  AuthorityEvent,
  AuthorityRecord,
  AuthorityRequestInput,
  AuthorityRecordSummary,
  AuthorityRecordView,
  CommandResult,
  SandboxScenario,
  WebhookDelivery,
} from "./types.ts";
import { createWebhookDelivery } from "./webhook.ts";

type JsonRow = { snapshot_json: string };
type EventRow = { event_json: string };
type DeliveryRow = { delivery_json: string };
type ResultRow = { command_json: string; result_json: string };
type CountRow = { count: number };
type VersionRow = { user_version: number };

const SCHEMA_VERSION = 3;

export class AuthorityRepository {
  private readonly database: DatabaseSync;

  constructor(databasePath: string) {
    if (databasePath !== ":memory:") mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
    this.migrate();
    this.seedIfEmpty();
  }

  close() {
    this.database.close();
  }

  private migrate() {
    const versionRow = this.database.prepare("PRAGMA user_version").get() as VersionRow;
    if (Number(versionRow.user_version) < SCHEMA_VERSION) {
      this.database.exec(`
        BEGIN IMMEDIATE;
        DROP TABLE IF EXISTS webhook_deliveries;
        DROP TABLE IF EXISTS idempotency_results;
        DROP TABLE IF EXISTS authority_events;
        DROP TABLE IF EXISTS authority_records;
        DROP TABLE IF EXISTS policy_versions;
        DROP TABLE IF EXISTS organizations;
        COMMIT;
      `);
    }

    this.database.exec(`
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        snapshot_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      ) STRICT;

      CREATE TABLE IF NOT EXISTS policy_versions (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL REFERENCES organizations(id),
        version TEXT NOT NULL,
        status TEXT NOT NULL,
        snapshot_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(organization_id, version)
      ) STRICT;

      CREATE TABLE IF NOT EXISTS authority_records (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL REFERENCES organizations(id),
        policy_version_id TEXT NOT NULL REFERENCES policy_versions(id),
        version INTEGER NOT NULL,
        status TEXT NOT NULL,
        scenario TEXT NOT NULL,
        snapshot_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;

      CREATE TABLE IF NOT EXISTS authority_events (
        id TEXT PRIMARY KEY,
        authority_record_id TEXT NOT NULL REFERENCES authority_records(id) ON DELETE CASCADE,
        sequence INTEGER NOT NULL,
        event_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(authority_record_id, sequence)
      ) STRICT;

      CREATE TABLE IF NOT EXISTS webhook_deliveries (
        id TEXT PRIMARY KEY,
        authority_record_id TEXT NOT NULL REFERENCES authority_records(id) ON DELETE CASCADE,
        event_id TEXT NOT NULL REFERENCES authority_events(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        delivery_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      ) STRICT;

      CREATE TABLE IF NOT EXISTS idempotency_results (
        idempotency_key TEXT PRIMARY KEY,
        authority_record_id TEXT NOT NULL REFERENCES authority_records(id) ON DELETE CASCADE,
        command_json TEXT NOT NULL,
        result_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      ) STRICT;

      CREATE INDEX IF NOT EXISTS authority_records_status_updated_idx
        ON authority_records(status, updated_at DESC);
      CREATE INDEX IF NOT EXISTS authority_events_record_sequence_idx
        ON authority_events(authority_record_id, sequence);
      CREATE INDEX IF NOT EXISTS webhook_deliveries_record_created_idx
        ON webhook_deliveries(authority_record_id, created_at DESC);

      PRAGMA user_version = ${SCHEMA_VERSION};
    `);
  }

  private seedIfEmpty() {
    const row = this.database.prepare("SELECT COUNT(*) AS count FROM authority_records").get() as CountRow;
    if (Number(row.count) > 0) return;
    this.seedCatalog(new Date().toISOString());
  }

  private seedCatalog(now: string) {
    this.insertOrganization(now);
    this.insertPolicy(now);
    for (const fixture of createSandboxSeed(now)) {
      this.insertRecord(fixture.record);
      for (const event of fixture.events) {
        this.insertEvent(event);
        this.insertWebhookDelivery(createWebhookDelivery(event, fixture.record));
      }
    }
  }

  private insertOrganization(now: string) {
    this.database
      .prepare("INSERT INTO organizations (id, snapshot_json, created_at) VALUES (?, ?, ?)")
      .run(SANDBOX_ORGANIZATION.id, JSON.stringify(SANDBOX_ORGANIZATION), now);
  }

  private insertPolicy(now: string) {
    this.database
      .prepare(
        `INSERT INTO policy_versions
          (id, organization_id, version, status, snapshot_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        SANDBOX_POLICY.id,
        SANDBOX_ORGANIZATION.id,
        SANDBOX_POLICY.version,
        SANDBOX_POLICY.status,
        JSON.stringify(SANDBOX_POLICY),
        now,
      );
  }

  private insertRecord(record: AuthorityRecord) {
    this.database
      .prepare(
        `INSERT INTO authority_records
          (id, organization_id, policy_version_id, version, status, scenario, snapshot_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.id,
        record.relyingParty.id,
        record.policy.id,
        record.version,
        record.status,
        record.sandboxScenario,
        JSON.stringify(record),
        record.createdAt,
        record.updatedAt,
      );
  }

  private insertEvent(event: AuthorityEvent) {
    this.database
      .prepare(
        `INSERT INTO authority_events
          (id, authority_record_id, sequence, event_json, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(event.id, event.authorityRecordId, event.sequence, JSON.stringify(event), event.createdAt);
  }

  private insertWebhookDelivery(delivery: WebhookDelivery) {
    this.database
      .prepare(
        `INSERT INTO webhook_deliveries
          (id, authority_record_id, event_id, status, delivery_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        delivery.id,
        delivery.authorityRecordId,
        delivery.eventId,
        delivery.status,
        JSON.stringify(delivery),
        delivery.createdAt,
      );
  }

  getRecord(id: string): AuthorityRecordView {
    const row = this.database
      .prepare("SELECT snapshot_json FROM authority_records WHERE id = ?")
      .get(id) as JsonRow | undefined;
    if (!row) throw new AuthorityError("Authority request not found.", "NOT_FOUND", 404);

    const events = this.database
      .prepare(
        `SELECT event_json FROM authority_events
         WHERE authority_record_id = ? ORDER BY sequence ASC`,
      )
      .all(id) as EventRow[];

    return {
      ...(JSON.parse(row.snapshot_json) as AuthorityRecord),
      events: events.map((event) => JSON.parse(event.event_json) as AuthorityEvent),
    };
  }

  listRecords(): AuthorityRecordSummary[] {
    const rows = this.database
      .prepare("SELECT snapshot_json FROM authority_records ORDER BY updated_at DESC")
      .all() as JsonRow[];
    return rows.map((row) => {
      const record = JSON.parse(row.snapshot_json) as AuthorityRecord;
      return {
        id: record.id,
        status: record.status,
        principalName: record.principal.name,
        representativeName: record.representative.name,
        sourceLabel: record.authoritySource.label,
        actionLabel: record.allowedActions.map((action) => action.label).join("; "),
        policyVersion: `${record.policy.label} ${record.policy.version}`,
        nextOwner: nextOwnerFor(record.status),
        scenario: record.sandboxScenario,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };
    });
  }

  getWebhookDeliveries(recordId?: string): WebhookDelivery[] {
    const rows = recordId
      ? (this.database
          .prepare(
            "SELECT delivery_json FROM webhook_deliveries WHERE authority_record_id = ? ORDER BY created_at DESC",
          )
          .all(recordId) as DeliveryRow[])
      : (this.database
          .prepare("SELECT delivery_json FROM webhook_deliveries ORDER BY created_at DESC")
          .all() as DeliveryRow[]);
    return rows.map((row) => JSON.parse(row.delivery_json) as WebhookDelivery);
  }

  getWebhookDelivery(id: string) {
    const row = this.database
      .prepare("SELECT delivery_json FROM webhook_deliveries WHERE id = ?")
      .get(id) as DeliveryRow | undefined;
    if (!row) throw new AuthorityError("Webhook delivery not found.", "NOT_FOUND", 404);
    return JSON.parse(row.delivery_json) as WebhookDelivery;
  }

  replayWebhook(id: string) {
    const current = this.getWebhookDelivery(id);
    if (!["retrying", "failed"].includes(current.status)) {
      throw new AuthorityError(
        "Only a failed or retrying webhook can be replayed.",
        "WEBHOOK_NOT_REPLAYABLE",
        409,
      );
    }
    const delivery: WebhookDelivery = {
      ...current,
      status: "delivered",
      attempts: current.attempts + 1,
      responseCode: 200,
      lastAttemptAt: new Date().toISOString(),
      nextRetryAt: undefined,
    };
    this.database
      .prepare("UPDATE webhook_deliveries SET status = ?, delivery_json = ? WHERE id = ?")
      .run(delivery.status, JSON.stringify(delivery), id);
    return delivery;
  }

  execute(id: string, command: AuthorityCommand): CommandResult {
    const commandJson = JSON.stringify(command);
    const previous = this.database
      .prepare(
        `SELECT command_json, result_json FROM idempotency_results
         WHERE idempotency_key = ?`,
      )
      .get(command.idempotencyKey) as ResultRow | undefined;

    if (previous) {
      if (previous.command_json !== commandJson) {
        throw new AuthorityError(
          "That request key was already used for a different action.",
          "INVALID_COMMAND",
          409,
        );
      }
      return { ...(JSON.parse(previous.result_json) as CommandResult), replayed: true };
    }

    this.database.exec("BEGIN IMMEDIATE");
    try {
      const currentView = this.getRecord(id);
      const current: AuthorityRecord = { ...currentView };
      delete (current as Partial<AuthorityRecordView>).events;
      const sequence = currentView.events.length + 1;
      const requestId = `req_${randomUUID()}`;
      const { record, event } = applyAuthorityCommand(current, command, {
        now: new Date().toISOString(),
        eventId: `evt_${randomUUID()}`,
        sequence,
      });
      const webhookDelivery = createWebhookDelivery(event, record);

      const update = this.database
        .prepare(
          `UPDATE authority_records
           SET version = ?, status = ?, scenario = ?, snapshot_json = ?, updated_at = ?
           WHERE id = ? AND version = ?`,
        )
        .run(
          record.version,
          record.status,
          record.sandboxScenario,
          JSON.stringify(record),
          record.updatedAt,
          id,
          current.version,
        );

      if (Number(update.changes) !== 1) {
        throw new AuthorityError(
          "This request changed in another session. Refresh before acting.",
          "STALE_VERSION",
          409,
        );
      }

      this.insertEvent(event);
      this.insertWebhookDelivery(webhookDelivery);
      const result: CommandResult = { record, event, webhookDelivery, requestId, replayed: false };
      this.database
        .prepare(
          `INSERT INTO idempotency_results
            (idempotency_key, authority_record_id, command_json, result_json, created_at)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run(command.idempotencyKey, id, commandJson, JSON.stringify(result), event.createdAt);
      this.database.exec("COMMIT");
      return result;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  createScenario(scenario: SandboxScenario) {
    const allowed: SandboxScenario[] = [
      "standard",
      "rfi_then_limited",
      "representative_declines",
      "identity_mismatch",
      "webhook_retry",
      "revoked_after_acceptance",
    ];
    if (!allowed.includes(scenario)) {
      throw new AuthorityError("Choose a supported sandbox scenario.", "INVALID_COMMAND", 400);
    }
    const id = `ar_test_${randomUUID()}`;
    const fixture = createScenarioFixture(id, scenario);
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.insertRecord(fixture.record);
      for (const event of fixture.events) {
        this.insertEvent(event);
        this.insertWebhookDelivery(createWebhookDelivery(event, fixture.record));
      }
      this.database.exec("COMMIT");
      return this.getRecord(id);
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  createRequest(input: AuthorityRequestInput) {
    const clean = {
      ...input,
      principalName: input.principalName.trim(),
      principalEmail: input.principalEmail.trim().toLowerCase(),
      representativeName: input.representativeName.trim(),
      representativeEmail: input.representativeEmail.trim().toLowerCase(),
      accountBoundary: input.accountBoundary.trim(),
      allowedActionKeys: [...new Set(input.allowedActionKeys)],
    };
    if (clean.principalName.length < 2 || clean.representativeName.length < 2) {
      throw new AuthorityError("Enter both participant names.", "INVALID_COMMAND", 400);
    }
    if (!clean.principalEmail.includes("@") || !clean.representativeEmail.includes("@")) {
      throw new AuthorityError("Enter a valid email for each participant.", "INVALID_COMMAND", 400);
    }
    if (clean.accountBoundary.length < 4) {
      throw new AuthorityError("Describe the account boundary.", "INVALID_COMMAND", 400);
    }
    if (clean.allowedActionKeys.length === 0) {
      throw new AuthorityError("Choose at least one requested action.", "INVALID_COMMAND", 400);
    }
    const allowedKeys = new Set(["receive_duplicate_statements", "discuss_service_issues"]);
    if (clean.allowedActionKeys.some((key) => !allowedKeys.has(key))) {
      throw new AuthorityError("Choose only actions supported by this template.", "INVALID_COMMAND", 400);
    }
    const expiry = new Date(clean.validUntil);
    if (Number.isNaN(expiry.getTime()) || expiry.getTime() <= Date.now()) {
      throw new AuthorityError("Choose a future end date.", "INVALID_COMMAND", 400);
    }

    const id = `ar_request_${randomUUID()}`;
    const fixture = createRequestFixture(id, clean);
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.insertRecord(fixture.record);
      for (const event of fixture.events) {
        this.insertEvent(event);
        this.insertWebhookDelivery(createWebhookDelivery(event, fixture.record));
      }
      this.database.exec("COMMIT");
      return this.getRecord(id);
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  resetSandbox() {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.exec(`
        DELETE FROM webhook_deliveries;
        DELETE FROM idempotency_results;
        DELETE FROM authority_events;
        DELETE FROM authority_records;
        DELETE FROM policy_versions;
        DELETE FROM organizations;
      `);
      this.seedCatalog(new Date().toISOString());
      this.database.exec("COMMIT");
      return this.getRecord(SANDBOX_RECORD_ID);
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }
}

const globalAuthority = globalThis as typeof globalThis & {
  authorityRepository?: AuthorityRepository;
};

export function getAuthorityRepository() {
  if (!globalAuthority.authorityRepository) {
    const databasePath = resolve(
      process.env.AUTHORITY_DATABASE_PATH ?? resolve(process.cwd(), ".data", "authority.sqlite"),
    );
    globalAuthority.authorityRepository = new AuthorityRepository(databasePath);
  }
  return globalAuthority.authorityRepository;
}
