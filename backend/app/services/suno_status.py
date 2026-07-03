"""Shared Suno generation-status classification.

Used by both the webhook (backend/app/routes/webhooks.py) and the
polling/reconcile path (backend/app/routes/songs.py) so a status Suno
returns is interpreted the same way regardless of which path saw it
first. Previously each path only recognized a handful of literal
success/failure strings and treated everything else (including Suno's
real error codes like SENSITIVE_WORD_ERROR) as "still pending" — which
left songs stuck in 'submitted' until the reconcile job's hard timeout
instead of failing fast with the real error.
"""

SUCCESS_STATUSES = {'success', 'completed', 'done', 'text_success', 'first_success'}
PENDING_STATUSES = {'pending', 'processing', 'queued', 'submitted', 'create_task', 'in_progress'}


def classify_suno_status(status, msg=''):
    """Classify a Suno status string as 'success', 'pending', or 'failed'.

    Anything not explicitly known-success or known-pending is treated as
    a terminal failure — this covers Suno's documented error codes
    (SENSITIVE_WORD_ERROR, CREATE_TASK_FAILED, GENERATE_AUDIO_FAILED,
    CALLBACK_EXCEPTION) as well as any future/undocumented error status,
    rather than silently waiting forever on an unrecognized string.
    """
    s = (status or '').strip().lower()
    m = (msg or '').strip().lower()

    if s in SUCCESS_STATUSES or 'successfully' in m or 'complete' in m:
        return 'success'

    if s in PENDING_STATUSES:
        return 'pending'

    if not s:
        # No status at all and no success/pending signal — treat as still
        # pending rather than failing on an empty/malformed payload.
        return 'pending'

    return 'failed'
