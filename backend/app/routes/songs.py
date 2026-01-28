from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app import db
from app.models import Song, Style, Playlist, playlist_songs
from app.services.audio_storage import get_storage_service
import requests
import os

bp = Blueprint('songs', __name__)


def _archive_song_to_storage(song):
    """Archive song audio file to local storage."""
    storage = get_storage_service()

    if not storage.is_configured():
        current_app.logger.warning("Local storage not configured, skipping archive")
        return False

    if song.is_archived:
        current_app.logger.info(f"Song {song.id} already archived")
        return True

    # Get the effective download URL (new field or legacy fallback)
    download_url = song.download_url or song.download_url_1

    if not download_url:
        current_app.logger.warning(f"Song {song.id} has no download URL to archive")
        return False

    try:
        # Archive single track (pass None for second URL)
        result = storage.archive_song_tracks(
            song.id,
            download_url,
            None  # No second URL in new single-track model
        )

        if result.get('local_url_1'):
            song.archived_url = result['local_url_1']
            song.is_archived = True
            song.archived_at = datetime.utcnow()
            song.file_size_bytes = result.get('total_size', 0)
            db.session.commit()
            current_app.logger.info(f"Song {song.id} archived locally: {result}")
            return True
        else:
            current_app.logger.warning(f"No track archived for song {song.id}")
            return False

    except Exception as e:
        current_app.logger.error(f"Failed to archive song {song.id}: {e}")
        return False


