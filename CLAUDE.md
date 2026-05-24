# AIA Music Agent Notes

## Canonical Product

AIA Music is the music creation and playlist product at:

```text
https://music.aiacopilot.com
```

Canonical local source:

```text
/mnt/aiacopilot/Products/AIA-Music
```

## Operating Rules

- Do not commit `.env`, audio data, logs, frontend builds, packaged Roku zips, or live Roku secrets.
- Treat `frontend/build.tar.gz` and `roku/AIAMusicRoku.zip` as generated artifacts.
- Use `STATUS.md` for current readiness and known gaps.
- Production changes require AIA OS gates: requirement, acceptance criteria, test/verification, rollback path, and evidence.

## Verification

Minimum local checks before commit:

```bash
python -m pytest tests
cd frontend && npm run build
curl -fsS https://music.aiacopilot.com/health
```
