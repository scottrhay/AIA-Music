from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Song, Style
import requests
import os

bp = Blueprint('songs', __name__)


def _submit_to_suno(song):
    """Submit song to Suno API for generation."""
    suno_api_key = os.getenv('SUNO_API_KEY')
    suno_api_url = os.getenv('SUNO_API_URL', 'https://api.sunoapi.org/api/v1/generate')

    if not suno_api_key:
        raise Exception('Suno API key is not configured. Please contact the administrator to set up SUNO_API_KEY.')

    # Determine if using custom mode (has prompt) or lyrics mode
    custom_mode = not song.prompt_to_generate or song.prompt_to_generate.strip() == ''

    # Build Suno API request
    payload = {
        'customMode': custom_mode,
        'instrumental': False,
        'prompt': song.prompt_to_generate if song.prompt_to_generate else song.specific_lyrics,
        'model': 'chirp-v3-5',
        'title': song.specific_title or 'Untitled Song',
        'styleWeight': 1,
        'vocalGender': 'f' if song.vocal_gender == 'female' else 'm',
        'callBackUrl': f"{os.getenv('APP_URL', 'https://suno.aiacopilot.com')}/api/v1/webhooks/suno-callback"
    }

    # Add style if available
    if song.style and song.style.style_prompt:
        payload['style'] = song.style.style_prompt
    else:
        payload['style'] = 'pop'

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
            if result.get('error') or result.get('status') == 'error':
                error_msg = result.get('message') or result.get('error') or 'Unknown error from Suno API'
                raise Exception(f'Suno API error: {error_msg}')

        # Update song with Suno task ID and set status to submitted
        # The Suno API should return a task_id that we need to store
        task_id = None

        if result and isinstance(result, dict):
            # Try different possible response structures
            task_id = result.get('task_id') or result.get('taskId')

            # Also check if it's nested in a data object
            if not task_id:
                task_data = result.get('data', {})
                if isinstance(task_data, dict):
                    task_id = task_data.get('task_id') or task_data.get('taskId')

        if task_id:
            song.suno_task_id = task_id
            current_app.logger.info(f"Stored Suno task_id: {task_id} for song {song.id}")
        else:
            current_app.logger.warning(f"No task_id found in Suno API response for song {song.id}")
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
        'songs': [song.to_dict(include_user=show_all_users, include_style=True) for song in songs],
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

    # Create song
    song = Song(
        user_id=user_id,
        specific_title=data.get('specific_title'),
        specific_lyrics=data.get('specific_lyrics'),
        prompt_to_generate=data.get('prompt_to_generate'),
        style_id=data.get('style_id'),
        vocal_gender=data.get('vocal_gender'),
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

    # Check ownership
    if song.user_id != user_id:
        return jsonify({'error': 'Unauthorized to update this song'}), 403

    data = request.get_json()

    # Validate style if provided
    if data.get('style_id'):
        style = Style.query.get(data['style_id'])
        if not style:
            return jsonify({'error': 'Style not found'}), 404

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
        song.vocal_gender = data['vocal_gender']
    if 'status' in data:
        song.status = data['status']

    try:
        db.session.commit()
        return jsonify({
            'message': 'Song updated successfully',
            'song': song.to_dict(include_user=True, include_style=True)
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:song_id>/recreate', methods=['POST'])
@jwt_required()
def recreate_song(song_id):
    """Recreate/regenerate an existing song."""
    user_id = get_jwt_identity()
    song = Song.query.get(song_id)

    if not song:
        return jsonify({'error': 'Song not found'}), 404

    # Check ownership
    if song.user_id != user_id:
        return jsonify({'error': 'Unauthorized to recreate this song'}), 403

    try:
        # Reset download URLs and submit to Suno
        song.download_url_1 = None
        song.download_url_2 = None
        song.status = 'create'

        # Access style relationship before commit to ensure it's loaded
        _ = song.style

        db.session.commit()

        # Submit to Suno API
        _submit_to_suno(song)

        return jsonify({
            'message': 'Song submitted for regeneration',
            'song': song.to_dict(include_user=True, include_style=True)
        }), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error in recreate_song: {str(e)}", exc_info=True)
        import traceback
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500


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

    stats = {
        'total': base_query.count(),
        'create': base_query.filter_by(status='create').count(),
        'submitted': base_query.filter_by(status='submitted').count(),
        'completed': base_query.filter_by(status='completed').count(),
        'unspecified': base_query.filter_by(status='unspecified').count()
    }

    return jsonify(stats), 200
