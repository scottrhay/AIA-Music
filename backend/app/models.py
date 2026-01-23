from datetime import datetime
from app import db
from sqlalchemy.dialects.postgresql import ENUM as PgEnum


# Define PostgreSQL ENUM types with names
source_type_enum = PgEnum('suno', 'uploaded', name='source_type_enum', create_type=False)
status_enum = PgEnum('create', 'submitted', 'completed', 'failed', 'unspecified', name='status_enum', create_type=False)
vocal_gender_enum = PgEnum('male', 'female', 'other', name='vocal_gender_enum', create_type=False)


# Junction table for Playlist <-> Song many-to-many relationship
playlist_songs = db.Table('playlist_songs',
    db.Column('playlist_id', db.Integer, db.ForeignKey('playlists.id', ondelete='CASCADE'), primary_key=True),
    db.Column('song_id', db.Integer, db.ForeignKey('songs.id', ondelete='CASCADE'), primary_key=True),
    db.Column('position', db.Integer, default=0),
    db.Column('added_at', db.DateTime, default=datetime.utcnow)
)


class User(db.Model):
    """User model for authentication and ownership."""

    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False, index=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=True)  # Nullable for OAuth users
    is_active = db.Column(db.Boolean, default=True)
    # OAuth fields
    oauth_provider = db.Column(db.String(50))  # 'microsoft', 'google', etc.
    oauth_id = db.Column(db.String(255), index=True)  # Provider's user ID
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    songs = db.relationship('Song', backref='creator', lazy='dynamic', cascade='all, delete-orphan')
    styles = db.relationship('Style', backref='creator', lazy='dynamic')
    playlists = db.relationship('Playlist', backref='creator', lazy='dynamic')

    def to_dict(self):
        """Convert user to dictionary."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Style(db.Model):
    """Style model for music style definitions."""

    __tablename__ = 'styles'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True, nullable=False)
    style_prompt = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    songs = db.relationship('Song', backref='style', lazy='dynamic')

    def to_dict(self, include_details=True):
        """Convert style to dictionary."""
        data = {
            'id': self.id,
            'name': self.name,
            'style_prompt': self.style_prompt,
            'created_by': self.creator.username if self.creator else None,
            'created_by_id': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        return data


class Song(db.Model):
    """Song model for music creation tracking."""

    __tablename__ = 'songs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    source_type = db.Column(source_type_enum, default='suno', index=True)
    status = db.Column(status_enum, default='create', index=True)
    specific_title = db.Column(db.String(500))
    version = db.Column(db.String(10), default='v1')
    star_rating = db.Column(db.Integer, default=0, index=True)
    specific_lyrics = db.Column(db.Text)
    prompt_to_generate = db.Column(db.Text)
    style_id = db.Column(db.Integer, db.ForeignKey('styles.id', ondelete='SET NULL'))
    vocal_gender = db.Column(vocal_gender_enum)
    voice_name = db.Column(db.String(255))  # Azure Speech voice name
    download_url_1 = db.Column(db.String(1000))
    downloaded_url_1 = db.Column(db.Boolean, default=False)
    download_url_2 = db.Column(db.String(1000))
    downloaded_url_2 = db.Column(db.Boolean, default=False)
    suno_task_id = db.Column(db.String(255), index=True)  # Suno API task ID
    # Local storage for permanent audio archive
    archived_url_1 = db.Column(db.String(1000))  # Permanent local copy
    archived_url_2 = db.Column(db.String(1000))
    is_archived = db.Column(db.Boolean, default=False, index=True)
    archived_at = db.Column(db.DateTime)
    file_size_bytes = db.Column(db.Integer)  # Total size of both tracks
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self, include_user=False, include_style=True, include_playlists=False):
        """Convert song to dictionary."""
        data = {
            'id': self.id,
            'source_type': self.source_type or 'suno',
            'status': self.status,
            'specific_title': self.specific_title,
            'version': self.version or 'v1',
            'star_rating': self.star_rating or 0,
            'specific_lyrics': self.specific_lyrics,
            'prompt_to_generate': self.prompt_to_generate,
            'vocal_gender': self.vocal_gender,
            'voice_name': self.voice_name,
            'download_url_1': self.download_url_1,
            'downloaded_url_1': self.downloaded_url_1 or False,
            'download_url_2': self.download_url_2,
            'downloaded_url_2': self.downloaded_url_2 or False,
            'suno_task_id': self.suno_task_id,
            'archived_url_1': self.archived_url_1,
            'archived_url_2': self.archived_url_2,
            'is_archived': self.is_archived or False,
            'archived_at': self.archived_at.isoformat() if self.archived_at else None,
            'file_size_bytes': self.file_size_bytes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        if include_user:
            data['creator'] = self.creator.username if self.creator else None
            data['user_id'] = self.user_id

        if include_style and self.style:
            data['style'] = self.style.to_dict(include_details=False)
            data['style_name'] = self.style.name
        else:
            data['style_id'] = self.style_id

        if include_playlists:
            data['playlists'] = [{'id': p.id, 'name': p.name} for p in self.playlists]

        return data


class Playlist(db.Model):
    """Playlist model for organizing songs."""

    __tablename__ = 'playlists'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    is_public = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    songs = db.relationship('Song', secondary=playlist_songs, lazy='dynamic',
                           backref=db.backref('playlists', lazy='dynamic'))

    def to_dict(self, include_songs=False):
        """Convert playlist to dictionary."""
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_by': self.creator.username if self.creator else None,
            'created_by_id': self.created_by,
            'is_public': self.is_public,
            'song_count': self.songs.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        if include_songs:
            data['songs'] = [song.to_dict(include_user=True, include_style=True)
                           for song in self.songs]

        return data
