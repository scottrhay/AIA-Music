#!/usr/bin/env python3
"""
Migration script to split dual-track songs into individual song records.

This script:
1. Adds new columns: download_url, downloaded, archived_url, sibling_group_id, track_number
2. Migrates existing songs:
   - Songs with only download_url_1: copies to download_url
   - Songs with both download_url_1 and download_url_2: creates a new song for track 2
3. Does NOT remove old columns (backward compatibility)

Run from the backend directory:
    python scripts/migrate_split_tracks.py
"""

import os
import sys

# Add the backend app to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime
from app import create_app, db
from app.models import Song
from sqlalchemy import text
import uuid


def add_new_columns():
    """Add new columns if they don't exist."""
    print("Adding new columns...")
    
    columns_to_add = [
        ("download_url", "VARCHAR(1000)"),
        ("downloaded", "BOOLEAN DEFAULT FALSE"),
        ("archived_url", "VARCHAR(1000)"),
        ("sibling_group_id", "VARCHAR(255)"),
        ("track_number", "INTEGER DEFAULT 1"),
    ]
    
    for col_name, col_type in columns_to_add:
        try:
            # Check if column exists
            result = db.session.execute(text(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'songs' AND column_name = '{col_name}'
            """))
            
            if result.fetchone() is None:
                print(f"  Adding column: {col_name}")
                db.session.execute(text(f"ALTER TABLE songs ADD COLUMN {col_name} {col_type}"))
                db.session.commit()
            else:
                print(f"  Column already exists: {col_name}")
        except Exception as e:
            print(f"  Error adding column {col_name}: {e}")
            db.session.rollback()
    
    # Add index on sibling_group_id
    try:
        db.session.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_songs_sibling_group_id 
            ON songs (sibling_group_id)
        """))
        db.session.commit()
        print("  Added index on sibling_group_id")
    except Exception as e:
        print(f"  Index may already exist: {e}")
        db.session.rollback()


def migrate_existing_songs():
    """Migrate existing songs to use new single-track model."""
    print("\nMigrating existing songs...")
    
    # Get all songs that haven't been migrated (download_url is NULL)
    songs = Song.query.filter(Song.download_url.is_(None)).all()
    print(f"  Found {len(songs)} songs to process")
    
    created_count = 0
    updated_count = 0
    skipped_count = 0
    
    for song in songs:
        # Skip songs without any download URLs
        if not song.download_url_1 and not song.download_url_2:
            skipped_count += 1
            continue
        
        # Generate sibling_group_id from suno_task_id or create new one
        sibling_group_id = song.suno_task_id or str(uuid.uuid4())
        
        # Migrate track 1 data to new fields
        if song.download_url_1:
            song.download_url = song.download_url_1
            song.downloaded = song.downloaded_url_1 or False
            song.archived_url = song.archived_url_1
            song.sibling_group_id = sibling_group_id
            song.track_number = 1
            updated_count += 1
        
        # If there's a second track, create a new song for it
        if song.download_url_2:
            new_song = Song(
                user_id=song.user_id,
                source_type=song.source_type,
                status=song.status,
                specific_title=f"{song.specific_title or 'Untitled'} (v2)",
                version=song.version,
                star_rating=0,  # Start with no rating - user rates independently
                specific_lyrics=song.specific_lyrics,
                prompt_to_generate=song.prompt_to_generate,
                style_id=song.style_id,
                vocal_gender=song.vocal_gender,
                voice_name=song.voice_name,
                # New single-track fields
                download_url=song.download_url_2,
                downloaded=song.downloaded_url_2 or False,
                archived_url=song.archived_url_2,
                sibling_group_id=sibling_group_id,
                track_number=2,
                suno_task_id=song.suno_task_id,
                is_archived=song.is_archived,
                archived_at=song.archived_at,
                # File size is tricky - we could split it but for now set to 0
                file_size_bytes=0,
                created_at=song.created_at,
                updated_at=datetime.utcnow()
            )
            db.session.add(new_song)
            created_count += 1
            print(f"  Created new song for track 2 of '{song.specific_title}' (sibling_group: {sibling_group_id[:8]}...)")
    
    db.session.commit()
    
    print(f"\nMigration complete:")
    print(f"  Updated: {updated_count} songs")
    print(f"  Created: {created_count} new songs (from track 2)")
    print(f"  Skipped: {skipped_count} songs (no audio)")


def verify_migration():
    """Verify the migration was successful."""
    print("\nVerifying migration...")
    
    # Count songs with new vs old fields
    total = Song.query.count()
    with_new_url = Song.query.filter(Song.download_url.isnot(None)).count()
    with_old_url = Song.query.filter(Song.download_url_1.isnot(None)).count()
    with_sibling = Song.query.filter(Song.sibling_group_id.isnot(None)).count()
    
    print(f"  Total songs: {total}")
    print(f"  With download_url (new): {with_new_url}")
    print(f"  With download_url_1 (legacy): {with_old_url}")
    print(f"  With sibling_group_id: {with_sibling}")
    
    # Show sibling groups
    groups = db.session.query(
        Song.sibling_group_id, 
        db.func.count(Song.id)
    ).filter(
        Song.sibling_group_id.isnot(None)
    ).group_by(
        Song.sibling_group_id
    ).having(
        db.func.count(Song.id) > 1
    ).all()
    
    if groups:
        print(f"\n  Found {len(groups)} sibling groups:")
        for group_id, count in groups[:5]:  # Show first 5
            songs = Song.query.filter_by(sibling_group_id=group_id).all()
            titles = [s.specific_title for s in songs]
            print(f"    - {group_id[:8]}...: {count} songs - {titles}")


def main():
    """Run the migration."""
    app = create_app()
    
    with app.app_context():
        print("=" * 60)
        print("Split Suno Tracks Migration")
        print("=" * 60)
        
        # Add new columns
        add_new_columns()
        
        # Migrate existing data
        migrate_existing_songs()
        
        # Verify
        verify_migration()
        
        print("\n" + "=" * 60)
        print("Migration complete!")
        print("=" * 60)


if __name__ == '__main__':
    main()