def _submit_to_suno(song):
    """Submit song to Suno API for generation."""
    suno_api_key = os.getenv('SUNO_API_KEY')
    suno_api_url = os.getenv('SUNO_API_URL', 'https://api.sunoapi.org/api/v1/generate')

    if not suno_api_key:
        raise Exception('Suno API key is not configured. Please contact the administrator to set up SUNO_API_KEY.')

    # Determine if using custom mode
    # customMode: true means user provides style, title, and lyrics separately
    # customMode: false means user provides only a prompt and AI generates everything
    custom_mode = bool(song.specific_lyrics and song.specific_lyrics.strip())

    # Build Suno API request
    payload = {
        'customMode': custom_mode,
        'instrumental': False,
        'model': 'V5',
        'callBackUrl': f"{os.getenv('APP_URL', 'https://music.aiacopilot.com')}/api/v1/webhooks/suno-callback"
    }

    if custom_mode:
        # Custom mode: provide lyrics, title, and style
        payload['prompt'] = song.specific_lyrics
        payload['title'] = song.specific_title or 'Untitled Song'
    else:
        # Simple mode: just provide a prompt
        payload['prompt'] = song.prompt_to_generate or song.specific_title or 'Create a song'

    # Add optional fields
    if song.vocal_gender:
        payload['vocalGender'] = song.vocal_gender  # Should be 'male' or 'female'

    payload['styleWeight'] = 1

    # Add style if available - explicitly load style by ID if not already loaded
    style_prompt = None
    if song.style_id:
        # Explicitly query the style to ensure it's loaded
        style = Style.query.get(song.style_id)
        if style and style.style_prompt:
            style_prompt = style.style_prompt
            current_app.logger.info(f"Using style '{style.name}' with prompt: {style_prompt}")

    payload['style'] = style_prompt if style_prompt else 'pop'

    headers = {
        'Authorization': f'Bearer {suno_api_key}',
        'Content-Type': 'application/json'
    }

    try:
        response = requests.post(suno_api_url, json=payload, headers=headers, timeout=10)

        # Log the status code and response for debugging
        current_app.logger.info(f"Suno API Status: {response.status_code}")

        # Handle specific HTTP error codes with user-friendly messages
        if response.status_code == 401:
            raise Exception('Suno API authentication failed. The API key may be invalid or expired. Please contact the administrator.')
        elif response.status_code == 402 or response.status_code == 403:
            # Payment required or forbidden - likely out of credits
            try:
                error_data = response.json()
                error_msg = error_data.get('message', error_data.get('error', ''))
            except:
                error_msg = ''
            raise Exception(f'Suno API access denied. You may be out of credits or your subscription has expired. {error_msg}'.strip())
        elif response.status_code == 429:
            raise Exception('Suno API rate limit exceeded. Please wait a few minutes and try again.')
        elif response.status_code >= 500:
            raise Exception('Suno API is currently unavailable. The service may be down. Please try again later.')

        response.raise_for_status()

        result = response.json()

        # Log the full response for debugging
        current_app.logger.info(f"Suno API Response: {result}")

        # Check for error in response body
        if result and isinstance(result, dict):
            # Check for error code (some APIs return code instead of status)
            if result.get('code') and result.get('code') >= 400:
                error_msg = result.get('msg') or result.get('message') or result.get('error') or 'Unknown error from Suno API'
                raise Exception(f'Suno API error: {error_msg}')

            if result.get('error') or result.get('status') == 'error':
                error_msg = result.get('message') or result.get('msg') or result.get('error') or 'Unknown error from Suno API'
                raise Exception(f'Suno API error: {error_msg}')

        # Update song with Suno task ID and set status to submitted
        # The Suno API should return a task_id that we need to store
        task_id = None

        if result and isinstance(result, dict):
            # Check if it's nested in a data object (standard Suno API response)
            task_data = result.get('data', {})
            if isinstance(task_data, dict):
                task_id = task_data.get('taskId') or task_data.get('task_id')

            # Also try top-level fields as fallback
            if not task_id:
                task_id = (result.get('taskId') or result.get('task_id') or
                          result.get('id') or result.get('ID'))

            # Some APIs return data as array
            if not task_id and isinstance(task_data, list) and len(task_data) > 0:
                first_item = task_data[0]
                if isinstance(first_item, dict):
                    task_id = (first_item.get('taskId') or first_item.get('task_id') or
                              first_item.get('id') or first_item.get('ID'))

        if task_id:
            song.suno_task_id = task_id
            current_app.logger.info(f"Stored Suno task_id: {task_id} for song {song.id}")
        else:
            current_app.logger.warning(f"No task_id found in Suno API response for song {song.id}. Full response: {result}")
            raise Exception('Suno API did not return a task ID. The request may have failed. Please try again.')

        song.status = 'submitted'
        db.session.commit()

        return result

    except requests.exceptions.Timeout:
        raise Exception('Suno API request timed out. The service may be slow or unavailable. Please try again.')
    except requests.exceptions.ConnectionError:
        raise Exception('Cannot connect to Suno API. Please check your internet connection or try again later.')
    except requests.exceptions.RequestException as e:
        # Catch any other requests exceptions
        current_app.logger.error(f"Suno API request error: {str(e)}")
        raise Exception(f'Failed to connect to Suno API: {str(e)}')


@bp.route('/', methods=['GET'])
@jwt_required()
def get_songs():
    """Get all songs with filtering and search."""
    user_id = get_jwt_identity()

    # Get query parameters
    status = request.args.get('status')
    style_id = request.args.get('style_id')
    vocal_gender = request.args.get('vocal_gender')
    search = request.args.get('search')
    playlist_id = request.args.get('playlist_id')
    show_all_users = request.args.get('all_users', 'false').lower() == 'true'

    # Build query
    query = Song.query

    # Filter by user unless show_all_users is true
    if not show_all_users:
        query = query.filter_by(user_id=user_id)

    # Apply filters
    if status and status != 'all':
        query = query.filter_by(status=status)

    if style_id:
        query = query.filter_by(style_id=int(style_id))

    if vocal_gender and vocal_gender != 'all':
        query = query.filter_by(vocal_gender=vocal_gender)

    # Filter by playlist
    if playlist_id:
        query = query.join(playlist_songs).filter(playlist_songs.c.playlist_id == int(playlist_id))

    # Apply search
    if search:
        search_pattern = f'%{search}%'
        query = query.filter(
            db.or_(
                Song.specific_title.like(search_pattern),
                Song.specific_lyrics.like(search_pattern)
            )
        )

    # Order by creation date (newest first)
    query = query.order_by(Song.created_at.desc())

    songs = query.all()

    return jsonify({
        'songs': [song.to_dict(include_user=show_all_users, include_style=True, include_playlists=True) for song in songs],
        'total': len(songs)
    }), 200


