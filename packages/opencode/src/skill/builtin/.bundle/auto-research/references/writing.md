# Paper Writing + Citation Audit

Write or polish an academic paper and verify its bibliography. Citation audit design follows ARIS citation-audit (three-axis verification, four-verdict repair) and CiteCheck (API waterfall).

## Part A: Writing

### Inputs

Ask for whatever exists: experiment logs / `results.tsv`, prior draft, target venue + template, page limit. If this follows an experiment-loop run, `artifacts/` and `REPORT.md` are the raw material.

### Workflow

1. **Outline first**: section structure with 1-2 sentence purpose + the key claim per section. Confirm with user before drafting.
2. **Claims inventory**: list every empirical claim the paper will make, each mapped to its evidence (a results.tsv row, a figure, a cited paper). A claim with no evidence source gets cut or hedged now, not discovered by reviewers later.
3. **Related work**: search real papers (`scripts/paper_search.py`), cite only from results. Build `refs.bib` as you go — every entry originates from an API result, so metadata is copied, not recalled.
4. **Draft** section by section. Numbers come from artifacts only; check every number against its source when writing it.
5. **Refine**: spawn a fresh reviewer subagent with only the draft path; ask for the strongest rejection argument (weakest claim, missing baseline, overclaiming). Address or explicitly concede in the text. 1-3 rounds; stop when new findings become cosmetic.

Anti-patterns: rounding numbers favorably; "significantly" without a test; citing a paper for a claim it doesn't make (checked in Part B); expanding claims during refinement (refinement tightens, never inflates).

## Part B: Citation audit

Run on any paper/draft with a bibliography — also usable standalone ("查引用" on an existing PDF/tex).

### 1. Mechanical audit

```bash
python3 scripts/verify_citation.py --bib refs.bib --out artifacts/citation_audit.json
```

Verdicts: `VERIFIED` / `MISMATCH` (found but metadata disagrees) / `NOT_FOUND` (possible fabrication).

### 2. Context audit (the dangerous failure mode)

A real paper cited for the wrong claim is worse than an obviously fake citation. For each citation in the draft:
- Extract the sentence containing `\cite{key}` and what it asserts.
- Check the assertion against the cited paper's abstract (in audit JSON `matched`, or fetch via `scripts/fetch_paper.py`).
- Judge: SUPPORTS / WEAK / WRONG. For load-bearing citations (claims the contribution depends on), read more than the abstract.

Batch this with subagents for long bibliographies; give each subagent the sentence + abstract, not your expectation.

### 3. Repair (four verdicts per entry)

| Verdict | Action | Auto? |
|---|---|---|
| KEEP | verified + supports context | yes |
| FIX | right paper, wrong metadata → correct from `matched` fields | yes |
| REPLACE | wrong paper for the claim → search a real substitute | ask user |
| REMOVE | fabricated or irreplaceable → delete entry AND the `\cite` in text (reword sentence) | ask user |

Never leave a dangling `\cite` after removal. If a claim only stood on a removed citation, the claim is now unsupported — hedge or cut it.

### 4. Report

Append to `LOG.md`: total entries, verdict counts, actions taken. Uncertain cases stay marked `UNCERTAIN` — do not guess a verdict.

### Quality bar

Zero NOT_FOUND entries surviving in the final bib; every FIX applied from API-returned metadata, never from memory.
