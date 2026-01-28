from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models import Song
import json

bp = Blueprint('webhooks', __name__)


@bp.route('/azure-speech-callback', methods=['POST'])
def azure_speech_callback():
    """
    Webhook endpoint for Azure Speech API callbacks.

    Handles multiple possible payload formats from Azure Speech API:

    Format 1 (expected):
    {
        "task_id": "xxx",
        "status": "completed",
        "msg": "All generated successfully.",
        "data": [
            {"audio_url": "url1", "title": "title1", "image_url": "..."},
            {"audio_url": "url2", "title": "title2", "image_url": "..."}
        ]
    }

    Format 2 (alternative):
    {
        "taskId": "xxx",
        "status": "success",
        "data": {
            "songs": [...]
        }
    }
    """
    data = request.get_json()

    # Log the raw callback for debugging
    current_app.logger.info(f"Azure Speech callback received: {json.dumps(data, indent=2)}")

    if not data:
        current_app.logger.error("Azure Speech callback: No data received")
        return jsonify({'error': 'No data received'}), 400

    # Extract task_id (try multiple possible field names and locations)
    task_id = data.get('task_id') or data.get('taskId') or data.get('id')

    # Also check if it's nested in a data object
    if not task_id and 'data' in data and isinstance(data['data'], dict):
        task_id = data['data'].get('task_id') or data['data'].get('taskId')

    if not task_id:
        current_app.logger.error(f"Azure Speech callback: No task_id found in payload: {data}")
        return jsonify({'error': 'task_id is required'}), 400

    # Find song by speech task ID
    song = Song.query.filter_by(speech_task_id=task_id).first()

    if not song:
        current_app.logger.error(f"Azure Speech callback: No song found for task_id: {task_id}")
        return jsonify({'error': f'Song not found for task_id: {task_id}'}), 404

    current_app.logger.info(f"Azure Speech callback: Found song {song.id} for task_id {task_id}")

    # Check status (handle multiple possible status indicators)
    status = data.get('status', '').lower()
    msg = data.get('msg', '') or data.get('message', '')

    is_success = (
        status in ['completed', 'success', 'done'] or
        'successfully' in msg.lower() or
        'complete' in msg.lower()
    )

    # Handle failure status
    if status in ['failed', 'error', 'failure']:
        song.status = 'failed'
        current_app.logger.error(f"Azure Speech callback: Song {song.id} generation failed: {msg}")
        try:
            db.session.commit()
            return jsonify({
                'message': 'Song marked as failed',
                'error': msg
            }), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    # Extract audio data (handle multiple possible structures)
    audio_data = data.get('data', [])

    # If data is a dict with nested songs/clips/data array
    if isinstance(audio_data, dict):
        audio_data = (
            audio_data.get('data') or  # API format: data.data.data[]
            audio_data.get('songs') or
            audio_data.get('clips') or
            audio_data.get('results') or
            []
        )

    # Ensure it's a list
    if not isinstance(audio_data, list):
        audio_data = [audio_data] if audio_data else []

    current_app.logger.info(f"Azure Speech callback: Found {len(audio_data)} audio items")

    if is_success and audio_data:
        # Extract audio URLs (try multiple possible field names)
        if len(audio_data) > 0:
            item = audio_data[0]
            song.download_url_1 = (
                item.get('audio_url') or
                item.get('audioUrl') or
                item.get('url') or
                item.get('audio')
            )
            current_app.logger.info(f"Azure Speech callback: download_url_1 = {song.download_url_1}")

        if len(audio_data) > 1:
            item = audio_data[1]
            song.download_url_2 = (
                item.get('audio_url') or
                item.get('audioUrl') or
                item.get('url') or
                item.get('audio')
            )
            current_app.logger.info(f"Azure Speech callback: download_url_2 = {song.download_url_2}")

        # Only mark as completed when BOTH files are ready
        if song.download_url_1 and song.download_url_2:
            song.status = 'completed'
            current_app.logger.info(f"Suno callback: Song {song.id} marked as completed (both URLs ready)")
        else:
            current_app.logger.info(f"Suno callback: Song {song.id} still waiting for both URLs (url1: {bool(song.download_url_1)}, url2: {bool(song.download_url_2)})")

        try:
            db.session.commit()
            current_app.logger.info(f"Azure Speech callback: Song {song.id} updated successfully")
            return jsonify({
                'message': 'Song updated successfully',
                'song': song.to_dict(include_user=True, include_style=True)
            }), 200
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Azure Speech callback: Database error: {str(e)}")
            return jsonify({'error': str(e)}), 500
    else:
        # Log but still return 200 to acknowledge receipt
        current_app.logger.warning(f"Azure Speech callback: Unexpected payload for song {song.id}: is_success={is_success}, audio_data_len={len(audio_data)}")
        return jsonify({
            'message': 'Callback received but no audio data found',
            'status_received': status,
            'msg_received': msg
        }), 200


