# 08 — Security Auditor

Audits code and config against the OWASP Top 10 plus SMB-specific risks
(secrets in repo, permissive CORS, unpatched deps, missing backups/authz),
reporting only exploitable findings with attack scenarios.

- **Adapted from:** awesome-copilot's *Gem Reviewer* (OWASP scanning),
  *github-actions-hardening*, and *gdpr-compliant* skills
- **SMB use case:** SMBs are breach targets precisely because nobody audits;
  one leaked `.env` is an existential event for a 5-person company.
- **Token tier:** **2 — deliberately.** Security review of money/auth/data paths
  is the canonical "escalate up" workflow; false confidence from a weak model
  is worse than the spend. Mechanical pre-checks (secret grep, dep audit) run
  Tier 0/1 first so the frontier pass starts armed.

## Install

- Copilot: `copilot/security-auditor.chatmode.md` → `.github/chatmodes/`
- Claude Code: `claude/agents/security-auditor.md` → `.claude/agents/`

## Example session

> **You:** Audit the API before we onboard the first paying customer.
>
> **Agent:** Pre-checks: `npm audit` (2 high, both fixable), secret scan (clean),
> then the read:
> **[CRITICAL] IDOR — `routes/invoices.js:31`** `GET /invoices/:id` checks login
> but not ownership. Attack: any authed user iterates ids, reads every
> customer's invoices. Fix: scope query by `req.user.orgId`.
> **[HIGH] JWT never expires — `auth.js:12`** no `expiresIn`; stolen token is
> forever. **[MED] CORS `*` with credentials** …
> Each finding: evidence path, attack scenario, minimal fix, and a "verified
> exploitable / needs manual confirmation" tag.

Cheap habit: schedule it — audit on every release tag, not "when we get around
to it." The prompt is identical; the diff since last audit keeps it small.
