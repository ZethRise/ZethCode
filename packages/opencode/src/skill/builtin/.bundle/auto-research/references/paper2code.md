# Paper → Code Reproduction

Reproduce a paper's method as a working repo. Modeled on Paper2Code's planning → analysis → coding pipeline with artifacts on disk at each stage.

## Workflow

### 1. Acquire the paper

```bash
# LaTeX source — preferred for reproduction: exact equations, tables, hyperparameters
python3 scripts/fetch_paper.py <arxiv_id_or_url> --latex --out-dir papers/src/
# fallback: readable text via ar5iv (equations flattened)
python3 scripts/fetch_paper.py <arxiv_id_or_url> --out papers/paper.txt
```

`--latex` prints the extracted file list and the main .tex (the one with `\documentclass`); some e-prints are PDF-only — fall back to text mode then.

If the user has a PDF instead, ask them for the arXiv id (ar5iv gives cleaner text) or read the PDF directly. Check whether an official repo already exists (search GitHub via WebFetch) — if it does, ask the user whether they want reproduction-from-scratch or just to run the official code.

### 2. Planning (write artifacts/plan.md)

Read the full paper. Produce:

- **Method summary**: the core algorithm in your own words, with the paper's section/equation numbers
- **Scope decision**: which experiments to reproduce (usually the main table, not every ablation) — confirm with user
- **Repo skeleton**: file tree with one-line responsibility per file
- **Dependency graph**: which module gets built first
- **config.yaml**: every hyperparameter mentioned in the paper, with the paper's value and section reference; unstated ones marked `# [uncertain: not specified in paper, using common default]`

### 3. Analysis (write artifacts/analysis.md)

For each file in the skeleton, before writing any code: inputs/outputs, the paper equations it implements, and edge cases. Flag every place where the paper is ambiguous — these are the reproduction risks. List them explicitly; decide and document each resolution.

### 4. Coding

Implement in dependency order. After each module, run it (unit-level smoke test) before moving on. Track progress in `LOG.md`.

Compute-realism: if the paper's full training is infeasible here, build a scaled-down verification path (small model / data subset / few steps) and say so in the report — never silently pretend a full reproduction happened.

### 5. Verify

- **Smoke test**: full pipeline runs end-to-end on tiny input.
- **Numbers check**: run the scoped experiment; compare against the paper's reported numbers in a table: `metric | paper | ours | gap | note`.
- Gaps are normal; explain plausible causes (less compute, unstated hyperparameters, data version). Do not tune against the paper's test numbers until they match — that's overfitting to the target, note it if the user asks for it.

### 6. Report (REPORT.md)

What was reproduced, comparison table, list of ambiguities and how each was resolved, known deviations, and exact commands to rerun.

## Principles

- Paper text is the spec; when the official repo exists and contradicts the paper, note the discrepancy rather than silently following either.
- All hyperparameters live in `config.yaml`, none hardcoded — reviewers check this first.
- Every ambiguity resolution is a logged decision, not an invisible guess.
