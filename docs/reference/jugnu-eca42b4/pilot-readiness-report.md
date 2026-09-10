# Jugnu local pilot-readiness report

Assessment date: 2026-07-14  
Decision: **ready for founder-observed local rehearsal; not authorized for a real/public pilot**

## What is ready

- The resettable Aadhya/Arjun scenario connects guest onboarding, NRI, guardian/minor, multilingual
  participation, moderation, run-sheet, content-slot handoff, private memory, and CRM booking records.
- Exactly 20 fictional guest personas are seeded: 19 adults and one guardian-linked minor. Every
  persona has core consent and an event-local team; no real guest data is present.
- All public base tables use RLS. Anonymous access to guest, staff, CRM, payment, media, and audit data
  is denied. Rehearsal observability and retention preview RPCs are explicitly service-role-only.
- Payments are mock-only, matching uses no biometric vectors, show exports are content handoffs only,
  and CRM sends no outbound communication or partner commitment.
- The 20-person/60-operation burst passed with zero failures at 236 ms total and 150 ms p95, below the
  documented 12-second total and 6-second p95 limits.
- Serious/critical WCAG scans passed across public and signed product surfaces and protected marketing.
  Keyboard focus, reduced motion, Firefox, and 360px overflow checks passed.
- Product and marketing production builds pass. The largest product route remains below the recorded
  400 KB raw / 120 KB gzip JS and 50 KB CSS budgets.
- Backup integrity and destructive-state recovery pass against local Supabase; the canonical seed and
  readiness snapshot return after reset. Retention cleanup remains a review-only preview.
- The physical flows passed on Pixel 7a `3A021JEHN02437`, Android 16, Chrome 150.0.7871.114,
  Maestro 2.6.1, covering signed guest/photo-off, moderator approval/queue, and signed
  ops/indoor-backup paths.
- Four reviewed desktop evidence images cover guest, ops, show, and linked CRM booking state under
  `tests/e2e/rehearsal.spec.ts-snapshots/`.

## Security, privacy, and resilience posture

No critical/high issue was found in the local dependency audit, RLS assertions, or serious/critical
accessibility scan. This is evidence for the deterministic local demo—not a penetration test, DPIA,
legal opinion, production disaster-recovery test, or vendor assessment.

Risk controls are intentionally conservative: signed event/staff sessions, event-scoped constraints,
append-only audit and proposal histories, optimistic row versions, private media objects with
short-lived guest-bound URLs, no biometric vector, no payment instrument, no production credential,
and no flight-control artifact. The local reset is a rehearsal recovery mechanism; production RPO,
RTO, hosted backup retention, and incident ownership still need an approved operating design.

## Evidence matrix

| Area | Evidence | Result |
|---|---|---|
| Schema/seed | migrations through `20260715010000_slice8_pilot_hardening.sql`, reset, lint, generated type parity | Pass |
| RLS/security | `npm.cmd run test:slice8:security` | Pass |
| Burst | `npm.cmd run test:slice8:load` | Pass: 60/60, 236 ms total, 150 ms p95 |
| Accessibility | Axe on guest/staff/CRM/marketing plus keyboard/reduced motion | Pass: no serious/critical findings |
| Responsive/browser | Chromium projects, Firefox cross-surface, 360px geometry | Pass |
| Production bundles | product/marketing builds and `test:slice8:performance` | Pass |
| Recovery | 72,916-byte public-data dump, damage/reset/canonical assertions | Pass |
| Physical device | Slice 4 moderator plus Slice 8 guest/ops Maestro flows | Pass on recorded Pixel 7a |
| Visual pack | guest, ops, show, CRM baselines visually inspected | Pass |
| Dependency audit | `npm.cmd audit --omit=dev` | Pass: zero vulnerabilities |

## Not ready / approval gates

The following are deliberately unresolved and block a real pilot or public launch:

1. Founder/counsel approval of guardian verification, guest terms/privacy, DPDP handling, and the
   proposed 90-day demo retention posture.
2. Founder selection of a live payment/gifting provider, legal entity and tax handling, refund rules,
   sandbox/production credentials, reconciliation, and support ownership.
3. Founder/counsel/vendor decision on whether real photo matching is needed; if so, processor terms,
   hosting geography, consent language, retention/deletion proof, and a new security review.
4. A real certified operator agreement, exact content ingest schema, checksum/acknowledgement protocol,
   venue/permit/weather go-no-go responsibility, SLA, insurance evidence, and incident escalation.
5. Real venue network/site survey and a staffed rehearsal using approved devices and named owners.
6. Native-speaker approval of Hindi and Telugu public copy.
7. Approved hosting architecture, production Supabase project, secret handling, monitoring/on-call,
   hosted backup/restore rehearsal, public deployment, and real-data migration plan.
8. Founder authorization for a real guest list, event date, external outreach, spend, or commitment.

These gates remain in the existing founder-review queue; this slice did not edit or overwrite the
founder's unrelated `docs/FOUNDER-REVIEW.md` worktree change.

## Recommended next decision

Run one founder-observed local rehearsal using `docs/tech/rehearsal-runbook.md`. If the connected story
is accepted, approve a separately scoped real-pilot readiness phase with named legal, operator,
payments, venue, production-security, and support owners. Do not begin provider integration or deploy
the current local demo merely because Slice 8 passed.
