# MIHWER — Product Implementation Plan

## Status and scope

**Status:** This is an earlier implementation plan. The approved local live-day UI and domain integrations were implemented in the prototype; durable Supabase storage, authenticated ownership, RLS, and deployment remain unimplemented. Use the current [product inventory](./MIHWAR-PRODUCT-INVENTORY.md) and [implementation roadmap](./MIHWAR-IMPLEMENTATION-ROADMAP.md) for audited status and next steps. The prototype is not production-ready.  
**Project basis:** The files currently present in this `Mihwer-Sarh` folder only. This plan does not depend on, request, or assume access to an older Mihwer source tree.  
**Historical baseline in this plan:** 61/61 checked-in Node tests passed at the time these checks were recorded; that count is superseded by the later 105/105 Node result documented in the current inventory and test strategy. The browser checks described here are historical and do not establish current backend, database, RLS, or production readiness. See the implementation evidence report for the earlier domain-integration scope and limits.

The earlier direction was an independent Mihwer product and Supabase PostgreSQL database, gradual TypeScript adoption, and preservation of the current UI, domain engines, and tests. Central Sarh identity was preferred, but its actual authentication contract remains unverified; see the current architecture and roadmap before implementation. When this plan was first written, no application code, tests, package manifests, dependencies, database, API, deployment configuration, or existing screen was changed; the later local prototype implementation is recorded in `quality-evidence/MIHWER-LIVE-DAY-IMPLEMENTATION-REPORT.md`.

## 1. Current engineering baseline

### Product and runtime shape

The current project identifies itself as `mihwer-journey-design-lab`. It is a static HTML/CSS/JavaScript design prototype, not an authenticated or data-backed Mihwer application:

- `index.html` loads the existing styles, `adhan` UMD bundle, `app.js`, and the progress, task, habit, and journey UI scripts using local relative paths.
- `app.js` owns the current screen state, translations, navigation, dialogs, display settings, and in-memory day map.
- `living.js` adds the day/sky scene, date and time controls, stations, tasks, subtasks, sleep calculations, prayer/location interactions, and the unified in-memory day timeline. When a location and calculation settings are supplied, the scene aligns with calculated local sunrise and sunset; otherwise it falls back to the selected time-zone clock.
- `paths-lab.js` adds life paths, path-associated tasks, path notes, extended tasks, and activity views.
- `habit-ui.js` and `habit-engine.js` implement recurring habits and their records/revisions in page memory.
- `immersive-journey.js` and `immersive-journey.css` provide the shared scenic visual layer, selectable boy/girl traveler, walk-before-opening station interactions (instant with reduced motion), daily-intention popup, explicit schedule adjustments through the existing timeline, and end-of-road achievement summary. This is a simulated journey: no camera access or physical-world AR. Intentions and traveler selection are page-memory state only; arriving never automatically records a task, habit or prayer. The daily intention appears once per current civil day in the session and can be reopened from the journey controls.
- `progress-contract.js`, `progress-adapters.js`, and `progress-engine.js` validate, normalize, adapt, deduplicate, and aggregate progress inputs.
- `extended-validation.js` and `extended-lifecycle.js` validate extended tasks and their subtasks and define explicit lifecycle transitions.
- `package.json` has no start, build, or test scripts. The only declared runtime dependency is `adhan@4.4.6`.
- There is no TypeScript, backend server, product API, database schema, migration, production storage, or project-level authentication integration in the current application source.

The app can be served locally as static files. It does not need a product server to render its prototype UI. Its labels explicitly describe example data and non-persistent behavior.

### Existing screen and feature map

| Screen / area | Existing behavior | Current data and limits |
|---|---|---|
| Journey — Day | Date navigation, unified timed/untimed timeline, summary, sky scene, station/task/habit/extended-task/activity details, sleep panel, prayer settings/calculation and opt-in location. | User interactions are still in memory only. Prayer times use `adhan` and user-selected settings; they are approximate, not an official timetable. Solar alignment uses calculated sunrise/sunset when available, with clock-based fallback otherwise. |
| Journey — Week | Seven date cards, selected-day navigation, period summaries. | Reads only the loaded in-memory day/station/task/habit examples; the summary is not a persisted history. |
| Journey — Month | Calendar-day navigation and summaries. | Calendar is navigable, but displayed progress is based on loaded in-memory examples, not user records from storage. |
| Journey — Year | Twelve month tiles and period summary. | Uses the same in-memory source; month tiles are navigational, not evidence that a month has real entries. |
| Activities / tasks and habits | Filters, daily tasks, status/progress, station/task details, extended tasks, subtasks, recurring habit management and records. | Edits affect memory only. They are not durable and are not tied to an authenticated owner. |
| Life paths | Predefined example life areas, path details, path-associated tasks/habits and notes. | A local catalog and in-memory associations; not user-configurable persistent records. |
| Document a moment | Example title/story/date fields, optional notes/links and media controls. | UI prototype only. Changes are temporary; media buttons do not open or upload files. |
| Sharing and preview | Privacy choices, field selection, preview screen. | Local preview only; no share URL, invitation, actual access control, or permission change. |
| Header utilities | Search, add dialog, voice information dialog, settings. | Search indexes the in-memory sample screen/station/task content. Voice is informational. Language/theme/time-zone/path settings are page state and are not saved. |

