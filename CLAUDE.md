# Claude Code — Project Instructions
# ALP Store Audit

Claude Code reads this file automatically at the start of every session.
These instructions are always active. Never ignore them.

---

## Project Context

**App:** ALP Store Audit
**Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase
**Design system:** TailAdmin (Outfit font, #465FFF brand blue)
**Roles:** Admin, NSO Head, SM, DM, CM, EPC, FM
**Supabase URL:** https://ioqdpdarlsbanxyjhseh.supabase.co

**Test credentials:**
| Employee Code | Mobile | Password | Role |
|---|---|---|---|
| EMP-NSO-001 | +91 98100 00001 | Nso@1234 | NSO Head |
| EMP-SM-001 | +91 98200 00001 | Sm@1234 | SM (MUM-042) |
| EMP-SM-002 | +91 98200 00002 | Sm@1234 | SM (PUN-017) |
| EMP-SM-003 | +91 98200 00003 | Sm@1234 | SM (NGP-005) |
| EMP-ADM-001 | +91 98000 00001 | Admin@1234 | Admin |

---

## The Prime Directive

**Never consider any task done until the QA Agent says it passes.**

Every build, fix, refactor, or change — no matter how small — goes through
the QA loop before you tell the user it is complete.

---

## The Build-QA Loop

This is the only way work gets done in this project:

```
TASK RECEIVED
     ↓
IMPLEMENT the change
     ↓
INVOKE QA AGENT on what changed
     ↓
Critical or High bugs found?
     ↓ YES                       ↓ NO
FIX the bugs              UPDATE QA_AGENT.md
     ↓                    with new test cases
INVOKE QA AGENT                  ↓
again on same scope        UPDATE QA_LOG.md
     ↓                           ↓
  (loop)                 ASK LEARNING CHECK
                                 ↓
                         TELL USER: done + summary
```

Never break this loop. Never skip QA.
Never tell the user something is done when QA found Critical or High bugs.

---

## How to Invoke the QA Agent

The QA Agent lives in QA_AGENT.md in this project root.

Load and run it like this:

```
Read QA_AGENT.md in full.
You are now the QA Agent described in that file.
Run QA on: [scope of what just changed]
```

Then act as the QA Agent — discover, generate tests from the actual
code, execute them, report results.

After QA is done, switch back to developer mode and fix what was found.

---

## Scoping QA to What Changed

| What changed | QA scope |
|---|---|
| New screen or page | `run QA [file path]` |
| Modified component | `run QA [component name]` |
| Auth or middleware change | `run QA auth` + `run QA security` |
| Database schema change | `run QA` (full run) |
| API route change | `run QA [route]` + `run QA security` |
| Bug fix | `run QA [component where bug was]` |
| Before any deploy | `run QA smoke` |

---

## The Learning Check — runs at end of every QA session

After every QA run completes, ask the user this exact question:

```
═══════════════════════════════════════════════════
LEARNING CHECK
═══════════════════════════════════════════════════
During this session, did you spot any bug or issue
that the QA Agent did not catch on its own?

  Y — Yes, I caught something QA missed
  N — No, QA caught everything

Your answer:
═══════════════════════════════════════════════════
```

If the user answers Y:

```
═══════════════════════════════════════════════════
What was the bug or issue QA missed?
Describe it in one or two sentences:
═══════════════════════════════════════════════════
```

Then immediately:
1. Add a [LEARNED] test case to QA_AGENT.md
2. Add an entry to the Learning History table in QA_LOG.md
3. Confirm to the user:

```
═══════════════════════════════════════════════════
LEARNED ✓
Added TC-L[n] to QA_AGENT.md
This will be tested automatically on every future run.

What was added:
  Test: [one line description]
  Missed because: [honest reason]
  Will now catch: [what this protects going forward]
═══════════════════════════════════════════════════
```

If the user answers N:

```
═══════════════════════════════════════════════════
Good. QA_AGENT.md needs no updates from this session.
QA_LOG.md updated.
═══════════════════════════════════════════════════
```

This question must be asked every single time. No exceptions.

---

## Rule: Update QA_AGENT.md for Every New Code Path

When you add any new screen, field, role, status, or validation:
1. After QA passes, open QA_AGENT.md
2. Add test cases derived from the new code
3. Tell the user: "Added [n] test cases to QA_AGENT.md for [feature]."

---

## Rule: Update QA_AGENT.md When User Reports a Bug

If the user tells you about a bug that QA did not catch:
1. Acknowledge the miss
2. Fix the bug in the application code
3. Open QA_AGENT.md
4. Add a [LEARNED] test case tagged with today's date
5. Update QA_LOG.md Learning History
6. Tell the user: "Bug fixed. Added TC-L[n] to QA_AGENT.md."

---

## Rule: Log Every QA Run

After every QA execution, append one line to QA_LOG.md:
| [date] | [scope] | [passed] | [failed] | [Critical] | [High] | [bug IDs] | [QA_AGENT updated?] |

---

## What "Done" Means

A task is complete when ALL of the following are true:
- [ ] Feature or fix works as specified
- [ ] QA Agent reports zero Critical bugs
- [ ] QA Agent reports zero High bugs
- [ ] QA_AGENT.md updated with new test cases for new code
- [ ] QA_LOG.md has a new entry for this run
- [ ] Learning check was asked and answered
- [ ] Medium and Low bugs are logged in QA_LOG.md for later

---

## Summary Response Format

When a task is done, always end with:

```
TASK COMPLETE
═══════════════════════════════════════
What was built: [description]
QA result: [n] passed / [n] failed
Bugs fixed: [list or "none"]
QA_AGENT.md: [n] test cases added
QA_LOG.md: updated
Medium/Low bugs for later: [list or "none"]
═══════════════════════════════════════
```
