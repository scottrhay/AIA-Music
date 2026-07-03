# 06 — Conventional Commits

Generates [Conventional Commits](https://www.conventionalcommits.org/) messages
from the staged diff — correct type/scope, imperative subject, body explaining *why*.

- **Adapted from:** awesome-copilot's *conventional-commit* and *git-commit* skills,
  plus *commit-message-storyteller*
- **SMB use case:** clean history is free documentation and enables automated
  changelogs/semver — discipline a small team gets from tooling, not policy docs.
- **Token tier:** 0 — this is *the* canonical local-Hermes task. A student's
  first daily-driver workflow that costs literally nothing.

## Install

- Copilot: `copilot/commit.prompt.md` → `.github/prompts/` (run `/commit` in chat)
- Claude Code: `claude/skills/commit/SKILL.md` → `.claude/skills/commit/`
- Tier-0 direct: `git diff --staged | ollama run hermes-smb "$(cat commit-prompt.txt)"`

## Example session

> **You:** /commit
>
> **Agent:** Staged: `pricing.py` (+14/−3), `test_pricing.py` (+22).
>
> ```
> fix(pricing): default missing states to zero tax rate
>
> Checkout 500'd for AK/OR/MT because TAX_TABLE omitted zero-tax
> states. Fall back to 0 on lookup and add the three entries
> explicitly so intent is visible in the table.
>
> Refs: #142
> ```
>
> Two changes are unrelated (`README` typo) — suggest splitting into a second
> `docs:` commit. Split? (y/n)

Cheap habit: commit small and often; the agent writes better messages for small
diffs, and small diffs make Buildout 01's reviews sharper too.