@bp.route('/<int:song_id>', methods=['GET'])
@jwt_required()
def get_song(song_id):
    """Get a specific song."""
    song = Song.query.get(song_id)

    if not song:
        return jsonify({'error': 'Song not found'}), 404

    return jsonify({'song': song.to_dict(include_user=True, include_style=True)}), 200


@bp.route('/', methods=['POST'])
@jwt_required()
def create_song():
    """Create a new song."""
    user_id = get_jwt_identity()
    data = request.get_json()

    # Validate style exists if provided
    if data.get('style_id'):
        style = Style.query.get(data['style_id'])
        if not style:
            return jsonify({'error': 'Style not found'}), 404

    # Create song - default vocal_gender to 'male' if not provided
    vocal_gender = data.get('vocal_gender')
    if not vocal_gender or vocal_gender not in ('male', 'female'):
        vocal_gender = 'male'

    song = Song(
        user_id=user_id,
        specific_title=data.get('specific_title'),
        version=data.get('version', 'v1'),
        specific_lyrics=data.get('specific_lyrics'),
        prompt_to_generate=data.get('prompt_to_generate'),
        style_id=data.get('style_id'),
        vocal_gender=vocal_gender,
        status=data.get('status', 'create')
    )

    try:
        db.session.add(song)
        db.session.commit()

        # Submit to Suno API directly if song status is 'create'
        if song.status == 'create':
            try:
                _submit_to_suno(song)
            except Exception as suno_error:
                # Log the error
                current_app.logger.error(f"Failed to submit to Suno: {suno_error}")
                # Return the error to the user with a helpful message
                db.session.rollback()
                return jsonify({'error': str(suno_error)}), 500

        return jsonify({
            'message': 'Song submitted for generation' if song.status == 'submitted' else 'Song created successfully',
            'song': song.to_dict(include_user=True, include_style=True)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:song_id>', methods=['PUT'])
@jwt_required()
def update_song(song_id):
    """Update an existing song."""
    user_id = get_jwt_identity()
    song = Song.query.get(song_id)

    if not song:
        return jsonify({'error': 'Song not found'}), 404

    data = request.get_json()

    # Validate style if provided
    if data.get('style_id'):
        style = Style.query.get(data['style_id'])
        if not style:
            return jsonify({'error': 'Style not found'}), 404

    # Allow changing user_id (for reassigning songs)
    if 'user_id' in data:
        from app.models import User
        new_owner = User.query.get(data['user_id'])
        if not new_owner:
            return jsonify({'error': 'User not found'}), 404
        song.user_id = data['user_id']

    # Update fields
    if 'specific_title' in data:
        song.specific_title = data['specific_title']
    if 'specific_lyrics' in data:
        song.specific_lyrics = data['specific_lyrics']
    if 'prompt_to_generate' in data:
        song.prompt_to_generate = data['prompt_to_generate']
    if 'style_id' in data:
        song.style_id = data['style_id']
    if 'vocal_gender' in data:
        vocal_gender = data['vocal_gender']
        song.vocal_gender = vocal_gender if vocal_gender in ('male', 'female') else 'male'
    if 'status' in data:
        song.status = data['status']
    if 'star_rating' in data:
        # Validate star_rating is between 0 and 5
        rating = data['star_rating']
        if not isinstance(rating, int) or rating < 0 or rating > 5:
            return jsonify({'error': 'Star rating must be between 0 and 5'}), 400
        song.star_rating = rating
    if 'downloaded_url_1' in data:
        song.downloaded_url_1 = bool(data['downloaded_url_1'])
    if 'downloaded_url_2' in data:
        song.downloaded_url_2 = bool(data['downloaded_url_2'])

    try:
        db.session.commit()
        return jsonify({
            'message': 'Song updated successfully',
            'song': song.to_dict(include_user=True, include_style=True)
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:song_id>', methods=['DELETE'])
@jwt_required()
def delete_song(song_id):
    """Delete a song."""
    user_id = get_jwt_identity()
    song = Song.query.get(song_id)

    if not song:
        return jsonify({'error': 'Song not found'}), 404

    # Check ownership
    if song.user_id != user_id:
        return jsonify({'error': 'Unauthorized to delete this song'}), 403

    try:
        # Always attempt to delete audio files (in case they exist)
        storage = get_storage_service()
        storage.delete_song_files(song_id)

        db.session.delete(song)
        db.session.commit()
        return jsonify({'message': 'Song deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Get song statistics."""
    user_id = get_jwt_identity()
    show_all_users = request.args.get('all_users', 'false').lower() == 'true'

    # Build base query
    base_query = Song.query if show_all_users else Song.query.filter_by(user_id=user_id)

    # Count completed songs that actually have audio files
    # Check both new (download_url) and legacy (download_url_1) fields
    completed_with_audio = base_query.filter(
        Song.status == 'completed',
        db.or_(
            Song.download_url.isnot(None),
            Song.download_url_1.isnot(None)
        )
    ).count()

    stats = {
        'total': base_query.count(),
        'create': base_query.filter_by(status='create').count(),
        'submitted': base_query.filter_by(status='submitted').count(),
        'completed': completed_with_audio,
        'failed': base_query.filter_by(status='failed').count(),
        'unspecified': base_query.filter_by(status='unspecified').count()
    }

    return jsonify(stats), 200


def _check_suno_status(song):
    """Check the status of a song generation task with Suno API.
    
    Creates separate song records for each audio track returned.
    """
    suno_api_key = os.getenv('SUNO_API_KEY')

    if not suno_api_key:
        raise Exception('Suno API key is not configured')

    if not song.suno_task_id:
        raise Exception('No task ID for this song')

    # Suno API endpoint for checking status
    status_url = f"https://api.sunoapi.org/api/v1/generate/record-info?taskId={song.suno_task_id}"

    headers = {
        'Authorization': f'Bearer {suno_api_key}',
        'Content-Type': 'application/json'
    }

    try:
        response = requests.get(status_url, headers=headers, timeout=30)
        response.raise_for_status()
        result = response.json()

        current_app.logger.info(f"Suno status check for song {song.id}: {result}")

        if result.get('code') != 200:
            error_msg = result.get('msg', 'Unknown error')
            raise Exception(f'Suno API error: {error_msg}')

        data = result.get('data', {})
        status = data.get('status', '').upper()

        if status == 'SUCCESS':
            # Extract audio URLs from sunoData
            response_data = data.get('response', {})
            suno_data = response_data.get('sunoData', [])

            if suno_data and len(suno_data) > 0:
                created_songs = []
                task_id = song.suno_task_id
                
                for idx, track_data in enumerate(suno_data):
                    audio_url = track_data.get('audioUrl')
                    if not audio_url:
                        continue
                    
                    track_number = idx + 1
                    
                    if idx == 0:
                        # Update the original song with the first track
                        song.download_url = audio_url
                        song.sibling_group_id = task_id
                        song.track_number = track_number
                        song.status = 'completed'
                        created_songs.append(song)
                    else:
                        # Create a new song for additional tracks
                        new_song = Song(
                            user_id=song.user_id,
                            source_type=song.source_type,
                            status='completed',
                            specific_title=f"{song.specific_title or 'Untitled'} (v{track_number})",
                            version=song.version,
                            specific_lyrics=song.specific_lyrics,
                            prompt_to_generate=song.prompt_to_generate,
                            style_id=song.style_id,
                            vocal_gender=song.vocal_gender,
                            voice_name=song.voice_name,
                            download_url=audio_url,
                            sibling_group_id=task_id,
                            track_number=track_number,
                            suno_task_id=task_id
                        )
                        db.session.add(new_song)
                        created_songs.append(new_song)

                db.session.commit()
                current_app.logger.info(f"Created/updated {len(created_songs)} songs for task {task_id}")

                # Auto-archive each song
                for s in created_songs:
                    _archive_song_to_storage(s)

                return {
                    'status': 'completed',
                    'songs': [s.to_dict() for s in created_songs],
                    'song': song.to_dict()  # Legacy: return original song
                }
            else:
                current_app.logger.warning(f"Song {song.id} marked SUCCESS but no audio URLs found")
                return {'status': 'pending', 'message': 'Waiting for audio URLs'}

        elif status == 'FAILED':
            error_msg = data.get('errorMessage', 'Generation failed')
            song.status = 'failed'
            db.session.commit()
            current_app.logger.error(f"Song {song.id} failed: {error_msg}")
            return {'status': 'failed', 'error': error_msg}

        elif status in ['PENDING', 'PROCESSING', 'QUEUED']:
            return {'status': 'pending', 'suno_status': status}

        else:
            return {'status': 'pending', 'suno_status': status or 'unknown'}

    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"Error checking Suno status for song {song.id}: {str(e)}")
        raise Exception(f'Failed to check status: {str(e)}')


@bp.route('/<int:song_id>/check-status', methods=['POST'])
@jwt_required()
def check_song_status(song_id):
    """Check the generation status of a submitted song."""
    user_id = get_jwt_identity()
    song = Song.query.get(song_id)

    if not song:
        return jsonify({'error': 'Song not found'}), 404

    # Only check songs that are in submitted status
    if song.status != 'submitted':
        return jsonify({
            'status': song.status,
            'message': f'Song is not in submitted status (current: {song.status})'
        }), 200

    if not song.suno_task_id:
        return jsonify({'error': 'No task ID for this song'}), 400

    try:
        result = _check_suno_status(song)
        return jsonify(result), 200
    except Exception as e:
        current_app.logger.error(f"Error checking status for song {song_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500


@bp.route('/check-submitted', methods=['POST'])
@jwt_required()
def check_all_submitted():
    """Check status of all submitted songs for the current user."""
    user_id = get_jwt_identity()

    # Get all submitted songs for this user
    submitted_songs = Song.query.filter_by(user_id=user_id, status='submitted').all()

    if not submitted_songs:
        return jsonify({
            'message': 'No submitted songs to check',
            'results': [],
            'updated': 0,
            'errors': 0,
            'total_checked': 0
        }), 200

    results = []
    updated_count = 0
    error_count = 0

    for song in submitted_songs:
        if song.suno_task_id:
            try:
                result = _check_suno_status(song)
                results.append({
                    'song_id': song.id,
                    'title': song.specific_title,
                    **result
                })
                if result.get('status') == 'completed':
                    updated_count += 1
                elif result.get('status') == 'failed':
                    error_count += 1
            except Exception as e:
                results.append({
                    'song_id': song.id,
                    'title': song.specific_title,
                    'status': 'error',
                    'error': str(e)
                })
                error_count += 1
        else:
            results.append({
                'song_id': song.id,
                'title': song.specific_title,
                'status': 'error',
                'error': 'No task ID'
            })
            error_count += 1

    return jsonify({
        'results': results,
        'updated': updated_count,
        'errors': error_count,
        'total_checked': len(submitted_songs)
    }), 200


@bp.route('/<int:song_id>/archive', methods=['POST'])
@jwt_required()
def archive_song(song_id):
    """Manually archive a song to Azure Blob Storage."""
    user_id = get_jwt_identity()
    song = Song.query.get(song_id)

    if not song:
        return jsonify({'error': 'Song not found'}), 404

    # Check ownership
    if song.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    # Check if song has audio to archive
    if not song.download_url_1 and not song.download_url_2:
        return jsonify({'error': 'Song has no audio files to archive'}), 400

    if song.is_archived:
        return jsonify({
            'message': 'Song already archived',
            'song': song.to_dict()
        }), 200

    storage = get_storage_service()
    if not storage.is_configured():
        return jsonify({'error': 'Audio storage not configured'}), 503

    success = _archive_song_to_storage(song)

    if success:
        return jsonify({
            'message': 'Song archived successfully',
            'song': song.to_dict()
        }), 200
    else:
        return jsonify({'error': 'Failed to archive song'}), 500


@bp.route('/archive-all', methods=['POST'])
@jwt_required()
def archive_all_songs():
    """Archive all completed songs that haven't been archived yet."""
    user_id = get_jwt_identity()

    storage = get_storage_service()
    if not storage.is_configured():
        return jsonify({'error': 'Audio storage not configured'}), 503

    # Get all completed, unarchived songs for this user
    songs = Song.query.filter(
        Song.user_id == user_id,
        Song.status == 'completed',
        Song.is_archived == False,
        db.or_(Song.download_url_1.isnot(None), Song.download_url_2.isnot(None))
    ).all()

    if not songs:
        return jsonify({
            'message': 'No songs to archive',
            'archived': 0,
            'failed': 0
        }), 200

    archived = 0
    failed = 0

    for song in songs:
        if _archive_song_to_storage(song):
            archived += 1
        else:
            failed += 1

    return jsonify({
        'message': f'Archived {archived} songs',
        'archived': archived,
        'failed': failed,
        'total': len(songs)
    }), 200


@bp.route('/storage/stats', methods=['GET'])
@jwt_required()
def get_storage_stats():
    """Get audio storage statistics."""
    storage = get_storage_service()

    if not storage.is_configured():
        return jsonify({'error': 'Audio storage not configured'}), 503

    stats = storage.get_storage_stats()

    return jsonify({
        'storage': stats,
        'configured': True
    }), 200


@bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_song():
    """Upload a song file directly (without Suno generation)."""
    user_id = get_jwt_identity()

    # Check if file is present
    if 'audio_file' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio_file']

    if audio_file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    # Validate file type (MP3 only)
    if not audio_file.filename.lower().endswith('.mp3'):
        return jsonify({'error': 'Only MP3 files are allowed'}), 400

    # Check file size (100MB max)
    audio_file.seek(0, 2)  # Seek to end
    file_size = audio_file.tell()
    audio_file.seek(0)  # Seek back to start

    max_size = 100 * 1024 * 1024  # 100MB
    if file_size > max_size:
        return jsonify({'error': 'File too large. Maximum size is 100MB'}), 400

    # Get form data
    title = request.form.get('title', '').strip()
    if not title:
        return jsonify({'error': 'Song title is required'}), 400

    version = request.form.get('version', 'v1')
    lyrics = request.form.get('lyrics', '')

    # Get storage service
    storage = get_storage_service()
    if not storage.is_configured():
        return jsonify({'error': 'Audio storage not configured'}), 503

    try:
        # Create song record first to get ID
        song = Song(
            user_id=user_id,
            source_type='uploaded',
            status='completed',
            specific_title=title,
            version=version,
            specific_lyrics=lyrics,
            is_archived=True,
            archived_at=datetime.utcnow()
        )
        db.session.add(song)
        db.session.flush()  # Get the ID without committing

        # Save file to storage
        song_dir = storage.get_song_dir(song.id)
        song_dir.mkdir(parents=True, exist_ok=True)

        filename = "track_1.mp3"
        file_path = song_dir / filename
        audio_file.save(file_path)

        # Update song with file info
        actual_size = file_path.stat().st_size
        song.archived_url = f"{storage.base_url}/songs/{song.id}/{filename}"
        song.file_size_bytes = actual_size

        db.session.commit()

        current_app.logger.info(f"Song {song.id} uploaded successfully: {title}")

        return jsonify({
            'message': 'Song uploaded successfully',
            'song': song.to_dict(include_user=True, include_style=True)
        }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error uploading song: {str(e)}")
        return jsonify({'error': str(e)}), 500
