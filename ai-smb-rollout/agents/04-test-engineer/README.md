# 04 — Test Engineer

Designs and writes tests that catch real regressions: behavior-focused unit
tests, edge cases first, matching the project's existing test framework and style.

- **Adapted from:** awesome-copilot's *AI Team QA* agent and the
  *javascript-typescript-jest* / *java-junit* / *csharp-xunit* skills
- **SMB use case:** small teams ship without QA staff; a test-writing agent is
  the difference between "works on my machine" and a safety net.
- **Token tier:** 1 — test scaffolding is mechanical. Escalate only for designing
  a test *strategy* on legacy untested code.

## Install

- Copilot: `copilot/test-engineer.chatmode.md` → `.github/chatmodes/`
- Claude Code: `claude/agents/test-engineer.md` → `.claude/agents/`

## Example session

> **You:** Write tests for `discount.ts` — it applies coupon codes to cart totals.
>
> **Agent:** Detected vitest + existing `*.test.ts` conventions. Test plan before
> code: happy path (valid % and fixed coupons), boundaries (100% off, coupon >
> total → clamps at $0, empty cart), invalids (expired, unknown code, reused
> single-use), and one property: total never negative. 9 tests, each named for
> the behavior (`"clamps discount at cart total"`), no snapshot tests, mocks only
> the clock. Runs them: 8 pass, 1 **fails — expired-coupon check uses `<` not
> `<=`, coupons die a day early. Real bug, flagging instead of "fixing" the test.**

Cheap habit: ask for the *test plan* first (cheap), approve it, then generate
code — kills the retry loop of regenerating whole suites.
