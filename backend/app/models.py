from datetime import datetime
from app import db


class User(db.Model):
    """User model for authentication and ownership."""

    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False, index=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    songs = db.relationship('Song', backref='creator', lazy='dynamic', cascade='all, delete-orphan')
    styles = db.relationship('Style', backref='creator', lazy='dynamic')

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
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if include_details:
            data.update({
                'style_prompt': self.style_prompt,
                'created_by': self.creator.username if self.creator else None
            })

        return data


class Song(db.Model):
    """Song model for music creation tracking."""

    __tablename__ = 'songs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    status = db.Column(db.Enum('create', 'submitted', 'completed', 'unspecified'), default='create', index=True)
    specific_title = db.Column(db.String(500))
    specific_lyrics = db.Column(db.Text)
    prompt_to_generate = db.Column(db.Text)
    style_id = db.Column(db.Integer, db.ForeignKey('styles.id', ondelete='SET NULL'))
    vocal_gender = db.Column(db.Enum('male', 'female', 'other'))
    download_url_1 = db.Column(db.String(1000))
    download_url_2 = db.Column(db.String(1000))
    suno_task_id = db.Column(db.String(255), index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self, include_user=False, include_style=True):
        """Convert song to dictionary."""
        data = {
            'id': self.id,
            'status': self.status,
            'specific_title': self.specific_title,
            'specific_lyrics': self.specific_lyrics,
            'prompt_to_generate': self.prompt_to_generate,
            'vocal_gender': self.vocal_gender,
            'download_url_1': self.download_url_1,
            'download_url_2': self.download_url_2,
            'suno_task_id': self.suno_task_id,
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

        return data
