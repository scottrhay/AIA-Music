from flask import Blueprint, request, jsonify
from app import db
from app.models import Song

bp = Blueprint('webhooks', __name__)


@bp.route('/suno-callback', methods=['POST'])
def suno_callback():
    """
    Webhook endpoint for Suno API callbacks from n8n.
    This replaces the Excel update in your n8n workflow.

    Expected payload from n8n:
    {
        "task_id": "xxx",
        "status": "completed",
        "msg": "All generated successfully.",
        "data": [
            {"audio_url": "url1", "title": "title1"},
            {"audio_url": "url2", "title": "title2"}
        ]
    }
    """
    data = request.get_json()

    if not data or not data.get('task_id'):
        return jsonify({'error': 'task_id is required'}), 400

    # Find song by Suno task ID
    song = Song.query.filter_by(suno_task_id=data['task_id']).first()

    if not song:
        return jsonify({'error': 'Song not found for task_id'}), 404

    # Update song based on callback data
    if data.get('msg') == 'All generated successfully.' and data.get('data'):
        song.status = 'completed'

        # Extract audio URLs
        if len(data['data']) > 0:
            song.download_url_1 = data['data'][0].get('audio_url')
        if len(data['data']) > 1:
            song.download_url_2 = data['data'][1].get('audio_url')

        try:
            db.session.commit()
            return jsonify({
                'message': 'Song updated successfully',
                'song': song.to_dict(include_user=True, include_style=True)
            }), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else:
        return jsonify({'error': 'Invalid callback data'}), 400


@bp.route('/suno-submitted', methods=['POST'])
def suno_submitted():
    """
    Webhook endpoint for when a song is submitted to Suno.
    Called by n8n after successful Suno API request.

    Expected payload:
    {
        "song_id": 123,
        "task_id": "suno-task-id-xyz"
    }
    """
    data = request.get_json()

    if not data or not data.get('song_id') or not data.get('task_id'):
        return jsonify({'error': 'song_id and task_id are required'}), 400

    song = Song.query.get(data['song_id'])

    if not song:
        return jsonify({'error': 'Song not found'}), 404

    # Update song status and task ID
    song.status = 'submitted'
    song.suno_task_id = data['task_id']

    try:
        db.session.commit()
        return jsonify({
            'message': 'Song status updated to submitted',
            'song': song.to_dict(include_user=True, include_style=True)
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
