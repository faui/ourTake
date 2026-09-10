# Jugnu 20-person pilot rehearsal runbook

Last updated: 2026-07-14  
Scope: local/demo rehearsal only  
Scenario: `aadhya-arjun-hyderabad-2026`

## Purpose and stop rules

This runbook proves the connected guest, moderation, ops, show-handoff, memory, and CRM story without
claiming production readiness. It never authorizes live payments, biometrics, partner flight work,
real guest data, public deployment, or a hosted Supabase mutation.

Stop the rehearsal if the reset does not reproduce exactly 20 demo guest personas, any exposed public
table lacks RLS, a non-mock payment or biometric vector appears, a signed role boundary fails, or a
show artifact could be mistaken for flight commands. Preserve logs; do not patch hosted data.

## Workstation and device preflight

From `C:\venkat\limca\jugnu`, use `npm.cmd` in PowerShell:

```powershell
npm.cmd install
supabase start
supabase db reset
supabase db lint --level warning
npm.cmd run test:slice8:security
```

Expected readiness snapshot: 20 personas, 19 adults, one guardian-linked minor, 20 event-local team
memberships, zero biometric vectors, zero non-mock payments, zero terminal unlinked bookings, and no
public base table without RLS. The canonical event is fictional and uses only local Supabase ports
55321-55324.

For the physical path, confirm an unlocked Android device and record evidence:

```powershell
adb devices -l
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release
adb shell dumpsys package com.android.chrome
maestro --version
```

The verified reference device is Pixel 7a `3A021JEHN02437`, Android 16, Chrome 150.0.7871.114,
Maestro 2.6.1. A different device is acceptable only when its details and result are recorded.

## Roles and 20-person roster

The deterministic roster is Ananya, Kabir, Savitri Amma, Leela, Neha, Vihaan, Farha, Rohan, Aarav,
Meera, Naina, Omar, Ishita, Aditya, Priya, Vikram, Tara, Rahul, Kavya, and Diya. Vihaan is the one
minor; Neha is the linked guardian. Leela, Rohan, Priya, Rahul, and Diya exercise remote time zones.
English, Hindi, and Telugu are represented, and every persona has core participation consent and one
event-local team assignment.

Staff roles are Maya (ops/show), Imran and Sravani (moderation), and Dev (sales/CRM). Role choice uses
signed, local-only, HttpOnly rehearsal sessions. Dev is intentionally denied moderation access.

## Golden evening sequence

1. Open `/training`; state aloud that payments are mock, photo matching is a no-vector fixture, and
   the show interface is a simulator/content handoff—not flight control.
2. Open Leela's NRI view. Verify venue time, schedule, stream placeholder, and constrained blessing.
3. Open Ananya. Verify declined photo matching does not block schedule, participation, or all 18 manual
   memories. Review a queued/approved blessing and the 9:30 scheduled moment.
4. Open Neha and Vihaan. Verify the guardian link, minor payment denial, and no minor self-enablement of
   photo matching.
5. Enter as Sravani or Imran. Review pending English/Hindi/Telugu examples, the rejected political
   fixture, reasoned audit history, approved-only queue, stale-row handling, and pending private media.
6. Enter as Maya. Verify human-controlled run-sheet states, the `Finale go/no-go and indoor backup`
   cue, and `Weather/permit confirmation required.` Move only disposable demo rows when demonstrating
   delay/hold/moved-indoors states.
7. Open `/show/...`. Verify failed overflow content is non-exportable, successful assignments map only
   to approved template slots, and the visible disclaimer says the artifact is not flight control.
8. Return to photo memory. Verify private signed media URLs, manual browsing without matching, adult
   fixture disclosure, not-me/claim/forget/delete paths, and human publication review.
9. Enter CRM as Dev. Select `Aadhya & Arjun pilot wedding`; verify booking `booked demo`, deposit
   `paid mock`, partner confirmation `pending demo`, and the linked run-of-show. No-send WhatsApp and
   CSV actions must remain user-initiated drafts/exports only.
10. Reset after any write demonstration. A fresh reset is the only accepted canonical pickup state.

## Burst, accessibility, browser, and bundle evidence

Run from a fresh reset:

```powershell
npm.cmd run test:slice8:load
npx.cmd playwright test tests/e2e/hardening.spec.ts --project=hardening-desktop
npx.cmd playwright test tests/e2e/rehearsal-cross-browser.spec.ts --project=rehearsal-firefox
npx.cmd playwright test tests/e2e/rehearsal.spec.ts --project=hardening-desktop
npm.cmd run build:product
npm.cmd run test:slice8:performance
```

The burst creates and removes 20 paid-mock messages, 20 private upload jobs, and 20 private objects
concurrently: 60 operations, total target at most 12 seconds, p95 at most 6 seconds, zero failures.
The 2026-07-14 reference result was 236 ms total and 150 ms p95 on the local workstation.

Accessibility blocks serious/critical WCAG 2.0 A/AA and 2.1 AA findings on training, guest, signed and
denied ops, signed show, signed CRM, and protected marketing. Keyboard focus and reduced motion are
explicit checks. Firefox covers training/event/denied-ops/denied-CRM and 360px overflow. Production
route budgets are 400,000 raw JS bytes, 120,000 gzip JS bytes, and 50,000 CSS bytes; the largest
verified route was the guest event at 366,702 raw JS, 109,492 gzip JS, and 33,815 CSS bytes.

## Offline, backup, recovery, and retention

Guest schedule data uses the existing offline cache and visibly distinguishes offline queued writes
from saved server state. Never imply a queued write succeeded. The existing participation and upload
tests cover idempotent retry and simulated upload interruption.

Run the local-only recovery drill:

```powershell
npm.cmd run test:slice8:recovery
```

It writes `C:\tmp\jugnu-slice8-public-data.sql`, verifies that events, guest sessions, and audit rows
exist in the 72,916-byte data-only backup, damages one schedule and one run-sheet row, resets the local
database, and proves the canonical schedule, cue, and readiness snapshot return. The backup is local
test evidence, not a production backup policy.

`preview_demo_retention_cleanup` is service-role-only and non-mutating. It reports eligible demo rows
and requires human review of private object deletion and audit preservation. No automatic cleanup or
destructive rollback is authorized.

## Physical Android golden path

With local Supabase reset and the product server running:

```powershell
adb reverse tcp:3100 tcp:3100
maestro --device 3A021JEHN02437 test .maestro/slice8-golden-rehearsal.yaml
adb reverse --remove tcp:3100
```

The flow creates a local-only signed adult, verifies the guest event and session, jumps to private
memory with matching off, then enters the signed Maya ops role and jumps to the indoor-backup cue. It
captures `jugnu-slice8-guest` and `jugnu-slice8-ops`. Android camera/file-chooser automation is not in
this path; the browser compression/retry behavior remains covered by Playwright. The complementary
`.maestro/slice4-moderation-ops.yaml` flow also passed on the reference device, including signed
Sravani approval, immutable reason receipt, approved-only queue insertion, and screenshot.

## Closeout checklist

```powershell
npm.cmd install
supabase db reset
supabase db lint --level warning
supabase gen types typescript --local --schema public
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test:slice8:security
npm.cmd run test:slice8:load
npm.cmd run test:e2e
npm.cmd run test:slice8:performance
npm.cmd run test:slice8:recovery
npm.cmd audit --omit=dev
git diff --check
```

End on a clean canonical database. Review the four baselines in
`tests/e2e/rehearsal.spec.ts-snapshots/`. Record any failed command honestly. Passing this runbook
means the local demo is repeatable; it does not clear the external gates in the readiness report.
