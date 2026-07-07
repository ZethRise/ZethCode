# Literature Survey → Cited Report

Produce a research report where every claim is backed by a verified source. Modeled on schema-first deep research (outline before search) with cross-source verification.

## Workflow

### 1. Scope (write PLAN.md)

Define in `PLAN.md`:
- **Question**: the precise research question (not just a topic)
- **Fields**: what each surveyed item must answer (e.g. method, dataset, metric, limitation) — this schema controls report quality
- **Inclusion criteria**: year range, venues, min citations, subtopics in/out of scope
- **Deliverable shape**: comparison table / narrative survey / annotated bibliography

Confirm scope with the user unless running autonomously.

### 2. Search (broad → narrow)

```bash
python3 scripts/paper_search.py "<query>" --sources arxiv,s2,openalex --limit 20 --year-from 2022 --out papers/papers.json
```

- Run 2-4 query variants (synonyms, subfield terms); merge results.
- Also use WebFetch on survey papers' related-work sections and awesome-lists to catch what keyword search misses.
- Snowball: for the 2-3 most central papers, check their references/citers (S2 API, see api-cheatsheet.md).
- Log every query string and result count in `LOG.md`.

### 3. Read and extract (parallel subagents)

For each selected paper (usually top 10-25 by relevance × citations):

```bash
python3 scripts/fetch_paper.py <arxiv_id> --out papers/<slug>.txt
```

Spawn subagents in parallel batches (3-5 papers each). Each subagent gets:
- The fetched text file paths (not summaries)
- The field schema from PLAN.md
- Instruction: fill every field; write `[uncertain]` where the paper doesn't clearly answer; output one JSON/markdown note per paper into `papers/notes/`

Subagents must extract only what the text supports — no outside knowledge filling gaps.

### 4. Cross-check

Facts that will become load-bearing claims in the report (numbers, "first to do X", "SOTA on Y") need two independent sources, or an explicit single-source marker. Contradictions between papers go in the report as contradictions — do not silently pick one side.

### 5. Write REPORT.md

Structure: TL;DR (5 bullets) → background → thematic sections per PLAN.md → comparison table → open problems → references.

- Inline citations as `[author year](url)` using URLs from `papers.json` — never a URL that wasn't returned by search/fetch.
- Every nontrivial claim cites; claims from step 4 with one source get `[single source]`.
- Gaps stay visible: "no paper in our set evaluates X" is a finding.

### 6. Independent review

Spawn a fresh subagent with only `REPORT.md` + `papers/papers.json` paths (not your conclusions). Ask it to: (a) flag claims without citations, (b) spot-check 5 random citations against papers.json, (c) flag conclusions stronger than the cited evidence. Fix findings, log the review in `LOG.md`.

## Quality bar

- ≥ 90% of citations resolve to entries in `papers.json`
- Zero fabricated URLs or metadata
- Report distinguishes: established consensus / single-source claims / speculation
