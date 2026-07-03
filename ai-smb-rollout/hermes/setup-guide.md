# Hermes Setup Guide

[Nous Research Hermes](https://nousresearch.com/) is an open-weight model family
(Hermes 3 on Llama 3.1 bases; Hermes 4 adds a hybrid reasoning mode). It's the
Tier-0 workhorse of this program: runs on student hardware, costs $0 per token,
and is genuinely good at drafting, summarizing, Q&A, and boilerplate.

## 1. Local install (preferred): Ollama

```bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh
# Windows: download the installer from https://ollama.com/download

ollama pull hermes3:8b        # ~4.7 GB download, runs in ~8 GB RAM
ollama run hermes3:8b "Explain a git rebase in 3 bullets"
```

Hardware picker:

| Machine | Model | Notes |
|---|---|---|
| 8 GB RAM laptop | `hermes3:8b` (Q4) | the program default |
| 16 GB+ / Apple Silicon | `hermes3:8b` (Q8) or a 14B-class Hermes 4 quant | better quality, still fast |
| 24 GB+ GPU / 64 GB Mac | `hermes3:70b` quant | near-hosted quality |
| Below 8 GB | skip local → use hosted fallback (§3) | curriculum unchanged |

Optional but recommended: build the program's tuned variant from the
[`Modelfile`](Modelfile) in this folder:

```bash
cd hermes && ollama create hermes-smb -f Modelfile
ollama run hermes-smb
```

It bakes in a terse, SMB-assistant system prompt and — importantly — teaches the
model to emit `ESCALATE: <reason>` when a task deserves a paid-tier model. That
line is the student's routing signal.

## 2. Wire Hermes into your tools

### VS Code + GitHub Copilot Chat (free in-editor chat)

Copilot Chat supports local Ollama models ("bring your own model"):

1. Open Copilot Chat → model picker → **Manage Models…**
2. Choose **Ollama** as the provider (Ollama must be running; default `http://localhost:11434`)
3. Select `hermes3:8b` / `hermes-smb` — it now appears in the model dropdown

Use Hermes for chat/explanations/drafts in the editor; switch the dropdown to a
hosted model only when escalating. (Note: BYO models cover chat — completions and
the Copilot coding agent still use GitHub-hosted models.)

### CLI agent on Hermes: aider

For an agentic loop that edits files using only local tokens:

```bash
pip install aider-chat
aider --model ollama_chat/hermes-smb        # in your repo
```

Good for mechanical multi-file edits (renames, applying a known pattern);
escalate genuinely hard changes.

### Claude Code users

Claude Code runs on Anthropic models — Hermes doesn't plug into it directly.
The pairing instead: keep an `ollama run hermes-smb` terminal (or aider) beside
Claude Code. Drafting, summarizing logs, and writing prose go to Hermes; agentic
codebase work goes to Claude Code with the cost controls in
[`../token-savings/playbook.md`](../token-savings/playbook.md).

### Anything OpenAI-compatible

Ollama exposes an OpenAI-compatible API — most tools that accept a custom
OpenAI base URL can use Hermes:

```bash
export OPENAI_BASE_URL=http://localhost:11434/v1
export OPENAI_API_KEY=ollama   # any non-empty string
```

## 3. Hosted fallback (no capable hardware)

Same models, still cheap, one env var away:

- **Nous Portal API** — https://portal.nousresearch.com — first-party hosted
  Hermes 4, OpenAI-compatible endpoint.
- **OpenRouter** — https://openrouter.ai — `nousresearch/hermes-3-llama-3.1-405b`
  and Hermes 4 routes; some Hermes routes have free tiers.

Point `OPENAI_BASE_URL`/key at the provider and everything in this guide works
the same. Hosted Hermes is still typically 10–100× cheaper than frontier models —
it remains your Tier 0.

## 4. Verify your setup

```bash
ollama run hermes-smb "Reply with exactly: HERMES READY"
curl -s http://localhost:11434/v1/models | grep -o 'hermes[^"]*'
```

Both work → you're done. Move on to [`../agents/README.md`](../agents/README.md).
