# Funeral-home discovery thin slice

Status: checkpoint-10 A16 non-production implementation contract.

This packet implements one family-scoped funeral-home choice. It does not
activate a paid directory, contact a funeral home, issue a Transfer Pass, grant
record access, validate licensing, quote price, promise availability, or change
Production.

## Schema batch: what changes

1. Add a private, deterministic synthetic provider directory in
   `passage_private.synthetic_provider_directory`. Each entry has a stable
   source key, one dataset version, a structured address, and optional durable
   organization/location linkage. Only the linked Northstar sample can be
   marked available for the later Preview handoff step.
2. Add `public.family_provider_selections` under an authenticated
   `continuity_space_id`. It stores only an explicitly confirmed structured
   snapshot: source kind/key/version, provider name, address fields,
   address-review state, server-derived handoff availability, actor/time,
   request digest, and active/superseded state.
3. Add nullable provider-selection references to the existing
   `public.workflow_events` spine. A first confirmation appends
   `family_provider_selection.confirmed`; a replacement appends exactly one
   `family_provider_selection.superseded` event retaining the prior and next
   selection references.
4. Add private idempotent confirmation and authorized projection functions,
   exposed through narrow `SECURITY INVOKER` public wrappers. Confirmation is
   coordinator-only. Reads follow the existing continuity-space viewer
   predicate and current participant revocation state.
5. Add indexed RLS predicates, one-active-selection and request-id uniqueness,
   source/address/state constraints, explicit grants, and rollback-only
   structural proof.

## Why the family experience needs it

The existing Receiver step offers static radio cards and browser state. A16
requires name-or-address suggestions, an explicit structured confirmation,
reload persistence, replacement history, actual audience language, and a
truthful boundary between a saved directory/manual choice and a connected
Preview destination. Those claims cannot be made from client state.

The private directory lets the server re-resolve source version and connection
truth during confirmation instead of trusting a client-supplied name, address,
or handoff flag. The durable selection and append-only event make the saved
receipt, replacement, replay, conflict, and reload states provable.

## What breaks if this batch is skipped

- Typed or highlighted text could be mistaken for a chosen funeral home.
- Reload would lose the choice or rely on browser storage.
- A client could forge a source key, dataset version, or handoff availability.
- Replacements could erase history or create duplicate active choices.
- Family viewers could see a choice after their access was revoked.
- The UI could imply that a funeral home was contacted or can receive a
  handoff without server-linked organization/location proof.

## Authority and privacy boundary

- Search uses only the in-repository synthetic directory and keeps raw queries
  in memory. Queries, abandoned results, highlighted options, empty text, and
  provider errors are not written to URLs, analytics, browser storage,
  database rows, events, or application logs.
- Confirmation requires a verified authenticated user and
  `passage_private.can_manage_continuity_space`, which is the current
  coordinator predicate. The actor comes from `auth.uid()`.
- Direct table reads and mutations are denied to authenticated clients. The
  only read path is the narrow authorized projection wrapper; it omits
  selection/space/event identifiers, request digests, source kind/key, dataset
  version, actor identity, and supersession internals. Authenticated users
  receive execute access only to the checked public command and projection
  wrappers.
- An active participant can read the confirmed provider choice and its
  provider-selection receipt only while the existing
  `can_view_continuity_space` predicate remains true. Search and provider data
  never grant participant, family, organization, location, workflow, task, or
  case authority.
- Event metadata contains no query, provider address, family content, raw
  source payload, or secret. It records only proof destination and bounded
  confirmation flags.

## Idempotency, concurrency, and recovery

- Every confirmation has a caller-generated UUID and a canonical request
  digest. Same UUID plus same payload returns the original selection/event.
  Same UUID plus different payload fails without mutation.
- A short advisory lock serializes one continuity space. The caller also sends
  the active selection it last observed. A changed selection produces a
  conflict before any new row or event is written.
- The command inserts the replacement, supersedes the prior active row, and
  appends the single receipt in one database transaction.
- Unknown client outcomes retry the same UUID. Known validation/authority
  failures preserve the prior active choice. Reload uses the authorized
  projection as source of truth.

## Migration risk and recovery

Target project: isolated non-production Supabase project
`uyacxqtsiwlvtmhxvoxr` only. Production project
`qsveqfchwylsbncsfgxe` is forbidden.

The migration positively binds that isolated target to PostgreSQL
`pg_control_system().system_identifier = 7656983981618135123`. This immutable
cluster identifier was read from `uyacxqtsiwlvtmhxvoxr`; the migration refuses
every different cluster before creating an object. Required migration markers,
exact retained cardinality, and stable Cycle 7A/7B identities remain additional
guards rather than substitutes for the positive cluster attestation.

The migration fails closed unless the exact isolated cluster, reviewed
continuity-space functions,
append-only workflow-event trigger, Northstar synthetic organization/location,
and required tables exist. It creates no Auth user, outbound message, provider
account, family invitation, membership, workflow, task, or case.

Structural recovery is a separately reviewed migration that first refuses
teardown while any provider selection or provider-selection event exists, then
drops only this packet's policies, wrappers, private functions/table, public
selection table, indexes, constraints, and two workflow-event columns.
`supabase/tests/family_provider_discovery_reversibility.sql` proves that order
inside a transaction and always rolls back.

No migration is applied by this Engineering packet. Application, SQL/RLS,
advisor, browser, and hosted evidence remain later independent gates.
