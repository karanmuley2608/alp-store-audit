# Claude Code — Universal Project Instructions

These instructions apply to every project this file lives in.
Claude Code reads this file automatically at the start of every session.

---

## The Prime Directive

**Never consider any task done until the QA Agent says it passes.**

Every build, fix, refactor, or change — no matter how small — goes through the QA loop before you tell the user it is complete.

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
     ↓ YES                    ↓ NO
FIX the bugs            UPDATE QA_AGENT.md with
     ↓                  new test cases for new code
INVOKE QA AGENT              ↓
again on same scope     UPDATE QA_LOG.md
     ↓                       ↓
  (loop)              TELL USER: done + summary
```

Never break this loop. Never skip QA. Never tell the user something is done when QA found Critical or High bugs.

---

## How to Invoke the QA Agent

The QA Agent lives in `QA_AGENT.md` in this project root.

Load and run it like this:

```
Read QA_AGENT.md in full.
You are now the QA Agent described in that file.
Run QA on: [scope of what just changed]
```

Then act as the QA Agent — discover, generate tests from the actual code, execute them, report results.

After QA is done, switch back to developer mode and fix what was found.

---

## Scoping QA to What Changed

Do not run full QA on every small change. Scope it correctly:

| What changed | QA scope |
|---|---|
| New screen or page | `run QA [file path]` |
| Modified component | `run QA [component name]` |
| Auth or middleware change | `run QA auth` + `run QA security` |
| Database schema change | `run QA` (full — schema affects everything) |
| API route change | `run QA [route]` + `run QA security` |
| Bug fix | `run QA [component where bug was]` |
| Before any deploy | `run QA smoke` |
| New dependency added | `run QA security` (check for vulnerabilities) |

---

## The Learning Check — runs at the end of every QA session

After every QA run completes — without exception — ask the user this exact question before closing the session:

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

If the user answers **Y**:

```
═══════════════════════════════════════════════════
What was the bug or issue QA missed?
Describe it in one or two sentences:
═══════════════════════════════════════════════════
```

Then immediately:
1. Add a `[LEARNED]` test case to `QA_AGENT.md`
2. Add an entry to the Learning History table in `QA_LOG.md`
3. Confirm to the user:

```
═══════════════════════════════════════════════════
LEARNED ✓
Added TC-L[n] to QA_AGENT.md
This will be tested automatically on every future run.

What was added:
  Test: [one line description of the new TC]
  Missed because: [honest reason]
  Will now catch: [what this protects against going forward]
═══════════════════════════════════════════════════
```

If the user answers **N**:

```
═══════════════════════════════════════════════════
Good. QA_AGENT.md needs no updates from this session.
QA_LOG.md updated.
═══════════════════════════════════════════════════
```

This question must be asked every single time. It is not optional. It is not skipped if the session was short. It is not skipped if no bugs were found. The only way the agent learns is if this question is asked and answered every session.

---

## Rule: Update QA_AGENT.md for Every New Code Path

When you add any new feature, screen, field, role, status, or validation:

1. After QA passes, open `QA_AGENT.md`
2. Add test cases derived from the new code — one per branch, one per validation rule, one per state transition
3. Add them under the correct section or create a new section if needed
4. Tell the user: "Added [n] test cases to QA_AGENT.md for [feature name]."

The QA Agent must always reflect the current state of the codebase.

---

## Rule: Update QA_AGENT.md When User Reports a Bug

If the user tells you about a bug that QA did not catch:

1. Acknowledge that QA missed it
2. Fix the bug in the application code
3. Open `QA_AGENT.md`
4. Add a test case that would have caught this exact bug — be specific
5. Mark it with `[LEARNED]` tag so the learning history is visible
6. Update `QA_LOG.md` defect history — mark the bug as found manually
7. Tell the user: "Bug fixed. QA_AGENT.md updated with TC-[n] — this bug class will be caught automatically in future."

This is how the QA Agent learns. Every missed bug becomes a permanent test case.

---

## Rule: Log Every QA Run

After every QA execution, append one line to `QA_LOG.md`:

```
| [date] | [project] | [scope] | [passed] | [failed] | [Critical] | [High] | [bug IDs] | [QA_AGENT.md updated?] |
```

---

## What "Done" Means

A task is complete when ALL of the following are true:

- [ ] The feature or fix works as specified
- [ ] QA Agent reports zero Critical bugs
- [ ] QA Agent reports zero High bugs
- [ ] `QA_AGENT.md` updated with new test cases for new code
- [ ] `QA_LOG.md` has a new entry for this run
- [ ] Medium and Low bugs are logged in `QA_LOG.md` for later

---

## Summary Response Format

When a task is done, always end with this summary:

```
TASK COMPLETE
═══════════════════════════════════════
What was built: [description]
QA result: [n] passed / [n] failed
Bugs fixed: [list or "none"]
QA_AGENT.md: [n] test cases added / "no changes needed"
QA_LOG.md: updated
Medium/Low bugs for later: [list or "none"]
═══════════════════════════════════════
```
