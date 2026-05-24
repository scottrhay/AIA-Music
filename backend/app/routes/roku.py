import os
from flask import Blueprint, jsonify, request, abort
from app import db
from app.models import Playlist, Song, playlist_songs

bp = Blueprint('roku', __name__)

BASE_URL = 'https://music.aiacopilot.com'


def _validate_key(secret_key):
    expected = os.getenv('ROKU_SECRET_KEY', '')
    if not expected or secret_key != expected:
        abort(403)


def _song_to_roku(song):
    # Resolve audio URL: prefer archived (served locally), fall back to download URL.
    # Support both new per-track fields (_1/_2) and legacy single-track fields.
    audio_url = None
    if song.archived_url_1:
        audio_url = f"{BASE_URL}{song.archived_url_1}"
    elif song.archived_url:
        audio_url = f"{BASE_URL}{song.archived_url}"
    elif song.download_url_1:
        audio_url = song.download_url_1
    elif song.download_url:
        audio_url = song.download_url

    audio_url_2 = None
    if song.archived_url_2:
        audio_url_2 = f"{BASE_URL}{song.archived_url_2}"
    elif song.download_url_2:
        audio_url_2 = song.download_url_2

    return {
        'id': song.id,
        'title': song.specific_title or 'Untitled',
        'specific_title': song.specific_title or 'Untitled',
        'artist': song.creator.username if song.creator else 'Unknown',
        'url': audio_url,
        'url_2': audio_url_2,
        'archived_url': audio_url,
        'download_url': audio_url,
        'style': song.style.name if song.style else None,
        'star_rating': song.star_rating or 0,
        'duration': None,
    }


def _has_audio():
    """Filter condition: song has at least one playable audio URL (new or legacy fields)."""
    return db.or_(
        Song.archived_url_1.isnot(None),
        Song.archived_url.isnot(None),
        Song.download_url_1.isnot(None),
        Song.download_url.isnot(None),
    )


@bp.route('/<secret_key>/playlists', methods=['GET'])
def get_playlists(secret_key):
    _validate_key(secret_key)
    playlists = Playlist.query.filter_by(is_public=True).order_by(Playlist.name).all()
    return jsonify({
        'playlists': [{
            'id': p.id,
            'name': p.name,
            'description': p.description,
            'song_count': p.songs.count(),
        } for p in playlists],
        'total': len(playlists)
    }), 200


@bp.route('/<secret_key>/playlists/<int:playlist_id>/songs', methods=['GET'])
def get_playlist_songs(secret_key, playlist_id):
    _validate_key(secret_key)
    playlist = Playlist.query.get(playlist_id)
    if not playlist:
        return jsonify({'error': 'Playlist not found'}), 404

    songs = playlist.songs.filter(
        Song.status == 'completed',
        _has_audio()
    ).order_by(Song.specific_title).all()

    # Nest songs inside playlist to match what Roku BrightScript expects
    return jsonify({
        'playlist': {
            'id': playlist.id,
            'name': playlist.name,
            'description': playlist.description,
            'songs': [_song_to_roku(s) for s in songs],
        },
        'total': len(songs)
    }), 200


@bp.route('/<secret_key>/songs', methods=['GET'])
def get_songs(secret_key):
    _validate_key(secret_key)
    playlist_id = request.args.get('playlist_id')
    search = request.args.get('search')

    query = Song.query.filter(
        Song.status == 'completed',
        _has_audio()
    )

    if playlist_id:
        query = query.join(playlist_songs).filter(
            playlist_songs.c.playlist_id == int(playlist_id)
        )

    if search:
        query = query.filter(Song.specific_title.ilike(f'%{search}%'))

    songs = query.order_by(Song.specific_title).all()

    return jsonify({
        'songs': [_song_to_roku(s) for s in songs],
        'total': len(songs)
    }), 200