The first release must retain these screens and their current navigation affordances. A prototype control must remain explicitly unavailable until its real operation is implemented; it must not silently become success-shaped or present sample content as personal data.

### What works locally versus what needs persistence

**Works locally today:** rendering and navigation; language and direction switching; date browsing; opening/closing dialogs; adding/editing/rescheduling custom activities in memory; unified timeline sorting and overlap display; task and subtask transitions in memory; recurring habit scheduling/records/revisions in memory; extended tasks; progress aggregation; approximate prayer-time calculations from explicitly provided location/settings; opt-in device-location request; time-zone-aware day rollover and countdown; preview-only sharing.

**Requires durable storage and owner isolation:** journey stations and memories; their content, temporal precision and date; paths and user-selected links; tasks, subtasks and their transitions; habit definitions, revisions and dated records; ideas and their lifecycle/history; attachment metadata; user settings that should survive a reload; explicit relationships between these entities; audit/version data needed for reliable concurrent editing.

**Requires a service, identity, or explicit product policy:** secure user ownership, cross-device reads/writes, actual upload/download, external sharing/invitations, verified auth token handling, deletion/export/retention, and any background notifications or integrations. None is operational in this project today.

## 2. Existing domain engines and tests

### Progress contract and aggregation

`progress-contract.js` defines normalized date periods, source/type/status identity, validation, and civil-date/time-zone handling. `progress-adapters.js` maps station-day tasks, extended subtasks, and recurring-habit records into that contract without making the UI or database the owner of the domain definitions. `progress-engine.js` deduplicates equivalent observations, preserves source-attributed metadata, rejects contradictory records, separates categories and eligibility states, and computes ratios only when a valid denominator exists.

Preserve these semantics and public result shapes while adding storage adapters. A persistence write must not become a new source of progress truth by itself: read models should be adapted into the existing contract, and aggregation must continue to distinguish future, unrecorded, exempt, cancelled, deferred, and completed entries. Missing data must not be interpreted as failure or zero completion.

### Extended task and subtask lifecycle

`extended-validation.js` validates real civil dates, unique task/subtask identities, period boundaries, parent/subtask relationship shape, statuses, archive fields, and completion dates. `extended-lifecycle.js` supports explicit task and subtask complete/reopen/cancel/restore/archive/restore-archive transitions; completion is constrained by dates, and a parent completing does not implicitly complete its children. The page UI also validates before applying local state changes.

When persisted, keep subtasks as separately identifiable child records or a clearly versioned aggregate; either way, preserve their independent status and dates. Store enough transition history to reconstruct decisions, but do not infer completion from elapsed time or from the parent's status.

### Recurring habit engine

`habit-engine.js` validates daily/weekly schedules, date bounds, targets and units; resolves historical definitions through revisions; schedules records by civil date; validates completed/incomplete/exempt amounts; and summarizes only observed, eligible periods. The UI stores a page-local array, including records and revisions, so those otherwise useful semantics disappear on reload today.

Persist definitions, effective-dated revisions and one record per habit/civil date as distinct concerns. Keep “not recorded” distinct from incomplete; do not generate missing daily records simply to make a chart.

### Baseline tests

Tests use the built-in Node test runner; no dependency installation was performed.

| Command/check | Result in this review |
|---|---|
| `node --test ./*.test.cjs` | **46 passed, 0 failed** across the five current test files. |
| `node --check` on the 10 page-loaded JavaScript files | **Passed.** |
| Local browser smoke test on `http://127.0.0.1` | **Passed for exercised flows:** day/week/month/year, activities, paths, sharing, document, settings/language, dialog Escape. |
| Browser console errors / failed requests in tested flows | **None observed.** |
| Arabic at `1440×900` and `390×844` CSS | `dir=rtl`; `scrollWidth` equaled viewport width on the exercised screens. |
| English at `1440×900` and `390×844` CSS | `dir=ltr`; `scrollWidth` equaled viewport width on the exercised screens. |

These are a characterization baseline, not acceptance for a future database/API implementation. Add service, authorization, persistence, browser reload, concurrency, and failure-path tests before calling any persisted feature complete.

## 3. Product data model proposal

This is a logical model for review, not SQL or a migration. PostgreSQL is the source of truth for structured records; object storage is only for binary files. All product rows are private by default and scoped to a verified Mihwer principal.

### Ownership and journey

- **Principal mapping:** identify the account using a stable subject established by the central Sarh identity contract. Do not copy passwords or make the browser authoritative for a `user_id`. If Mihwer needs an internal UUID, maintain a server-controlled mapping from the validated identity issuer/subject to that UUID.
- **User profile:** internal Mihwer `id`, verified identity-provider issuer/subject mapping, IANA time zone, locale and timestamps. Do not copy passwords or make the browser authoritative for an owner ID.
- **Journey:** `id`, `owner_id`, title/settings, timestamps and version. The journey is the user's persistent life record; it does not reset at a day, month, or year boundary.
- **Journey path:** `id`, `journey_id`, `owner_id`, name, description, display order, lifecycle fields, timestamps and version. These are user-owned domains, not implicit goals, projects, or tasks.

### Journey stations: the central timeline

