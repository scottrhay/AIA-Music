# 03 — Debugger

Root-cause analysis: reproduces the failure, forms ranked hypotheses, tests them
against evidence, and proposes the minimal fix plus a regression test.

- **Adapted from:** awesome-copilot's *Gem Debugger* and *Debug Mode*
- **SMB use case:** production bugs with no dedicated on-call — a disciplined
  debugging loop beats panicked guessing, and the method transfers to students.
- **Token tier:** 1, escalating to 2 after two failed hypothesis rounds *with the
  evidence attached* (stack trace, failing repro, logs).

## Install

- Copilot: `copilot/debugger.chatmode.md` → `.github/chatmodes/`
- Claude Code: `claude/agents/debugger.md` → `.claude/agents/`

## Example session

> **You:** Checkout intermittently 500s since yesterday's deploy. Stack trace attached.
>
> **Agent:**
> Repro first: trace shows `KeyError: 'tax_rate'` in `pricing.py:88`, only on
> AK/OR/MT orders. Hypotheses: (1) new `TAX_TABLE` missing zero-tax states —
> **likely**, table added in yesterday's `d4f2c1a`; (2) stale cache — unlikely,
> error persists after TTL.
> Test: `grep` confirms `TAX_TABLE` has 47 entries.
> **Root cause:** three zero-tax states omitted. **Minimal fix:** `TAX_TABLE.get(state, 0)`
> — plus the three explicit entries. **Regression test:** checkout for each
> zero-tax state asserts 200 and $0.00 tax line.

Cheap habit: paste the trace and the repro *in the first message* — evidence-free
debugging sessions are where retry tokens go to die.
