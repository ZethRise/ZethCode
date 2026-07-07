# Autonomous Experiment Loop

Iteratively improve a mechanically-verifiable metric without supervision. Design distilled from karpathy/autoresearch (minimal loop), codex-autoresearch (dual-gate, escalation ladder), and ARIS (anti-cheating audits).

## Setup (before the loop — get this right or everything downstream is garbage)

Write to `PLAN.md` and confirm with the user:

1. **Metric**: one number, extracted mechanically (grep/parse from a run log or script output). If the user's goal isn't measurable, negotiate one that is.
2. **Eval command**: exact command that produces the metric, with a **fixed budget** (fixed time / steps / dataset slice) so runs are comparable.
3. **Editable scope**: which files the loop may modify. Everything else — especially the eval script and data preparation — is **read-only**.
4. **Guard**: a regression check that must stay green (e.g. existing test suite). Improving the metric while breaking the guard = failed experiment.
5. **Stop condition**: target value, max iterations, or time budget.

Run the **baseline first** and record it in `artifacts/results.tsv` before any change.

## The loop

```
1. HYPOTHESIZE  one idea, one change. Check LOG.md — never retry a dead hypothesis.
2. IMPLEMENT    smallest change that tests the idea. git commit as trial.
3. RUN          eval command; redirect output: cmd > artifacts/run_N.log 2>&1
                (never let raw training output flood context; grep the metric out)
4. VERIFY       metric improved? guard still green? (both gates must pass)
5. DECIDE       PASS → keep commit, log KEPT
                FAIL → git revert/reset, log REVERTED + why
6. LOG          append to results.tsv: iter | commit | metric | delta | verdict | one-line description
7. REPEAT       until stop condition.
```

`results.tsv` (in `artifacts/`) is the single source of truth. One row per run, including failures.

## Escalation ladder (when progress stalls)

- **3 consecutive fails** → REFINE: re-read the failing runs' logs; vary the current hypothesis instead of new random ideas.
- **5 consecutive fails** → PIVOT: abandon the current direction; pick an orthogonal hypothesis family.
- **2 pivots without progress** → RESEARCH: search literature for approaches (`scripts/paper_search.py "<technique> improve <metric>"`); mine ideas from abstracts.
- **3 pivots without progress** → STOP and write the report; a negative result with a clean log is a valid outcome.

Any success resets the counters.

## Guardrails

- **Never touch the eval.** If the metric can only improve by changing the eval command, eval data, or the metric-extraction grep, that is cheating — stop and report the conflict instead.
- **One change per iteration.** Compound changes make attribution impossible.
- **Simplicity prior**: <1% gain that adds significant complexity → revert anyway; a code-deleting change that holds the metric → keep.
- **Don't stop to ask** when running autonomously — the user launched this to walk away. If truly blocked (environment broken, ambiguous goal), write the question in `LOG.md`, mark the run BLOCKED, and stop cleanly.
- **After context compaction**: re-read `PLAN.md` + `results.tsv` + tail of `LOG.md` before the next iteration. Every ~10 iterations, re-check you are still optimizing the metric defined in `PLAN.md` (protocol drift check).

## Final report (REPORT.md)

Baseline vs final metric, table of kept changes with per-change delta, dead ends and why they failed, and a reproduce command. Every number must appear in `results.tsv` — no narrating results that were never run.

## Sanity audit before reporting success

Spawn a fresh subagent with only the diff of kept changes + eval command + `results.tsv`. Ask: "Does any kept change game the metric rather than genuinely improve it (eval tampering, data leakage, hardcoded outputs, self-normalized scores)?" Address findings before claiming success.
