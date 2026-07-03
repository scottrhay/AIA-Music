# Token Savings Playbook

The economics of this program in one sentence: **most AI work is routine, and
routine work should cost nothing.** This playbook is the routing policy, the
habits, and the measurements that make that true.

## 1. The three-tier routing policy

| Tier | Engine | Use for | Cost |
|---|---|---|---|
| **0 — Local Hermes** | `ollama run hermes-smb` / aider | drafts, summaries, commit messages, explanations, boilerplate, prose, brainstorming | $0 |
| **1 — Cheap hosted** | Copilot base models · Claude Haiku · hosted Hermes | routine agent work: small edits, test scaffolds, doc generation, code Q&A with context | ¢ |
| **2 — Frontier** | Copilot premium (GPT-5/Opus-class) · Claude Opus | multi-file refactors, gnarly bugs, architecture, security review of critical paths | $$ |

**Route down, escalate up.** Start every task one tier lower than feels natural.
Escalate only on a concrete signal:

- Local model emits `ESCALATE:` (baked into the [`hermes-smb` Modelfile](../hermes/Modelfile))
- Two failed attempts at the current tier
- The task is high-stakes (auth, payments, data migration, anything customer-visible)

And when you escalate, **bring evidence**: the failing test, the stack trace, the
diff. One well-armed frontier prompt beats five vague ones — that's the single
biggest cost lever after routing itself.

## 2. Context hygiene (where tokens actually go)

In agentic tools, *input* context dwarfs output. Habits that cut it:

1. **Scope the ask.** "Review `src/auth/login.ts` lines 40–90" not "review my code."
2. **Summarize, then discard.** After a long exploration, have the agent write a
   short map/notes file; start the next session from the notes, not the history.
   (Claude Code: `/compact` or `/clear` between tasks; Copilot: new chat per task.)
3. **Keep repo instructions lean.** `CLAUDE.md` / `.github/copilot-instructions.md`
   are prepended to *every* request. One page, imperative bullets, no essays.
4. **Terse output is a setting.** Install
   [`../agents/10-token-saver-terse-mode`](../agents/10-token-saver-terse-mode/) —
   answers-first, no restating, no boilerplate courtesy.
5. **Don't paste what the agent can read.** Agentic tools read files themselves,
   selectively; a wholesale paste sits in context for the rest of the session.

## 3. Tool-specific levers

**GitHub Copilot (student plan)**
- Chat on local Hermes via BYO-model (free); save **premium requests** for the
  coding agent and hard chats — they're a monthly quota, treat them as the budget unit.
- Prefer included models in the picker for routine chats; check the multiplier
  before choosing a premium model.

**Claude Code**
- `/model` to drop to a cheaper model for routine sessions; use subagents with
  `model: haiku` in their frontmatter for mechanical steps (several buildouts in
  this kit do exactly that).
- Prompt caching is automatic — but it only pays if the conversation prefix is
  stable: batch related questions in one session instead of re-opening context.
- `/cost` shows session spend; `/compact` before long follow-on work.

**Both:** one repo-instructions file, kept current, saves the model re-deriving
project conventions every session — the cheapest tokens are the ones encoding
knowledge once.

## 4. Budgets and measurement

- **Set the budget first.** Per student/seat per week: e.g. 50 premium requests
  or $5 API spend. Hitting the cap forces better routing — that's the point.
- **Measure per workflow.** For each recurring workflow, record: tier used,
  tokens/requests per run, retry count. The capstone cost table format:

  | Workflow | Tier 0 | Tier 1 | Tier 2 | Chosen tier |
  |---|---|---|---|---|
  | Commit message | $0.00 | — | — | 0 |
  | PR review (small) | $0.00 (draft) | $0.02 | — | 0→1 |
  | Prod bug root-cause | — | $0.08 | $0.60 | 1, escalate on 2 fails |

- **Review monthly.** Any workflow living on Tier 2 is a candidate for a better
  prompt, a skill/template, or a tier-down experiment.

## 5. Anti-patterns

- ❌ Frontier model as default chat — the most expensive habit in the room
- ❌ Re-explaining the project every session instead of fixing the instructions file
- ❌ Marathon sessions that never compact/clear — context balloons quadratically in cost
- ❌ Vague escalation ("still broken, help") — evidence-free frontier calls burn retries
- ❌ Unmeasured workflows — if you can't cost it, you can't route it
