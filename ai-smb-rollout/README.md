# AI for SMBs — Student Rollout Kit

A complete, self-contained program for getting students (and small-business teams)
productive with AI coding agents on a shoestring token budget.

**The stack:**

| Layer | What | Cost |
|---|---|---|
| Tier 0 — local | **Nous Hermes** (Hermes 3 / Hermes 4) running on the student's own machine via Ollama | $0 / token |
| Tier 1 — cheap hosted | Copilot included models / Claude Haiku for routine agent work | pennies |
| Tier 2 — frontier | Copilot premium requests / Claude Opus for hard problems only | budgeted |

**The rule students learn on day one:** *route down, escalate up.* Draft, summarize,
and iterate on the free local model; spend paid tokens only where they buy real leverage.

## What's in this kit

```
ai-smb-rollout/
├── README.md                 ← you are here
├── curriculum/
│   └── rollout-plan.md       ← 6-week student program, week by week
├── hermes/
│   ├── setup-guide.md        ← install Hermes locally + hosted, wire into Copilot & CLI agents
│   └── Modelfile             ← ready-to-use Ollama model config
├── token-savings/
│   └── playbook.md           ← the routing, caching, and context-hygiene playbook
└── agents/                   ← 11 curated agent/skill buildouts, each in BOTH toolchains
    ├── README.md             ← catalog + how to install
    ├── 01-code-reviewer/
    ├── 02-documentation-writer/
    ├── 03-debugger/
    ├── 04-test-engineer/
    ├── 05-planner-prd/
    ├── 06-git-conventional-commits/
    ├── 07-codebase-onboarding/
    ├── 08-security-auditor/
    ├── 09-incident-postmortem/
    ├── 10-token-saver-terse-mode/
    └── 11-smb-business-assistant/
```

Every buildout under `agents/` contains:

- `README.md` — what it does, the SMB use case, its token-cost tier, and a worked example
- `copilot/` — a ready-to-drop-in GitHub Copilot customization (`.chatmode.md`, `.prompt.md`, or `.instructions.md`)
- `claude/` — the equivalent Claude Code customization (subagent under `.claude/agents/` or skill under `.claude/skills/`)

The buildouts are curated and adapted from the community catalog at
[github/awesome-copilot](https://github.com/github/awesome-copilot) (MIT-licensed),
rewritten to be toolchain-portable and token-frugal.

## Quickstart (student, 30 minutes)

1. **Install the free model** — follow [`hermes/setup-guide.md`](hermes/setup-guide.md).
   Verify: `ollama run hermes3:8b "say hi in 5 words"`.
2. **Pick your toolchain** — VS Code + GitHub Copilot (free student plan via the
   [GitHub Student Developer Pack](https://education.github.com/pack)) and/or Claude Code.
3. **Install your first agent** — copy `agents/01-code-reviewer/copilot/` into your
   repo's `.github/chatmodes/`, or `agents/01-code-reviewer/claude/agents/` into `.claude/agents/`.
4. **Read the token playbook** — [`token-savings/playbook.md`](token-savings/playbook.md).
   Set your weekly budget before you spend a single premium request.
5. **Follow the curriculum** — [`curriculum/rollout-plan.md`](curriculum/rollout-plan.md).

## For instructors / SMB rollout leads

- The curriculum assumes cohorts of 5–20 students, 6 weeks, ~4 hrs/week.
- Hardware floor for local Hermes: 8 GB RAM (hermes3:8b, quantized). Students below
  the floor use the hosted fallback in the setup guide — the curriculum is unchanged.
- Week 6 is a capstone: each student ships one custom agent for a real SMB workflow
  and presents its measured token cost.