@bp.route('/suno-callback', methods=['POST'])
def suno_callback():
    """
    Webhook endpoint for Suno API callbacks.
    Creates separate song records for each audio track returned.

    Expected payload format:
    {
        "task_id": "xxx",
        "status": "completed",
        "msg": "All generated successfully.",
        "data": [
            {"audio_url": "url1", "title": "title1", "image_url": "..."},
            {"audio_url": "url2", "title": "title2", "image_url": "..."}
        ]
    }
    """
    data = request.get_json()

    current_app.logger.info(f"Suno callback received: {json.dumps(data, indent=2)}")

    if not data:
        current_app.logger.error("Suno callback: No data received")
        return jsonify({'error': 'No data received'}), 400

    # Extract task_id (try multiple possible field names)
    task_id = data.get('task_id') or data.get('taskId') or data.get('id')
    
    if not task_id and 'data' in data and isinstance(data['data'], dict):
        task_id = data['data'].get('task_id') or data['data'].get('taskId')

    if not task_id:
        current_app.logger.error(f"Suno callback: No task_id found in payload: {data}")
        return jsonify({'error': 'task_id is required'}), 400

    # Find the original song by suno_task_id
    original_song = Song.query.filter_by(suno_task_id=task_id).first()

    if not original_song:
        current_app.logger.error(f"Suno callback: No song found for task_id: {task_id}")
        return jsonify({'error': f'Song not found for task_id: {task_id}'}), 404

    current_app.logger.info(f"Suno callback: Found song {original_song.id} for task_id {task_id}")

    # Check status
    status = data.get('status', '').lower()
    msg = data.get('msg', '') or data.get('message', '')

    is_success = (
        status in ['completed', 'success', 'done'] or
        'successfully' in msg.lower() or
        'complete' in msg.lower()
    )

    # Handle failure
    if status in ['failed', 'error', 'failure']:
        original_song.status = 'failed'
        current_app.logger.error(f"Suno callback: Song {original_song.id} generation failed: {msg}")
        try:
            db.session.commit()
            return jsonify({'message': 'Song marked as failed', 'error': msg}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    # Extract audio data
    audio_data = data.get('data', [])
    
    if isinstance(audio_data, dict):
        audio_data = (
            audio_data.get('data') or
            audio_data.get('songs') or
            audio_data.get('clips') or
            audio_data.get('results') or
            []
        )

    if not isinstance(audio_data, list):
        audio_data = [audio_data] if audio_data else []

    current_app.logger.info(f"Suno callback: Found {len(audio_data)} audio items")

    if not is_success or not audio_data:
        current_app.logger.warning(f"Suno callback: No audio data for song {original_song.id}")
        return jsonify({'message': 'Callback received but no audio data found'}), 200

    try:
        created_songs = []
        
        # Process each audio track as a separate song
        for idx, item in enumerate(audio_data):
            audio_url = (
                item.get('audio_url') or
                item.get('audioUrl') or
                item.get('url') or
                item.get('audio')
            )
            
            if not audio_url:
                continue
            
            track_number = idx + 1
            
            if idx == 0:
                # Update the original song with the first track
                original_song.download_url = audio_url
                original_song.sibling_group_id = task_id
                original_song.track_number = track_number
                original_song.status = 'completed'
                created_songs.append(original_song)
                current_app.logger.info(f"Suno callback: Updated original song {original_song.id} with track {track_number}")
            else:
                # Create a new song for additional tracks
                new_song = Song(
                    user_id=original_song.user_id,
                    source_type=original_song.source_type,
                    status='completed',
                    specific_title=f"{original_song.specific_title or 'Untitled'} (v{track_number})",
                    version=original_song.version,
                    specific_lyrics=original_song.specific_lyrics,
                    prompt_to_generate=original_song.prompt_to_generate,
                    style_id=original_song.style_id,
                    vocal_gender=original_song.vocal_gender,
                    voice_name=original_song.voice_name,
                    download_url=audio_url,
                    sibling_group_id=task_id,
                    track_number=track_number,
                    suno_task_id=task_id  # Same task ID for reference
                )
                db.session.add(new_song)
                created_songs.append(new_song)
                current_app.logger.info(f"Suno callback: Created new song for track {track_number}")

        db.session.commit()
        
        current_app.logger.info(f"Suno callback: Created/updated {len(created_songs)} songs for task {task_id}")
        
        return jsonify({
            'message': f'Created {len(created_songs)} songs successfully',
            'songs': [s.to_dict(include_user=True, include_style=True) for s in created_songs]
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Suno callback: Database error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@bp.route('/test', methods=['GET', 'POST'])
def test_webhook():
    """
    Test endpoint to verify webhook is accessible.
    GET: Returns simple status
    POST: Logs the payload and returns it
    """
    if request.method == 'GET':
        return jsonify({'status': 'ok', 'message': 'Webhook endpoint is accessible'}), 200

    data = request.get_json()
    current_app.logger.info(f"Test webhook received: {json.dumps(data, indent=2) if data else 'No data'}")
    return jsonify({
        'status': 'ok',
        'received': data
    }), 200
