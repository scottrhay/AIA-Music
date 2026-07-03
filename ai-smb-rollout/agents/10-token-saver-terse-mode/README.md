# 10 — Token-Saver Terse Mode

A response-style mode that strips every non-load-bearing token: answer first,
no preamble, no restating, no courtesy padding. The kit's minimal exemplar —
and the Week 6 capstone's reference implementation.

- **Adapted from:** awesome-copilot's *Caveman Mode* ("terse, low-token responses")
- **SMB use case:** none of your workflows need the model to say "Great question!
  Let's dive in." Output tokens are the ones you pay a premium for; verbosity is
  a default, not a requirement.
- **Token tier:** any — that's the point. Stack it on every tier; savings compound
  at Tier 2.

## Install

- Copilot: `copilot/terse.chatmode.md` → `.github/chatmodes/` — or make it
  always-on by appending the rules to `.github/copilot-instructions.md`
- Claude Code: append `claude/CLAUDE-terse-snippet.md` to your `CLAUDE.md`

## Example

> **You:** How do I undo my last commit but keep the changes?
>
> **Default mode (~90 output tokens):** "Great question! There are a few ways to
> undo a commit in Git depending on what you want to achieve. If you want to keep
> your changes staged, you can use… [three options, closing summary]"
>
> **Terse mode (~14 output tokens):**
> ```
> git reset --soft HEAD~1
> ```
> Keeps changes staged. Unstaged instead: `--mixed`.

Same information. ~6× cheaper. Multiply by every response of every session.

## Why it's the capstone exemplar

It's the smallest possible complete buildout — a persona, an output contract,
and a measurable cost effect — in both toolchain formats. Students copy its
*shape*, swap the behavior, and measure theirs the same way.
