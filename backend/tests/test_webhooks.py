# Suno Webhook Tests for AIAMusic
# ================================
# Verifies the fail-fast fix from this session: an unrecognized/error Suno
# status (e.g. SENSITIVE_WORD_ERROR) must mark the song 'failed' immediately
# rather than silently falling through as "still pending" — that gap is what
# left songs stuck in 'submitted' for hours with no server-side follow-up.


def _make_submitted_song(app, task_id="task-abc"):
    from app import db
    from app.models import User, Song

    with app.app_context():
        user = User(username="alice", email="alice@example.com", password_hash="x")
        db.session.add(user)
        db.session.commit()

        song = Song(
            user_id=user.id,
            specific_title="Proverbs 2",
            status="submitted",
            suno_task_id=task_id,
        )
        db.session.add(song)
        db.session.commit()
        return song.id


def test_suno_callback_success_creates_sibling_tracks(app, client):
    song_id = _make_submitted_song(app, task_id="task-success")

    resp = client.post("/api/v1/webhooks/suno-callback", json={
        "task_id": "task-success",
        "status": "completed",
        "msg": "All generated successfully.",
        "data": [
            {"audio_url": "https://example.com/track1.mp3"},
            {"audio_url": "https://example.com/track2.mp3"},
        ],
    })
    assert resp.status_code == 200

    from app import db
    from app.models import Song

    with app.app_context():
        original = db.session.get(Song, song_id)
        assert original.status == "completed"
        assert original.download_url == "https://example.com/track1.mp3"

        sibling = Song.query.filter_by(sibling_group_id="task-success", track_number=2).first()
        assert sibling is not None
        assert sibling.download_url == "https://example.com/track2.mp3"
        assert sibling.status == "completed"


def test_suno_callback_error_status_marks_song_failed_immediately(app, client):
    """The actual bug from this session: SENSITIVE_WORD_ERROR (and any other
    non-success/non-pending status) must fail the song right away instead of
    being silently treated as 'still pending'."""
    song_id = _make_submitted_song(app, task_id="task-sensitive")

    resp = client.post("/api/v1/webhooks/suno-callback", json={
        "task_id": "task-sensitive",
        "status": "SENSITIVE_WORD_ERROR",
        "msg": "Your lyrics contain copyrighted material.",
    })
    assert resp.status_code == 200

    from app import db
    from app.models import Song

    with app.app_context():
        song = db.session.get(Song, song_id)
        assert song.status == "failed"


def test_suno_callback_unknown_task_id_returns_404(client):
    resp = client.post("/api/v1/webhooks/suno-callback", json={
        "task_id": "does-not-exist",
        "status": "completed",
        "data": [{"audio_url": "https://example.com/t.mp3"}],
    })
    assert resp.status_code == 404


def test_suno_callback_requires_task_id(client):
    resp = client.post("/api/v1/webhooks/suno-callback", json={"status": "completed"})
    assert resp.status_code == 400


def test_suno_callback_idempotent_on_repeat_delivery(app, client):
    """Suno fires the callback multiple times (partial then complete) — a
    repeat delivery for an already-fully-processed task should be a no-op,
    not re-create/duplicate sibling rows."""
    _make_submitted_song(app, task_id="task-repeat")

    payload = {
        "task_id": "task-repeat",
        "status": "completed",
        "data": [
            {"audio_url": "https://example.com/track1.mp3"},
            {"audio_url": "https://example.com/track2.mp3"},
        ],
    }
    first = client.post("/api/v1/webhooks/suno-callback", json=payload)
    assert first.status_code == 200

    second = client.post("/api/v1/webhooks/suno-callback", json=payload)
    assert second.status_code == 200
    assert second.get_json().get("message") == "Already processed"

    from app import db
    from app.models import Song

    with app.app_context():
        siblings = Song.query.filter_by(sibling_group_id="task-repeat").all()
        assert len(siblings) == 2