Use **journey stations** as independent, persistent timeline entities—not as tasks or as the universal container for memories:

- `id`, `journey_id`, `owner_id`, title, description and approved station type
- temporal representation and precision (defined in the time policy below)
- lifecycle, created/updated timestamps, optimistic version and optional archive/delete timestamps
- Optional explicit relation tables to memories, tasks, goals and paths. These links never create or delete the related entity.

A station can exist without any related entity. Creating a station never creates a task. The first timeline screen is a chronological read model over real stations and memories; it must retain source identity and must not invent dates.

### Memories, knowledge, projects, goals, skills, ideas

- **Memory:** an independent, user-owned record with content, temporal representation, lifecycle and optional attachments. It may be explicitly linked to one or more stations; it is not implicitly a station or a task.
- **Idea Vault:** an independent idea aggregate retaining original content, revisions and activity. An idea can produce zero or many results. A result link does not consume, replace, or delete the idea. `Transformed` means at least one result was created; additional results remain allowed, and transformation history is retained if a result is later unlinked or archived.
- **Projects, goals, knowledge topics and skills:** future independent entities only after their workflows are approved and implemented. Do not model a prototype card as a real domain entity. Add a typed foreign-key outcome relation only when the target entity exists; until then represent an intent as a proposal, not a successful conversion.

### Tasks and habits

- **Task:** owner/journey, optional path, title/details, schedule start/end or due date, status, timestamps/version, and source/provenance if created through another feature. A task may have optional explicit station, memory or goal links. None is mandatory.
- **Subtask:** its own stable ID, parent task ID, title/details, status, scheduled date, completion/cancellation/archive dates, timestamps/version. Parent and child transition rules stay aligned with the current lifecycle engine.
- **Task transition history:** task/subtask ID, actor, previous/new state, event time, optional reason and request/idempotency key. Keep it separate from current task state; do not use a history table as a replacement for the existing validation contract.
- **Habit definition:** owner/journey, name, optional path, cadence, selected weekdays, start/end, target/unit, current status, timestamps/version.
- **Habit revision:** habit ID, effective civil date, cadence/days/target/unit. Historical records resolve against the definition effective on their date.
- **Habit record:** habit ID, civil date, status (`completed`, `incomplete`, `exempt`), optional amount, and audit timestamps. Absence of a row means unrecorded. Enforce one record per habit/date and ensure the date is scheduled and not future according to the agreed time-zone policy.

### Time and calendar policy

- Store real instants in PostgreSQL `timestamptz` normalized to UTC. Preserve the user's IANA zone (for example `Asia/Riyadh`) on the profile; optionally snapshot the zone used to interpret a scheduled local time when that historical context matters.
- Store civil dates such as a memory's all-day date, a habit schedule date, or a date-only task deadline as PostgreSQL `date`, not midnight UTC. Never convert a date-only value into an instant just to simplify sorting.
- Store temporal precision explicitly: exact instant, exact civil date, approximate date/range, bounded range, or unknown. Unknown remains null/unknown, never the current date or a fabricated date.
- Validate date/range shape and start ≤ end. For recurring schedules, evaluate the civil date in the user's IANA zone. Define behavior for DST gaps/overlaps before enabling local-time scheduling; do not silently shift an ambiguous or nonexistent time.
- Timeline queries sort instants and date-only entries using explicit temporal-kind/date rules, preserve precision, and paginate stably. Display conversion to local time occurs at the presentation boundary.

### Proposed PostgreSQL tables and constraints (logical only)

No SQL, migrations, or actual tables are created by this plan.

| Table | Principal fields and relationship | Key constraints / notes |
|---|---|---|
| `mihwer_users` | internal UUID; verified identity `issuer` + `subject`; IANA zone; locale | Unique `(issuer, subject)`; no password or client-chosen owner ID. Identity claims must be verified before mapping. |
| `journeys` | `id`, `owner_id → mihwer_users`, settings, version, timestamps | Composite unique `(id, owner_id)` for owner-preserving foreign keys; journey survives time-period boundaries. |
| `journey_paths` | `id`, `journey_id`, `owner_id`, name/order/lifecycle | Composite FK `(journey_id, owner_id) → journeys`; unique IDs within journey as product policy requires. |
| `stations` | `id`, `journey_id`, `owner_id`, content, temporal fields, lifecycle/version | Composite FK to journey; temporal CHECK constraints enforce exactly the fields required by precision; no task creation side effect. |
| `memories` | `id`, `journey_id`, `owner_id`, content, temporal fields, lifecycle/version | Independent entity; same temporal and ownership constraints as stations. |
| `station_paths`, `station_memories` | explicit station-to-path and station-to-memory relations | Composite FKs include `owner_id`; unique endpoint pairs; unlinking does not delete endpoints. Add `station_tasks`, `station_goals`, `task_memories` only with their approved target domain. |
| `tasks` | `id`, `journey_id`, `owner_id`, optional `path_id`, dates/status/version | Composite owner-preserving FKs; status/date checks; station links live in an explicit relation table. |
| `subtasks` | `id`, `task_id`, `owner_id`, schedule/status/completion/cancellation/archive dates | Composite FK to parent task; unique stable identity; status and completion-date consistency checks; independent child transitions. |
| `task_events` | task/subtask, actor, previous/new state, event time, idempotency key | Append-only audit history; uniqueness for replay protection as appropriate; no inferred transition. |
| `habits` | `id`, `journey_id`, `owner_id`, schedule/current lifecycle | Owner-preserving FKs; schedule validates cadence and bounds. |
| `habit_revisions` | habit, effective civil date, cadence/days/target/unit | Unique `(habit_id, effective_date)`; preserve history and immutable effective definitions. |
| `habit_records` | habit, civil date, completed/incomplete/exempt, amount | Unique `(habit_id, date)`; date must be scheduled and not future under user zone; no row means unrecorded. |
| `ideas`, `idea_revisions`, `idea_events` | independent content/lifecycle, version history and activity | Owner-preserving FKs; revisions distinct from activity events; archive does not erase source. |
| `idea_outcome_proposals` / domain-specific outcome links | idea to proposal, or idea to a real implemented result | Keep proposals distinct from created entities. Use FK link tables per implemented target domain, not unchecked polymorphic IDs. Many outcomes per idea. |
| `attachments` | owner, parent entity, private object key, metadata, deletion state | Parent ownership verified; unique opaque object key; validate type/size/checksum; object lifecycle reconciled with metadata. |

