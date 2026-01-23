from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Playlist, Song

bp = Blueprint('playlists', __name__)


@bp.route('/', methods=['GET'])
@jwt_required()
def get_playlists():
    """Get all playlists (user's own + public from others)."""
    user_id = get_jwt_identity()

    # Get user's playlists and others' public playlists
    playlists = Playlist.query.filter(
        db.or_(
            Playlist.created_by == user_id,
            Playlist.is_public == True
        )
    ).order_by(Playlist.name).all()

    return jsonify({
        'playlists': [p.to_dict() for p in playlists],
        'total': len(playlists)
    }), 200


@bp.route('/<int:playlist_id>', methods=['GET'])
@jwt_required()
def get_playlist(playlist_id):
    """Get a specific playlist with songs."""
    user_id = get_jwt_identity()
    playlist = Playlist.query.get(playlist_id)

    if not playlist:
        return jsonify({'error': 'Playlist not found'}), 404

    # Check access (owner or public)
    if playlist.created_by != user_id and not playlist.is_public:
        return jsonify({'error': 'Unauthorized to view this playlist'}), 403

    return jsonify({'playlist': playlist.to_dict(include_songs=True)}), 200


@bp.route('/', methods=['POST'])
@jwt_required()
def create_playlist():
    """Create a new playlist."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get('name'):
        return jsonify({'error': 'Playlist name is required'}), 400

    playlist = Playlist(
        name=data['name'].strip(),
        description=data.get('description', ''),
        created_by=user_id,
        is_public=data.get('is_public', True)
    )

    try:
        db.session.add(playlist)
        db.session.commit()
        return jsonify({
            'message': 'Playlist created successfully',
            'playlist': playlist.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:playlist_id>', methods=['PUT'])
@jwt_required()
def update_playlist(playlist_id):
    """Update a playlist."""
    user_id = get_jwt_identity()
    playlist = Playlist.query.get(playlist_id)

    if not playlist:
        return jsonify({'error': 'Playlist not found'}), 404

    if playlist.created_by != user_id:
        return jsonify({'error': 'You can only edit playlists you created'}), 403

    data = request.get_json()

    if 'name' in data:
        playlist.name = data['name'].strip()
    if 'description' in data:
        playlist.description = data['description']
    if 'is_public' in data:
        playlist.is_public = data['is_public']

    try:
        db.session.commit()
        return jsonify({
            'message': 'Playlist updated successfully',
            'playlist': playlist.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:playlist_id>', methods=['DELETE'])
@jwt_required()
def delete_playlist(playlist_id):
    """Delete a playlist."""
    user_id = get_jwt_identity()
    playlist = Playlist.query.get(playlist_id)

    if not playlist:
        return jsonify({'error': 'Playlist not found'}), 404

    if playlist.created_by != user_id:
        return jsonify({'error': 'You can only delete playlists you created'}), 403

    try:
        db.session.delete(playlist)
        db.session.commit()
        return jsonify({'message': 'Playlist deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:playlist_id>/songs', methods=['POST'])
@jwt_required()
def add_song_to_playlist(playlist_id):
    """Add a song to a playlist."""
    user_id = get_jwt_identity()
    playlist = Playlist.query.get(playlist_id)

    if not playlist:
        return jsonify({'error': 'Playlist not found'}), 404

    if playlist.created_by != user_id:
        return jsonify({'error': 'You can only add songs to your own playlists'}), 403

    data = request.get_json()
    song_id = data.get('song_id')

    if not song_id:
        return jsonify({'error': 'Song ID is required'}), 400

    song = Song.query.get(song_id)
    if not song:
        return jsonify({'error': 'Song not found'}), 404

    if song in playlist.songs:
        return jsonify({'error': 'Song is already in this playlist'}), 409

    try:
        playlist.songs.append(song)
        db.session.commit()
        return jsonify({
            'message': 'Song added to playlist',
            'playlist': playlist.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:playlist_id>/songs/<int:song_id>', methods=['DELETE'])
@jwt_required()
def remove_song_from_playlist(playlist_id, song_id):
    """Remove a song from a playlist."""
    user_id = get_jwt_identity()
    playlist = Playlist.query.get(playlist_id)

    if not playlist:
        return jsonify({'error': 'Playlist not found'}), 404

    if playlist.created_by != user_id:
        return jsonify({'error': 'You can only remove songs from your own playlists'}), 403

    song = Song.query.get(song_id)
    if not song:
        return jsonify({'error': 'Song not found'}), 404

    if song not in playlist.songs:
        return jsonify({'error': 'Song is not in this playlist'}), 404

    try:
        playlist.songs.remove(song)
        db.session.commit()
        return jsonify({'message': 'Song removed from playlist'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/song/<int:song_id>/assign', methods=['POST'])
@jwt_required()
def assign_song_to_playlists(song_id):
    """Assign a song to multiple playlists (bulk operation)."""
    user_id = get_jwt_identity()
    song = Song.query.get(song_id)

    if not song:
        return jsonify({'error': 'Song not found'}), 404

    data = request.get_json()
    playlist_ids = data.get('playlist_ids', [])

    # Get all user's playlists
    user_playlists = Playlist.query.filter_by(created_by=user_id).all()
    user_playlist_ids = {p.id for p in user_playlists}

    # Validate all playlist_ids belong to user
    for pid in playlist_ids:
        if pid not in user_playlist_ids:
            return jsonify({'error': f'Playlist {pid} not found or not owned by you'}), 403

    try:
        # Remove song from all user's playlists first
        for playlist in user_playlists:
            if song in playlist.songs:
                playlist.songs.remove(song)

        # Add song to selected playlists
        for pid in playlist_ids:
            playlist = Playlist.query.get(pid)
            if song not in playlist.songs:
                playlist.songs.append(song)

        db.session.commit()
        return jsonify({
            'message': 'Song playlist assignments updated',
            'assigned_playlists': playlist_ids
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/song/<int:song_id>/playlists', methods=['GET'])
@jwt_required()
def get_song_playlists(song_id):
    """Get all playlists a song belongs to (for the current user)."""
    user_id = get_jwt_identity()
    song = Song.query.get(song_id)

    if not song:
        return jsonify({'error': 'Song not found'}), 404

    # Get playlists this song is in that belong to the current user
    user_playlists = Playlist.query.filter_by(created_by=user_id).all()
    song_playlist_ids = [p.id for p in song.playlists if p.created_by == user_id]

    return jsonify({
        'user_playlists': [p.to_dict() for p in user_playlists],
        'song_playlist_ids': song_playlist_ids
    }), 200
