# 01 — Code Reviewer

Reviews a diff or file for correctness bugs, security issues, and needless
complexity — findings ranked by severity, each with a concrete failure scenario.

- **Adapted from:** awesome-copilot's *Gem Reviewer* and code-review chatmodes
- **SMB use case:** small teams rarely have a second senior engineer; this is the
  pre-PR second pair of eyes on every change.
- **Token tier:** 1 (Haiku / included Copilot model). Escalate to Tier 2 only for
  auth/payments/data-migration diffs — or use [08-security-auditor](../08-security-auditor/).

## Install

- Copilot: `copilot/code-reviewer.chatmode.md` → `.github/chatmodes/`
- Claude Code: `claude/agents/code-reviewer.md` → `.claude/agents/`

## Example session

> **You:** Review the diff of my last commit.
>
> **Agent:**
> **[HIGH] SQL injection — `orders.py:44`**
> `f"WHERE id = {order_id}"` interpolates user input. Failure: `order_id = "1 OR 1=1"`
> returns all orders. Fix: parameterized query.
>
> **[MED] Unhandled None — `orders.py:52`**
> `customer.email` when guest checkout leaves `customer = None`. Failure: crash on
> any guest order confirmation.
>
> **[LOW] Simplification — `utils.py:12–30`**
> Hand-rolled retry duplicates `tenacity`, already a dependency.
>
> Verdict: fix HIGH+MED before merge.

Cheap habit: run it on the *staged* diff before committing, not after the PR opens.
