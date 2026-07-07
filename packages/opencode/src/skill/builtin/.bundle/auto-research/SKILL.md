---
name: auto-research
description: Autonomous research workflows with zero external dependencies (built-in tools + free APIs only). Use when the user asks to (1) survey literature on a topic and produce a cited research report ("调研X"、"文献综述"、"deep research"), (2) run an autonomous experiment loop to improve a metric ("自动实验"、"跑实验优化X"、"autoresearch"), (3) reproduce a paper as code ("复现这篇论文"、"paper to code"), or (4) write/polish an academic paper and verify its citations ("写论文"、"校验引用"、"citation check"). Covers paper search (arXiv/Semantic Scholar/OpenAlex/Crossref), cross-source fact checking, experiment verification, and bibliography auditing.
---

# Auto Research

Four research modes sharing one toolbox. Pick the mode, read its reference file, follow the workflow. All modes work with built-in tools (Bash, WebFetch, subagents) plus free public APIs — no API keys, no MCP servers.

## Mode selection

| User intent | Mode | Read this first |
|---|---|---|
| "调研/综述/深度报告 on topic X" | Literature survey → cited report | [references/survey.md](references/survey.md) |
| "优化指标/自动跑实验/让它自己迭代" | Autonomous experiment loop | [references/experiment-loop.md](references/experiment-loop.md) |
| "复现这篇论文/paper→code" | Paper reproduction | [references/paper2code.md](references/paper2code.md) |
| "写论文/改论文/查引用真伪" | Paper writing + citation audit | [references/writing.md](references/writing.md) |

If the request spans modes (e.g. "research X then run experiments"), chain them: survey → experiment → writing. Each mode reads/writes a shared workspace directory (see Workspace below).

API endpoints, rate limits, and query syntax for all free scholarly APIs: [references/api-cheatsheet.md](references/api-cheatsheet.md). Load it whenever scripts fail or custom queries are needed.

## Toolbox (scripts/)

Run scripts directly; do not reimplement their logic inline.

```bash
# Multi-source paper search (arXiv + Semantic Scholar + OpenAlex + Crossref), dedup, unified JSON
python3 scripts/paper_search.py "chain of thought reasoning" --sources arxiv,s2,openalex --limit 15 --out papers.json

# Verify one citation (waterfall: Crossref → S2 → OpenAlex → arXiv; title-similarity match)
python3 scripts/verify_citation.py --title "Attention Is All You Need" --author Vaswani --year 2017

# Audit a whole .bib file → verdict per entry (VERIFIED / MISMATCH / NOT_FOUND)
python3 scripts/verify_citation.py --bib refs.bib --out audit.json

# Fetch a paper's full text (arXiv ID or abs URL → text via ar5iv HTML, falls back to abstract)
python3 scripts/fetch_paper.py 2504.17192 --out paper.txt

# Fetch original LaTeX source instead (exact equations/tables — prefer for paper reproduction)
python3 scripts/fetch_paper.py 2504.17192 --latex --out-dir paper_src/
```

All scripts are stdlib-only Python 3. On HTTP 429/5xx they retry with backoff; if a source keeps failing, continue with the remaining sources and note the gap.

## Workspace

Every research run lives in one directory (default `./research/<slug>/`, ask user if ambiguous):

```
research/<slug>/
├── PLAN.md          # goal, scope, success criteria — write this FIRST, get user confirmation
├── LOG.md           # append-only: timestamped decisions, results, dead ends
├── papers/          # papers.json, downloaded fulltexts, notes per paper
├── artifacts/       # experiment outputs, generated code, figures
└── REPORT.md        # final deliverable (survey report / experiment report / paper draft)
```

Rules:
- Write `PLAN.md` before doing anything substantial; confirm scope with the user unless they asked for fully autonomous operation.
- Append to `LOG.md` after every significant step (searches run, papers read, experiments kept/reverted, hypotheses killed). This is the recovery point after context compaction — on resume, re-read `PLAN.md` + tail of `LOG.md` before continuing.
- Failed hypotheses and dead ends go in `LOG.md` too, so they are never retried.

## Non-negotiable principles (all modes)

1. **Never fabricate sources.** Every citation in any output must have been returned by a real API call or fetched page. If verification fails, mark it `[unverified]` or remove it — never guess metadata.
2. **Claims trace to evidence.** In reports, each nontrivial claim carries a citation; in experiments, each conclusion carries a metric from an actual run logged in `LOG.md`.
3. **Uncertainty is explicit.** Use `[uncertain]` markers rather than confident-sounding filler. A report with marked gaps beats a polished fabrication.
4. **Don't grade your own homework.** For final-quality checks (report review, citation audit, experiment sanity), spawn a fresh subagent that gets only file paths — not your conclusions.
5. **Mechanical verification beats narrative.** Prefer a script exit code, a grep'd metric, or an API response over "it looks correct".
