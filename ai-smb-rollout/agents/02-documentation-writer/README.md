# 02 — Documentation Writer

Writes READMEs, how-to guides, API references, and explanations using the
[Diátaxis](https://diataxis.fr/) framework — the right *kind* of doc for the audience.

- **Adapted from:** awesome-copilot's *documentation-writer* skill and *Gem
  Documentation Writer* / *create-readme*
- **SMB use case:** docs are the first thing small teams skip and the first thing
  new hires and customers need. This makes them nearly free.
- **Token tier:** 0–1. Prose generation is exactly what local Hermes is good at —
  draft on Tier 0, fact-check code references on Tier 1.

## Install

- Copilot: `copilot/doc-writer.chatmode.md` → `.github/chatmodes/`
- Claude Code: `claude/agents/doc-writer.md` → `.claude/agents/`

## Example session

> **You:** Write a quickstart for our invoice API.
>
> **Agent:** Classifying as a **tutorial** (new user, learning by doing) →
> produces: prerequisites, 4 numbered steps each ending in a verifiable result
> (`curl` + expected JSON), a "what you built" recap, and links out to the
> reference for every endpoint touched — and flags that `POST /invoices` lacks
> a documented error table, offering to generate it next.

Cheap habit: after any feature merge, ask it "which existing docs does this
change invalidate?" — updating a paragraph is cheaper than re-writing a page later.