Use composite foreign keys or equivalent constraints to ensure child `owner_id` matches the owning journey/parent, not just that each referenced UUID exists. Add indexes for owner + journey + temporal range, parent lookups, and stable pagination. Exact index definitions and constraints are finalized with the approved query workload before migration.

### Attachments and evidence

- Put structured metadata in PostgreSQL: owning principal, parent station/idea/outcome, object key, original filename, declared and detected media type, byte size, checksum, created time and optional caption.
- Put file bytes in a private Supabase Storage bucket, never in SQLite or a public bucket by default. Generate short-lived upload/download authorization only after checking owner and parent ownership. Use opaque object keys scoped to the verified owner; do not trust a client-supplied path.
- Validate allowed size/type, inspect actual file content where feasible, and define deletion/retention behavior before enabling uploads. Store links as URLs/metadata, not as uploaded files. Text notes remain text records.
- Evidence produced by a result should link to that result and, optionally, to its source idea/station; preserve provenance and timestamps.
- Keep **content history** (prior content values/revisions needed to restore or compare an idea) separate from the **activity log** (meaningful events such as status changes, links, outcome creation, evidence addition, archive and restore). Do not log every keystroke or duplicate ordinary field values into the activity feed. Both records identify actor and time; an activity entry references the resulting entity/revision without becoming a second source of content truth.

## 4. Entity relationship and product invariants

```text
Sarh verified principal
  └── Mihwer journey (owner)
        ├── journey paths
        ├── journey stations  ← central timeline
        │     ├── station ↔ paths (optional, explicit)
        │     ├── station ↔ tasks/goals (optional, explicit; never automatic)
        │     └── station ↔ memories (optional, explicit)
        ├── memories (independent timeline records)
        │     └── attachments / evidence
        ├── tasks
        │     └── subtasks (independent identity and lifecycle)
        ├── recurring habits
        │     ├── effective-dated revisions
        │     └── dated records (missing ≠ incomplete)
        └── Idea Vault ideas (independent lifecycle)
              ├── content revisions / activity events
              ├── evidence / attachments
              └── 0..N outcome links → implemented result domains
```

Invariants:

1. Every private row is owned by a verified principal and belongs to a journey the same principal owns. Enforce this in database policies and service authorization, not only in UI filters.
2. No event, station, memory, idea, milestone or project is converted into a task by default.
3. Links are explicit and reversible where the product permits; unlinking does not delete either endpoint.
4. An idea survives outcome creation and may have multiple outcomes.
5. Date precision and time-zone semantics survive storage and reads; unknown dates stay unknown.
6. Every aggregate used for progress is derived by the existing contract/adapters/engine and can explain its eligible evidence. No synthetic missing-day records.
7. A user must not be able to read, update, link, upload to, or delete another owner's rows or objects by changing an identifier.
8. A station and a memory remain distinct records even when linked; a station or memory never creates a task automatically.
9. A timeline representation is a read model over owned records, not a new source that overwrites their original types or date precision.

## 5. API and service-layer proposal

The application has no API today. Define typed application services first so components and domain engines do not depend directly on Supabase query syntax.

### Browser/application layers

1. **UI/presentation:** keep the present screens and navigation; add loading, empty, retryable error, offline/unavailable and saved states without presenting mock content as account content.
2. **Feature services:** `JourneyService`, `StationService`, `PathService`, `TaskService`, `HabitService`, `IdeaService`, `AttachmentService`.
3. **Domain layer:** preserve current progress/habit/task validators and engines as pure functions over typed inputs. Add domain contracts only where the product model needs them.
4. **Repository/transport ports:** typed operations, pagination, cancellation, error normalization, auth context, concurrency/version and idempotency behavior.
5. **Infrastructure adapter:** a separately testable Supabase/PostgreSQL and Storage implementation, or an authenticated Mihwer API if that is chosen. Do not import provider clients into domain engines.
6. **Authorization boundary:** server-side identity validation and database row-level policies; browser checks are UX only.

### Responsibility boundaries

