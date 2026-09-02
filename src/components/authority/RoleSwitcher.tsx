import { selectActorAction } from "@/app/actions";
import type { ActorRole, AuthorityRecord, Party } from "@/lib/authority/types";
import styles from "./authority.module.css";

const roleLabel: Record<Exclude<ActorRole, "system">, string> = {
  principal: "Person granting authority",
  representative: "Representative",
  reviewer: "Institution reviewer",
};

export function RoleSwitcher({ record, actor }: { record: AuthorityRecord; actor: Party }) {
  return (
    <section className={styles.roleRail} aria-label="Sandbox participant">
      <p className={styles.eyebrow}>View as</p>
      <div className={styles.roleList}>
        {[record.principal, record.representative, record.reviewer].map((party) => (
          <form action={selectActorAction} key={party.id}>
            <input type="hidden" name="recordId" value={record.id} />
            <input type="hidden" name="role" value={party.role} />
            <button className={`${styles.roleButton} ${actor.id === party.id ? styles.roleButtonActive : ""}`} type="submit" aria-current={actor.id === party.id ? "page" : undefined}>
              <span className={styles.avatar} aria-hidden="true">{party.name.split(" ").map((name) => name[0]).join("")}</span>
              <span><strong>{party.name}</strong><small>{roleLabel[party.role as Exclude<ActorRole, "system">]}</small></span>
            </button>
          </form>
        ))}
      </div>
      <div className={styles.sandboxNote}><span aria-hidden="true">◆</span><p><strong>Sandbox</strong>Nothing here is sent to a person or institution.</p></div>
    </section>
  );
}
