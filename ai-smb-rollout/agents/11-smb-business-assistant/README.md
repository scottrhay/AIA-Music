# 11 — SMB Business Assistant (bonus)

The non-coding buildout: drafts customer emails in the owner's voice, preps the
day's meetings, and pressure-tests positioning/pricing decisions.

- **Adapted from:** awesome-copilot's *email-drafter*, *daily-prep*, and *gtm-\**
  skills (positioning-strategy, technical-product-pricing, 0-to-1-launch)
- **SMB use case:** in a small business the developer *is* half the business side.
  Students entering SMBs get hired for code and kept for this.
- **Token tier:** 0 — prose drafting and summarization is peak local-Hermes.
  Everything here runs free; nothing customer-confidential leaves the laptop,
  which for an SMB is a feature, not just a saving.

## Install

- Copilot: `copilot/biz-assistant.chatmode.md` → `.github/chatmodes/`
- Claude Code: `claude/agents/biz-assistant.md` → `.claude/agents/`
- Pure Tier-0: works great as a direct `ollama run hermes-smb` conversation —
  paste the persona from either file as your first message.

## Example session

> **You:** Draft a reply — customer says our invoicing app "lost" their March data.
> They're angry, they're wrong (they filtered by year), and they're our biggest account.
>
> **Agent:** Draft (matched to your saved voice sample: plain, warm, no corporate
> passive voice):
> acknowledges the scare without conceding data loss · one-line fix ("your March
> invoices are under the 2026 filter — here's the direct link") · offers a
> 10-minute call · adds an internal note: **third support ticket caused by the
> year-filter default — logging a product issue is cheaper than three apologies.**
>
> Flagged: the phrase "as we explained previously" removed from your bullet
> points — reads as blame.

Cheap habit: keep a `voice-samples.md` of three of your own real emails; feed it
once per session. Voice-matching is what separates "AI wrote this" from "we wrote this."
