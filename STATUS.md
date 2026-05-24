# AIA Music Status

Last checked: 2026-05-24

## Current State

AIA Music is live at `https://music.aiacopilot.com`.

Verified:
- Web app returns HTTP 200.
- `/health` returns `{"service":"AIAMusic API","status":"healthy"}`.
- Roku playlist endpoint returns live playlist data.
- Backend song listing includes eager loading for style and creator relationships to reduce N+1 query behavior.
- Docker backend/smoke test gate passes: `10 passed`.
- Frontend production build completes with existing ESLint warnings.

## Canonical Source

Canonical local path:

```text
/mnt/aiacopilot/Products/AIA-Music
```

Legacy/trash copies are not canonical and should not receive new work.

## Known Gaps

- The Roku screensaver resume fix is not implemented in source yet.
- Frontend build has existing ESLint warnings for hook dependencies and unused variables.
- Deployment docs were normalized to the `/srv/apps/aiamusic` path but still need host verification before production use.

## Quality Gate For Green

Before marking AIA Music green:

1. Source is committed and pushed to the correct remote.
2. Backend tests run with no failures.
3. Frontend build completes successfully without warnings or documented accepted warnings.
4. Live health and Roku playlist checks pass.
5. Roku source no longer contains a live secret.
6. Production deployment and rollback instructions are verified against the actual host path.