| Layer | Owns | Must not own |
|---|---|---|
| UI | Rendering, input, navigation, loading/empty/error/saved states, accessibility and localization | Authorization decisions, database queries, progress arithmetic, or inventing successful writes |
| Feature/application services | Use-case orchestration, validation order, transaction boundaries, pagination, idempotency, domain error mapping | DOM behavior, CSS, or bypassing domain engines |
| Domain engines | Pure task/subtask/habit transitions, temporal validation and progress aggregation | Network, Supabase SDK, DOM, browser storage, or implicit entity creation |
| Repository ports | Typed read/write contracts, stable IDs, versions, cancellation and result/error shapes | Provider-specific query syntax in callers |
| Infrastructure | Supabase/PostgreSQL and private Storage adapters; identity verification at trusted boundary | Product semantics or browser-trusted `owner_id` |

### Row-level security and ownership model

RLS is mandatory on every private table and Storage object, not a UI convenience:

- Resolve the Mihwer owner only from a server-verified identity mapping. A request/body `owner_id`, journey ID, or object path is never proof of ownership.
- For select/insert/update/delete, require the authenticated principal to map to the row owner. For child records, also require the referenced parent/journey to have that same owner; use composite foreign keys to prevent cross-owner links even when UUIDs are known.
- Check both old and new ownership on updates so a user cannot transfer a row by changing `owner_id` or `journey_id`. Keep owner fields immutable to ordinary clients.
- Deny anonymous access by default. Give service/administrative access only to narrowly scoped server components; never ship a service-role key to the browser.
- Storage objects remain private. Upload/download authorization verifies owner, parent, allowed media policy and metadata; path-prefix checks alone are insufficient. Signed URLs are short-lived and issued only after authorization.
- Test two independent owners against every operation and every relation. Include guessed IDs, cross-owner joins, owner mutation, anonymous access, expired/invalid token, and storage-object access.

### Lifecycle and delete/restore policy

Use explicit transitions and soft deletion first; no table or file is silently erased by an ordinary UI action.

| Entity | Lifecycle proposal |
|---|---|
| Station / memory / path | Active → archived; archived can be restored. Delete marks a recoverable deletion state and hides it from ordinary timelines; restoration is allowed during the approved recovery window. |
| Task / subtask | Preserve existing open/completed/cancelled and archive/restore transitions, with independent subtask state. Deletion is separate from task completion and must preserve audit provenance. |
| Habit | Active → paused or archived; dated records and effective revisions remain associated and are not rewritten when the schedule changes. Correcting a record is explicit and auditable. |
| Idea | Captured → exploring → developing → ready → transformed; archive is a separate reversible action. Transformed records that at least one result was created, not that the source idea is consumed; more outcomes can be added. The original and its revision history remain available. |
| Attachment | Active → deletion pending → object removed and metadata purged/retained according to policy. Failed object cleanup is retried and surfaced; it must not leave an apparently available attachment. |

The retention/recovery duration, final purge schedule, account-wide deletion behavior, legal holds, and whether task status history is retained after deletion are **pending product/privacy decisions**. Until approved, no permanent purge workflow or retention period is to be assumed. Parent/child deletes must have a documented policy; never cascade-delete unrelated linked stations, memories, tasks, ideas or outcomes.

### Candidate API surface

Use a versioned API contract, even if the first adapter calls Supabase through a supported client:

- `GET /v1/me` — resolved Mihwer principal and capabilities, not sensitive identity profile data.
- `GET/POST /v1/journeys`, `GET/PATCH /v1/journeys/{journeyId}`
- `GET/POST /v1/journeys/{journeyId}/stations`, `GET/PATCH/DELETE /v1/stations/{stationId}`
- `GET/POST /v1/journeys/{journeyId}/paths`, plus explicit station/path link and unlink operations.
- `GET/POST /v1/journeys/{journeyId}/tasks`, `GET/PATCH /v1/tasks/{taskId}`, explicit task transition and subtask operations.
- `GET/POST/PATCH /v1/journeys/{journeyId}/habits`; habit revision and dated record operations.
- `GET/POST /v1/journeys/{journeyId}/ideas`, `GET/PATCH /v1/ideas/{ideaId}`, explicit lifecycle, revision, outcome-link and evidence operations.
- Attachment authorization endpoints for short-lived upload/download; server verifies ownership and file policy before issuing access.

Timeline reads should support cursor pagination, a civil-date range, date precision and explicit sort order; return stable IDs and original source types. Writes should validate the authenticated owner, use optimistic concurrency (version/ETag), and use idempotency keys for retryable create/transition requests. Return typed errors for validation, conflict, unavailable dependency, unauthorized/forbidden and not found; do not hide failed writes behind optimistic success.

### Supabase division of responsibility

- **PostgreSQL:** identity-to-principal mapping, journey/station/path/task/subtask/habit/revision/record/idea/outcome/attachment metadata, constraints, indexes, RLS policies and limited audit events.
- **Supabase Storage:** private binary photo/video/audio/file objects. PostgreSQL stores metadata and ownership, not the binary body.
- **Not Storage:** links, descriptions, notes, status history, timelines and searchable structured content.
- **Not client authority:** the browser never uses a Supabase service-role key. Direct client access is acceptable only if the confirmed auth integration yields claims Supabase can validate and RLS has been tested. Otherwise use a trusted backend/edge/API boundary.

