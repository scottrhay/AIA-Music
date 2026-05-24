"""Local filesystem storage service for permanent audio archival."""
import os
import shutil
import requests
from pathlib import Path
from datetime import datetime


class AudioStorageService:
    """Service for storing and managing audio files on local filesystem."""

    def __init__(self):
        """Initialize local storage service."""
        # Base path for audio storage (mounted volume in Docker)
        self.base_path = Path(os.getenv('AUDIO_STORAGE_PATH', '/app/data/audio'))
        self.base_url = os.getenv('AUDIO_BASE_URL', '/audio')

        # Ensure base directory exists
        self.base_path.mkdir(parents=True, exist_ok=True)

    def is_configured(self):
        """Check if storage is properly configured."""
        return self.base_path.exists() and os.access(self.base_path, os.W_OK)

    def get_song_dir(self, song_id: int) -> Path:
        """Get the directory path for a song's audio files."""
        return self.base_path / "songs" / str(song_id)

    def archive_song(self, song_id: int, suno_url: str, track_num: int) -> dict:
        """
        Download audio from Suno and save to local filesystem.

        Args:
            song_id: The database song ID
            suno_url: The Suno-provided download URL
            track_num: Which track (1 or 2)

        Returns:
            dict with 'url' and 'size' keys, or raises exception
        """
        if not self.is_configured():
            raise ValueError("Audio storage not configured or not writable")

        if not suno_url:
            raise ValueError("No URL provided to archive")

        # Create song directory
        song_dir = self.get_song_dir(song_id)
        song_dir.mkdir(parents=True, exist_ok=True)

        # Download from Suno
        response = requests.get(suno_url, stream=True, timeout=120)
        response.raise_for_status()

        # Save to local file
        filename = f"track_{track_num}.mp3"
        file_path = song_dir / filename

        with open(file_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        file_size = file_path.stat().st_size

        # Return the URL path (served by nginx)
        url_path = f"{self.base_url}/songs/{song_id}/{filename}"

        return {
            'url': url_path,
            'size': file_size
        }

    def archive_song_tracks(self, song_id: int, url_1: str = None, url_2: str = None) -> dict:
        """
        Archive both tracks of a song.

        Args:
            song_id: The database song ID
            url_1: First track Suno URL
            url_2: Second track Suno URL

        Returns:
            dict with 'local_url_1', 'local_url_2', 'total_size'
        """
        result = {
            'local_url_1': None,
            'local_url_2': None,
            'total_size': 0
        }

        if url_1:
            try:
                track_1 = self.archive_song(song_id, url_1, 1)
                result['local_url_1'] = track_1['url']
                result['total_size'] += track_1['size']
            except Exception as e:
                print(f"Failed to archive track 1 for song {song_id}: {e}")

        if url_2:
            try:
                track_2 = self.archive_song(song_id, url_2, 2)
                result['local_url_2'] = track_2['url']
                result['total_size'] += track_2['size']
            except Exception as e:
                print(f"Failed to archive track 2 for song {song_id}: {e}")

        return result

    def delete_song_files(self, song_id: int):
        """
        Delete all files for a song from local storage.

        Args:
            song_id: The database song ID
        """
        song_dir = self.get_song_dir(song_id)

        if song_dir.exists():
            try:
                shutil.rmtree(song_dir)
                print(f"Deleted audio files for song {song_id}")
            except Exception as e:
                print(f"Error deleting song files for {song_id}: {e}")

    def get_storage_stats(self) -> dict:
        """Get storage usage statistics."""
        total_size = 0
        file_count = 0
        song_count = 0

        songs_dir = self.base_path / "songs"
        if songs_dir.exists():
            for song_dir in songs_dir.iterdir():
                if song_dir.is_dir():
                    song_count += 1
                    for audio_file in song_dir.glob("*.mp3"):
                        file_count += 1
                        total_size += audio_file.stat().st_size

        return {
            'total_size_bytes': total_size,
            'total_size_mb': round(total_size / (1024 * 1024), 2),
            'total_size_gb': round(total_size / (1024 * 1024 * 1024), 2),
            'file_count': file_count,
            'song_count': song_count
        }


# Singleton instance
_storage_service = None


def get_storage_service() -> AudioStorageService:
    """Get or create the audio storage service singleton."""
    global _storage_service
    if _storage_service is None:
        _storage_service = AudioStorageService()
    return _storage_service
