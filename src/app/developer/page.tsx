import { createScenarioAction, replayWebhookAction } from "@/app/actions";
import { PortalHeader } from "@/components/authority/PortalHeader";
import { getAuthorityRepository } from "@/lib/authority/repository";
import styles from "@/components/authority/portal.module.css";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ notice?: string; error?: string }> };

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit" }).format(new Date(value));
}

export default async function DeveloperSandbox({ searchParams }: Props) {
  const messages = await searchParams;
  const repository = getAuthorityRepository();
  const records = repository.listRecords();
  const allDeliveries = repository.getWebhookDeliveries();
  const unresolvedDeliveries = allDeliveries.filter((delivery) => delivery.status === "retrying" || delivery.status === "failed");
  const recentResolvedDeliveries = allDeliveries.filter((delivery) => delivery.status !== "retrying" && delivery.status !== "failed");
  const deliveries = [...unresolvedDeliveries, ...recentResolvedDeliveries].slice(0, 24);
  const retrying = unresolvedDeliveries.length;
  const quickstart = `curl -X POST http://localhost:3200/api/v1/authority-records \\\n+  -H "Authorization: Bearer local-authority-sandbox-key" \\\n+  -H "Content-Type: application/json" \\\n+  -d '{"sandboxScenario":"rfi_then_limited"}'`;

  return (
    <main className={styles.page}>
      <PortalHeader active="developer" />
      <div className={styles.content}>
        <section className={styles.intro}>
          <div><p className={styles.eyebrow}>Developer experience · Observable by default</p><h1>API and webhook sandbox</h1></div>
          <p className={styles.lede}>Create sample authority records, exercise failure states, inspect signed event payloads, and replay failed deliveries without touching a real person or institution.</p>
        </section>
        {messages.notice ? <div className={styles.notice} role="status">{messages.notice}</div> : null}
        {messages.error ? <div className={styles.error} role="alert">{messages.error}</div> : null}
        <section className={styles.stats} aria-label="Developer summary">
          <div className={styles.stat}><span>Authority records</span><strong>{records.length}</strong></div>
          <div className={styles.stat}><span>Webhook deliveries</span><strong>{deliveries.length}</strong></div>
          <div className={styles.stat}><span>Needs replay</span><strong>{retrying}</strong></div>
          <div className={styles.stat}><span>API version</span><strong>v1</strong></div>
        </section>
        <div className={styles.developerGrid}>
          <div>
            <section className={`${styles.panel} ${styles.section}`}>
              <h2>Create a deterministic scenario</h2>
              <p>Each record begins with confirmation by the person granting authority so the complete participant flow remains testable.</p>
              <form action={createScenarioAction} className={styles.form}>
                <label htmlFor="scenario">Failure or success path</label>
                <select className={styles.select} id="scenario" name="scenario" defaultValue="rfi_then_limited">
                  <option value="standard">Standard acceptance</option>
                  <option value="rfi_then_limited">RFI then limited acceptance</option>
                  <option value="representative_declines">Representative declines</option>
                  <option value="identity_mismatch">Identity mismatch</option>
                  <option value="webhook_retry">Webhook fails twice</option>
                  <option value="revoked_after_acceptance">Revoked after acceptance</option>
                </select>
                <button className={styles.primary} type="submit">Create sample record</button>
              </form>
              <div className={styles.boundary}><strong>Sandbox boundary:</strong> checks, people, endpoint responses, and webhook signatures use sample data. Sandbox results do not establish legal validity, institutional approval, or production certification.</div>
            </section>
            <section className={`${styles.panel} ${styles.section}`}>
              <h2>Five-minute quickstart</h2>
              <p>Create a record through the sandbox API. Use the returned workspace path to complete the hosted sample transaction.</p>
              <pre className={styles.code}><code>{quickstart.replaceAll("\n+", "\n").replace("http://localhost:3200", "http://127.0.0.1:3400").replace("local-authority-sandbox-key", "passage_sandbox_test_key")}</code></pre>
            </section>
          </div>
          <section className={`${styles.panel} ${styles.section}`}>
            <h2>Signed webhook delivery log</h2>
            <p>Every saved authority change creates one observable delivery with attempts, response, payload, and replay state.</p>
            <ol className={styles.deliveryList}>{deliveries.map((delivery) => (
              <li className={styles.delivery} key={delivery.id}>
                <div>
                  <div className={styles.deliveryTitle}><strong>{delivery.eventType}</strong><span className={styles.status} data-status={delivery.status === "delivered" ? "accepted" : "information_requested"}>{delivery.status}</span></div>
                  <span className={styles.muted}>{delivery.authorityRecordId} · {formatTime(delivery.createdAt)}</span>
                  <details><summary>View signed payload</summary><pre className={styles.payload}>{JSON.stringify({ signature: delivery.signature, payload: delivery.payload }, null, 2)}</pre></details>
                </div>
                <div className={styles.deliveryActions}>
                  <span className={styles.attempts}>{delivery.attempts} attempt{delivery.attempts === 1 ? "" : "s"} · HTTP {delivery.responseCode ?? "Not sent"}</span>
                  {delivery.status === "retrying" || delivery.status === "failed" ? <form action={replayWebhookAction}><input type="hidden" name="deliveryId" value={delivery.id} /><button className={styles.secondary} type="submit">Replay delivery</button></form> : null}
                </div>
              </li>
            ))}</ol>
          </section>
        </div>
      </div>
    </main>
  );
}
