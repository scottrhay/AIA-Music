# 6-Week Student Rollout Plan — AI for SMBs

Audience: students / junior devs joining small-business software teams.
Cadence: ~4 hrs/week (1 hr guided, 3 hrs lab). Cohort size: 5–20.

Each week has a **deliverable** and a **token discipline** — a habit that keeps costs down.

---

## Week 1 — Foundations: your free model

**Goal:** every student has Hermes running locally and knows what it's good at.

- Install Ollama + `hermes3:8b` (or hosted fallback) — [`../hermes/setup-guide.md`](../hermes/setup-guide.md)
- Exercises: summarize a README, draft a commit message, explain an error message —
  all on local Hermes. Zero paid tokens this week.
- Discuss: what local models do well (drafting, summarizing, boilerplate, Q&A on
  pasted context) vs. poorly (deep multi-file reasoning, obscure APIs, agentic tool use).

**Deliverable:** a one-page "what I asked / what I got" log of 10 local-model tasks.
**Token discipline:** *default local.* The paid model is opt-in, never the reflex.

## Week 2 — Your first agent toolchain

**Goal:** working Copilot (student pack) and/or Claude Code setup; first custom agent installed.

- Set up VS Code + Copilot Chat; connect local Hermes as a Copilot Chat model
  (Manage Models → Ollama) so even in-editor chat can run free.
- Install [`agents/01-code-reviewer`](../agents/01-code-reviewer/) and
  [`agents/06-git-conventional-commits`](../agents/06-git-conventional-commits/).
- Lab: fix two issues in a sample repo, using the reviewer before every commit.

**Deliverable:** a PR with agent-reviewed, conventionally-committed changes.
**Token discipline:** *scoped questions.* Never paste a whole file when 20 lines will do.

## Week 3 — Reading code with agents

**Goal:** use agents to onboard into an unfamiliar codebase.

- Install [`agents/07-codebase-onboarding`](../agents/07-codebase-onboarding/) and
  [`agents/02-documentation-writer`](../agents/02-documentation-writer/).
- Lab: each student gets an unfamiliar OSS or SMB codebase; produce an
  architecture map and a new-contributor README section.

**Deliverable:** onboarding doc for a codebase they'd never seen.
**Token discipline:** *summarize, then discard.* Turn long exploration into a short
map doc; feed the map (not the raw code) into later conversations.

## Week 4 — Quality: tests, debugging, security

**Goal:** the quality loop — test, debug, audit — run mostly on cheap tiers.

- Install [`agents/03-debugger`](../agents/03-debugger/),
  [`agents/04-test-engineer`](../agents/04-test-engineer/),
  [`agents/08-security-auditor`](../agents/08-security-auditor/).
- Lab: given a buggy app, write failing tests, root-cause with the debugger agent,
  fix, then run the security audit.

**Deliverable:** bug fixed with regression test + audit findings triaged.
**Token discipline:** *escalate with evidence.* When you do go to the frontier model,
bring the failing test and the stack trace — one great prompt beats five vague ones.

## Week 5 — Planning and business workflows

**Goal:** agents beyond code — planning, incident writeups, SMB business ops.

- Install [`agents/05-planner-prd`](../agents/05-planner-prd/),
  [`agents/09-incident-postmortem`](../agents/09-incident-postmortem/),
  [`agents/11-smb-business-assistant`](../agents/11-smb-business-assistant/).
- Lab: write a mini-PRD for a real SMB feature request; run a mock incident and
  produce the postmortem; draft a customer email thread.

**Deliverable:** PRD + postmortem + three business drafts, all from agents.
**Token discipline:** *templates are free.* A good prompt/skill template does the
structuring so the model does less work — shorter outputs, fewer retries.

## Week 6 — Capstone: build your own agent

**Goal:** each student designs, builds, and *costs out* one custom agent for a real
SMB workflow (theirs, a client's, or a case study).

- Study [`agents/10-token-saver-terse-mode`](../agents/10-token-saver-terse-mode/) as the
  minimal exemplar, then build: pick a workflow → write the chatmode/subagent →
  test on 5 real tasks → measure token usage per task at each tier.
- Present: demo + a cost table ("this workflow costs $0.00 local / $0.02 Haiku / $0.40 Opus per run").

**Deliverable:** working agent in both toolchain formats + measured cost table.
**Token discipline:** *measure everything.* If you can't say what a workflow costs,
you can't decide what tier it belongs on.

---

## Instructor notes

- **Budget guardrail:** issue each student a fixed weekly paid-token allowance
  (e.g. 50 Copilot premium requests or a $5 API cap). Running out is a lesson, not a failure.
- **Pairing:** pair students with weak hardware with local-capable peers in Week 1;
  hosted fallback keeps everyone on the same exercises.
- **Assessment:** grade the *routing decision* as much as the output — a correct
  answer obtained wastefully scores lower than a correct answer obtained frugally.
