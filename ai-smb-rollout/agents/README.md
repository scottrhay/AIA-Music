# Agent & Skill Catalog

Eleven buildouts curated from [github/awesome-copilot](https://github.com/github/awesome-copilot)'s
most popular entries, adapted for SMB work and rewritten side-by-side for
**GitHub Copilot** and **Claude Code**. Default token tier per the
[playbook](../token-savings/playbook.md) is noted for each.

| # | Buildout | Adapted from (awesome-copilot) | Default tier |
|---|---|---|---|
| 01 | [Code Reviewer](01-code-reviewer/) | Gem Reviewer, code-review chatmodes | 1 |
| 02 | [Documentation Writer](02-documentation-writer/) | documentation-writer (Diátaxis), create-readme | 0–1 |
| 03 | [Debugger](03-debugger/) | Gem Debugger, Debug Mode | 1→2 |
| 04 | [Test Engineer](04-test-engineer/) | AI Team QA, javascript-typescript-jest, java-junit | 1 |
| 05 | [Planner / PRD](05-planner-prd/) | Create PRD, breakdown-plan, breakdown-feature-prd | 1 |
| 06 | [Conventional Commits](06-git-conventional-commits/) | conventional-commit, git-commit | 0 |
| 07 | [Codebase Onboarding](07-codebase-onboarding/) | acquire-codebase-knowledge, context-map | 1 |
| 08 | [Security Auditor](08-security-auditor/) | Gem Reviewer (OWASP), github-actions-hardening, gdpr-compliant | 2 |
| 09 | [Incident Postmortem](09-incident-postmortem/) | incident-postmortem | 0–1 |
| 10 | [Token-Saver Terse Mode](10-token-saver-terse-mode/) | Caveman Mode | any |
| 11 | [SMB Business Assistant](11-smb-business-assistant/) | email-drafter, daily-prep, gtm-* skills | 0 |

## Installing a buildout

**GitHub Copilot** — copy the file(s) from the buildout's `copilot/` folder into your repo:

- `*.chatmode.md` → `.github/chatmodes/` (appears in the Copilot Chat mode picker)
- `*.prompt.md` → `.github/prompts/` (run with `/name` in chat)
- `*.instructions.md` → `.github/instructions/` (auto-applied by file pattern)

**Claude Code** — copy from the buildout's `claude/` folder:

- `agents/*.md` → `.claude/agents/` (subagents — delegated automatically or via `@name`)
- `skills/<name>/SKILL.md` → `.claude/skills/<name>/` (invoked as `/name`)

Project-level installs (paths above) share with your team via git; use
`~/.github/…` / `~/.claude/…` equivalents for personal installs.

## Anatomy of a buildout

Each folder is self-grading for the Week 6 capstone: a README with the SMB use
case + a worked example, and the two toolchain implementations kept functionally
identical — diff them to learn how the formats map:

| Concept | Copilot | Claude Code |
|---|---|---|
| Persistent persona + tools | `.chatmode.md` (frontmatter: `description`, `tools`, `model`) | `.claude/agents/*.md` (frontmatter: `name`, `description`, `tools`, `model`) |
| Reusable one-shot task | `.prompt.md` | `.claude/skills/<n>/SKILL.md` |
| Always-on rules | `.instructions.md` (`applyTo` glob) / `copilot-instructions.md` | `CLAUDE.md` |