### Attachment deletion and recovery

- Keep object bytes in a private bucket and metadata/ownership in PostgreSQL. Do not put binaries in database rows or browser persistence.
- An upload is not complete until metadata and object state agree; use an explicit pending/complete state and reconcile interrupted uploads.
- On delete, mark the attachment unavailable, remove or schedule removal of the object, and retain/delete metadata according to the approved recovery policy. Make deletion idempotent and retry failed cleanup; report failure rather than pretending the file is gone.
- Restore is possible only while the object still exists or has a recoverable backup. Parent deletion must not accidentally remove shared/independently linked files; exact attachment ownership/cardinality is a pending detail.
- Links and text notes are structured records, not Storage objects. Result evidence retains its result/source provenance.

## 6. Central Sarh identity integration

Identity compatibility is an unresolved dependency, not an assumption. Do not treat a token issued for another Sarh project or API as valid for Mihwer simply because it is a JWT.

Before any integration, obtain and approve the central identity contract:

- issuer, signing algorithms and key/JWKS rotation;
- expected audience(s), token lifetime, clock-skew policy and revocation/session behavior;
- stable subject identifier and account-linking policy;
- whether the identity provider supports a Supabase-compatible third-party JWT configuration and whether required claims map to RLS roles/UIDs;
- allowed redirect origins, logout behavior and token refresh/renewal flow;
- how service-to-service calls authenticate and how user context is propagated.

Then choose one reviewed path:

**A. Direct supported federation:** only if Supabase can verify the exact issuer, signature, audience, expiry and relevant claims and the provider's refresh/session behavior is supported. Exercise real RLS policies with valid and invalid owner identities.

**B. Trusted exchange/API boundary:** if direct support is absent or incompatible, verify the Sarh token in a trusted server/edge component and issue/use a Mihwer-scoped short-lived credential or make authorized server-side requests. Keep signing/service secrets server-side. Never accept browser-supplied owner IDs as proof of identity.

Do not implement an unsigned claim bridge, copy auth secrets into frontend configuration, share service-role credentials, or silently relax RLS to make login appear to work.

## 7. JavaScript-to-TypeScript migration without feature loss

Keep the existing interface and behavior. Migrate by contracts and slices, not by replacing the application:

1. Freeze a characterization suite for current screen navigation, day/time controls, dialogs, task/subtask/habit transitions, reduced motion, RTL/LTR and current failure/empty states. Keep the 46 existing engine tests unchanged and passing.
2. Add explicit JSDoc or TypeScript interfaces for the current shapes: station, task, subtask, recurring habit/revision/record, progress entry, date precision, identity context and service results. Record transitional optional/legacy fields rather than guessing.
3. Type pure engines first: extended validation/lifecycle, progress contract/adapters/engine, habit engine. Keep their observable exports and add parity tests against the current JavaScript behavior.
4. Select and approve the smallest build strategy that supports the target deployment before adding dependencies. TypeScript compiler/build tooling may be a necessary development dependency, but do not install or add it in this planning phase.
5. Convert one feature boundary at a time, retaining existing HTML/CSS and screen components. Keep temporary JS/TS interop explicit and short-lived; avoid a wholesale framework or bundler migration unless a separate decision authorizes it.
6. Introduce repository/service interfaces and test them with in-memory fakes before adding the Supabase adapter. Do not embed remote calls in pure domain engines.
7. Convert the UI and entry point only after service contracts stabilize. Verify every preexisting screen and keyboard/RTL behavior in the built app, not only type-checking.
8. Remove no legacy JS file, export, UI affordance, engine, or test until equivalent behavior is proven and removal is separately reviewed.

The existing page is a classic-script application with ordered globals and no module bundler. A build/packaging choice is therefore required for maintainable TS modules; it must preserve the relative-asset and deployment requirements and cannot be presumed to be Vite, Next.js, or another framework.

## 8. Suggested implementation order and acceptance gates

### Phase 0 — Lock the baseline and product contracts

- Preserve the current app and its tests; add no data or product API yet.
- Agree the first real-user journey slice, principal contract, privacy/date policies, domain vocabulary, deletion/export policy and build/deployment constraints.
- Add UI characterization tests for current behavior and establish test commands usable in CI.
- **Gate:** existing tests still pass, and the agreed contract documents are approved.

### Phase 1 — Typed application/service boundary

- Define transport-independent types and service interfaces for the journey timeline and identity context.
- Type and parity-test the pure task/habit/progress engines first.
- Add loading/empty/error/saved states to the existing screens without redesigning or removing them.
- **Gate:** existing interactions remain intact, current engine test outputs match, and service tests cover validation/conflicts.

### Phase 2 — Verified identity and private persistence foundation

- Resolve the Sarh identity questions; choose direct supported federation or trusted token exchange/API.
- Design ownership and RLS policies, backup/retention/delete semantics, indexes, row versioning and storage policy.
- Implement schema/API only after separate authorization; no production migration is part of this plan task.
- Test unauthorized, cross-owner, expired-token, invalid-audience, replay/retry, and concurrent-write cases.
- **Gate:** a real authenticated account can access only its own records through an end-to-end tested path.

