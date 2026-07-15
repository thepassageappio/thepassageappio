# Passage system dependency maps — greenfield target

Date: 2026-07-14  
Status: design and architecture baseline for the greenfield rebuild  
North star: enterprise-ready “death tech meets Apple empathy,” complete D2C journeys, and a separate seeded funeral-home director demo sandbox.

These maps are durable replacements for the ephemeral run-13/run-14 widgets. They distinguish what exists today from what Passage is deliberately becoming. They are not evidence that the target state is already built.

## Current state — fragmented experience over a strong backend spine

```mermaid
flowchart LR
  subgraph P[Personas]
    RU[Urgent family]
    GP[Planning family]
    FD[Funeral-home director]
    FE[Funeral-home employee]
    VP[Vendor / participant]
  end

  subgraph U[Current UI surfaces]
    E[estate.js<br/>313 KB<br/>5+ panels on load<br/>literal ?? defect]
    D[dashboard.js<br/>449 KB<br/>director/staff overlap<br/>156 Georgia declarations]
    M[Marketing pages<br/>Threshold re-skins<br/>old IA retained]
    S[Shared chrome / tokens<br/>partly unified]
  end

  subgraph B[Backend and operations]
    DB[(Supabase<br/>58 public tables)]
    H[Manual handoffs<br/>context repeatedly retold]
    Q[QA / deploy train<br/>runtime proof inconsistent]
  end

  RU --> E
  GP --> E
  FD --> D
  FE --> D
  VP --> D
  M --> S
  E --> DB
  D --> DB
  S --> M
  DB --> H
  Q -. found .-> M

  BUG[/Hydration mismatch<br/>trust · mission · story/]
  BUG -. affects .-> M
```

### What this exposes

- The data spine is stronger than the experience wrapped around it.
- Personas are routed into page monoliths instead of purpose-built views of one shared record.
- The shipped Threshold work changed craft tokens more than workflow structure; it is a useful visual foundation, not a completed greenfield redesign.
- QA found a real hydration defect only after production because visual checks and runtime-console checks were not consistently separated.
- No durable portable-consent primitive currently carries context between organizations.

## Target state — one living estate record, purpose-built views

```mermaid
flowchart LR
  subgraph ENTRY[Entry and onboarding]
    D2C[D2C entry<br/>urgent or planning]
    B2B[Funeral-home entry<br/>director or employee]
    DEMO[Separate demo sandbox<br/>seed · reset · no production demo routes]
  end

  subgraph CORE[Passage record]
    ER[(One living estate record)]
    TS[Task spine<br/>one owner · one next action]
    DOC[Documents and prepared outputs]
    MSG[Messages and notification log]
    AUD[Audit and consent evidence]
  end

  subgraph VIEWS[Purpose-built views]
    FAM[Family Today<br/>warm · paced · mobile-first]
    DIR[Director console<br/>risk · flow · staff load · proof]
    EMP[Employee queue<br/>assigned work only]
    VEN[Vendor / participant view<br/>scoped request only]
    ADM[Admin portal<br/>support view · audited access]
  end

  subgraph PASS[QR Transfer Pass consent spine]
    TOK[Expiring scoped token]
    SCAN[Mobile scan / accept]
    PKT[Standardized intake packet]
    CONS[Issue · view · accept · modify · revoke · expire]
  end

  D2C --> ER
  B2B --> ER
  DEMO --> DIR

  ER --> TS
  ER --> DOC
  ER --> MSG
  ER --> AUD

  TS --> FAM
  TS --> DIR
  TS --> EMP
  TS --> VEN
  AUD --> ADM

  FAM --> TOK
  TOK --> SCAN
  SCAN --> DIR
  SCAN --> PKT
  TOK --> CONS
  CONS --> AUD

  HOSP[Hospice] --> TOK
  DIR --> CEM[Cemetery]
  DIR --> VEND[Vendor]
  DIR --> EST[Estate administration]
```

### Experience contract

- Family surfaces reveal one meaningful decision at a time and explain what happens next.
- Director surfaces lead with case risk, waiting points, staff load, family-update health, and proof—not generic dashboard cards.
- Employees see only assigned work and its proof destination.
- Vendors and participants see one scoped request, never the family record.
- Every state is viewer-relative: **your move**, **waiting on**, or **handled**.
- The QR mechanism is not the product. The differentiated product is a family-controlled, portable, current record with explicit scope and an auditable consent history.
- The demo sandbox is a product capability: realistic seeded data, resettable state, isolated identities, and no demo-only production routes.

## Delivery dependency map — sprint coordination

```mermaid
flowchart TD
  A[Greenfield concept gate<br/>3 structurally distinct directions] --> B[Choose experience architecture<br/>family + director]
  B --> C[Design system v2<br/>tokens · components · motion · content rules]
  B --> D[One-record domain contract<br/>routes · API · schema gaps]
  C --> E[Director demo shell]
  D --> E
  D --> F[Estate record rebuild]
  D --> G[Transfer Pass schema decision]
  G --> H[Supabase migrations<br/>tokens + consent trail]
  H --> I[Transfer Pass V1<br/>generate · scan · accept · packet]
  E --> J[Seeded demo sandbox<br/>reset · isolation · scripted story]
  F --> J
  I --> J
  J --> K[Funeral-home director demo acceptance]
  F --> L[D2C red + green journey acceptance]
  K --> M[Enterprise beta readiness]
  L --> M

  X[Hydration hotfix] --> C
  Y[estate literal ?? hotfix] --> F
  Z[dashboard mechanical extraction] --> E
```

## Gates that prevent another re-skin

1. No implementation ticket may be called greenfield unless it changes workflow structure or information architecture, not merely tokens.
2. Before the main rebuild, UX must present at least three structurally distinct concepts; “current layout with different styling” is an automatic fail.
3. The director demo must be testable from a resettable sandbox with realistic fake data and isolated auth/data.
4. Schema changes require a documented frontend need, migration, rollback posture, RLS review, and QA evidence.
5. Every user-facing batch requires desktop and mobile screenshots plus console-error evidence.
6. Compliance-adjacent Transfer Pass copy stays plain and non-legal until separately reviewed.