### Phase 3 — Real journey timeline MVP (fastest coherent product slice)

- Persist and retrieve a station/memory with exact, approximate, range or unknown date; create/edit/archive as approved; list it in the existing day/week/month/year navigation.
- Replace sample entries in the authenticated user flow with an honest empty state and server-owned records. Retain the prototype examples only in an explicitly isolated preview/test fixture, never as account records.
- Support explicit optional path/station relationships; do not create tasks automatically.
- Add ordering, pagination, retry/error behavior, ownership, reload persistence, and history/version tests.
- **Gate:** create a real station, reload/sign in again, see the same station in correct periods, and prove another user cannot read it.

### Phase 4 — Persist tasks and habits without changing their meaning

- Add repositories to the current screens and map persisted records through existing adapters into progress aggregation.
- Persist tasks/subtasks separately or with proven equivalent identity/lifecycle semantics; persist habit definitions, revisions and dated observations.
- Preserve current category denominators and missing/unrecorded/future/exempt/cancelled/deferred rules. Do not reinterpret a station as a task.
- Add retry/idempotency, duplicate-submit and concurrency tests around writes.
- **Gate:** the current 46 tests pass unchanged; database/API parity tests show identical domain results for equivalent input; browser reload and multi-user isolation work.

### Phase 5 — Attachments, evidence and Idea Vault

- Add private Storage upload only after ownership, size/type, consent, retention, signed-access and deletion behavior are approved.
- Add Idea Vault as an independent domain with lifecycle and content history, explicit zero-to-many outcome links, and evidence; connect to station/task/project/goal/knowledge only when the target domain is implemented and its contract approved.
- **Gate:** a source idea remains available after producing multiple outcomes, evidence provenance is correct, and deleting/unlinking an outcome cannot silently delete the idea.

### Phase 6 — Expand product domains and release readiness

- Implement projects, goals, learning/knowledge, skills, genuine sharing, import/export, observability and deployment only after their product/security decisions.
- Re-test privacy, accessibility, localization, operational recovery, backup restore, performance, data export and deletion before release.
- **Gate:** release checklist, production identity, infrastructure, monitoring, recovery, security and product acceptance are all verified. Deployment is a separate approved task.

## 9. Approved decisions and remaining verification gates

### Approved product/architecture decisions

1. Mihwer is an independent product with its own PostgreSQL database through Supabase.
2. Keep the existing interface, domain engines and tests; move to TypeScript gradually, not by a rewrite.
3. A journey is persistent for the life of the user and is not reset by day, month or year.
4. Store instants in UTC, retain the user's IANA zone, and keep civil dates separate from instants.
5. Stations, memories, tasks, habits and paths are independent user-owned entities; station links to tasks, goals, paths and memories are optional and explicit.
6. A station, memory or achievement never creates a task automatically.
7. Idea Vault is independent; ideas retain their content and history and may produce multiple results.
8. Binary files belong in private Supabase Storage with access checks and owner verification.
9. Delete, restore and retention behavior must be explicit and user-visible.
10. Sarh central identity is the intended identity direction. No token, JWT, issuer, audience, claim mapping, provider support or refresh behavior is assumed until the actual contract is verified.

### Facts and policy details still to verify

- **Sarh identity contract (implementation blocker):** obtain the authoritative issuer and discovery/JWKS information, algorithms and key rotation, audiences, stable subject, claim mapping, expiry/refresh/revocation/logout, redirect origins, account linking, and service-to-service flow. Confirm who owns the contract and test that Supabase or the selected trusted boundary can validate it. Do not configure auth until verified.
- **Trust boundary choice:** after identity verification, choose direct supported federation only if claims and RLS can be tested end to end; otherwise choose a trusted Mihwer API/token-exchange boundary. This choice is not yet made.
- **Time policy detail:** IANA zone is per user; confirm initial zone selection/fallback and whether an instant's originating zone is snapshotted. Define DST gap/overlap behavior for future local-time schedules.
- **Retention detail:** approve recoverable-delete window, permanent purge timing, attachment backup, account deletion/export, audit retention and restoration behavior before enabling permanent deletion.
- **Media policy:** approve file types, size limits, scanning/validation and orphan cleanup behavior before uploads.
- **Domain details:** finalize station/memory kind vocabularies, allowed task/station/memory cardinalities, and whether a user can own more than one journey. Approved links remain optional and explicit.
- **Idea outcomes:** approve the first implementable outcome types and the activity-vs-content history presentation. Projects, goals, knowledge and skills remain future domains until their product contracts exist.
- **Build target:** inspect the actual future Vercel constraints and approve the smallest mixed JS/TS build approach before adding compiler/tooling dependencies. No framework or build system is presumed.
- **Prototype fixture handling:** all current hard-coded days, stations, tasks and habits are examples and must never be imported or displayed as real account data.

These are verification and detailed policy gates, not a reopening of the approved product direction. No implementation starts until the user separately authorizes a development package.

## 10. First development package and acceptance

### Package 1 — Persistent Journey Timeline vertical slice

This is the recommended first actual development package, after explicit start approval and identity-contract verification. It preserves the current screens and pure engines while making one end-to-end user journey real. It does not include Idea Vault, task/habit persistence, file uploads, external sharing, or deployment.

**Deliverables**

1. Characterization tests around the current day/week/month/year navigation, document/dialog behavior, RTL/LTR, keyboard use and the existing task/habit/progress engine outputs.
2. A small gradual TypeScript foundation and typed station/memory/time/repository/service contracts that can coexist with current JavaScript. No framework rewrite; choose the minimal build tooling only after the deployment constraint check.
3. A PostgreSQL logical implementation for Mihwer owner mapping, persistent journey, stations and memories, plus explicit station/path and station/memory relation support only where the referenced entity exists. Include ownership constraints, temporal checks, versions, pagination indexes and RLS. Schema/migrations are part of this future package only after separate execution authorization; they are not created in this plan.
4. A repository/service implementation for create, list by timeline range, read, edit, archive, restore and recoverable delete for stations/memories. Use UTC for instants, `date` for civil dates and preserve approximate/range/unknown precision.
5. Connect the existing day/week/month/year surfaces to the authenticated timeline service. Keep current design; show true loading, empty, retryable error and saved states. Hard-coded examples remain isolated test/preview fixtures and are never account data.
6. A documented, verified auth boundary and owner mapping. The package cannot be accepted with a fake production identity or an assumed JWT. Use test-only principals for automated isolation tests.

**Tests and acceptance criteria**

- Existing **46 Node tests pass unchanged**; TypeScript typecheck/build passes without removing current files, engines, tests or screens.
- Service/repository unit tests cover valid/invalid temporal shapes, unknown dates, ownership mapping, pagination, optimistic conflicts and idempotent retries.
- Database integration tests apply policies to two owners and prove select/insert/update/delete/link isolation, including guessed IDs, immutable owner fields and cross-owner parent references. Anonymous and invalid/expired identities are denied.
- Temporal tests verify UTC instants, civil dates that do not shift by browser zone, user's IANA display conversion, range order, exact/approximate/unknown preservation, DST cases per the approved policy, and deterministic stable ordering.
- Browser tests prove create → reload → read → edit → archive/restore for a real authenticated test user; records appear in correct timeline periods, and a second user cannot see them.
- UI smoke tests cover all existing navigation/screen entry points, keyboard/focus/dialog Escape, Arabic RTL and English LTR at desktop and mobile CSS viewports; no horizontal overflow, uncaught exception or failed request.
- No station/memory operation creates a task. No sample fixture is visible as a real user's record. Failed writes show a failure state and never a success-shaped response.
- **Success gate:** all above pass against an isolated development/test environment, existing behavior is preserved, and identity/RLS evidence is reviewed. Production provisioning, production migrations and deployment remain separate approvals.

## 11. Risks and dependencies

| Risk/dependency | Consequence | Mitigation / gate |
|---|---|---|
| Central Sarh token may not be accepted by Supabase | Unauthorized reads, brittle custom claims, or login that only appears to work | Verify issuer/audience/signature/refresh and test end-to-end before choosing direct federation; use a trusted exchange/API boundary if needed. |
| Current screens say “no saving” and use hard-coded examples | Demo values could be mistaken for real account records during transition | Separate preview fixtures from authenticated data; use explicit empty/loading/error states; never seed a real user's journey from demo objects. |
| Existing task/habit/progress semantics can change accidentally at persistence boundary | Ratios and status history become misleading or old tests regress | Keep pure engines as the semantic authority; adapters and parity tests at API/database boundaries; preserve 46 baseline tests. |
| Unknown/approximate dates and time-zone boundaries are lost | Records appear on invented days or in the wrong period | Store date precision explicitly and distinguish civil dates from instants; test timezone/DST boundaries. |
| Cross-owner references or Storage paths are not checked | Data exposure across accounts | RLS, composite ownership constraints, server authorization and adversarial cross-owner tests for rows and files. |
| Direct client access exposes privileged keys or trusts client identity | Account compromise or broad data access | Never ship service-role secrets; validate tokens server-side; least privilege; RLS tests. |
| TypeScript migration collides with classic-script globals and ordered loading | Runtime breakage despite successful type-check | Incremental typed engines, stable exports, characterization/parity tests, then a separately approved minimal build strategy. |
| Requirements span ideas, memories, tasks, projects, skills, sharing and media | Overbuilding and delaying the first useful product | Deliver the real timeline slice first; leave unimplemented domains as explicit follow-up phases, not fake records. |
| Current evidence/profile directories are large and project has no Git history | Difficult review, backups and change attribution | Preserve the files as requested; establish a source-control/change-review process separately before broad implementation. Do not clean these directories as part of this plan. |

### Overall readiness judgment

The current folder is a useful, locally runnable UX/domain prototype with meaningful pure-engine tests. It is not yet a real-user product foundation for durable data: authentication, API, database, persistence, ownership, storage, deployment contract and typed build pipeline are absent. The lowest-risk route is to preserve the interface and engines, establish the identity/service boundary, then make the journey timeline genuinely persistent before broadening tasks, attachments, ideas or other life domains.

**Stop point:** this is a plan only. No schema, migration, API, TypeScript conversion, dependency change, interface change, data write, or deployment has been started. Await explicit approval of the plan and the relevant decisions before implementation.
