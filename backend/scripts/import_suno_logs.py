#!/usr/bin/env python3
"""
One-time import script to import songs from Suno API logs.
Run inside the aiamusic container:
    docker exec aiamusic python scripts/import_suno_logs.py
"""

import json
import os
import sys

# Add the app directory to the path
sys.path.insert(0, '/app')

from app import create_app, db
from app.models import Song, Style, User
from app.routes.songs import _archive_song_to_storage


def parse_logs(filepath):
    """Parse the SunoLogs.txt file which contains multiple JSON objects."""
    all_records = []

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # The file contains multiple JSON objects concatenated (one per page)
    # We need to parse them separately using brace counting
    pages_found = 0
    i = 0
    while i < len(content):
        # Find the start of next JSON object
        while i < len(content) and content[i] != '{':
            i += 1
        if i >= len(content):
            break

        # Find the matching closing brace
        start = i
        brace_count = 0
        in_string = False
        escape_next = False

        while i < len(content):
            char = content[i]

            if escape_next:
                escape_next = False
                i += 1
                continue

            if char == '\\' and in_string:
                escape_next = True
                i += 1
                continue

            if char == '"' and not escape_next:
                in_string = not in_string

            if not in_string:
                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        # Found complete JSON object
                        json_str = content[start:i+1]
                        try:
                            obj = json.loads(json_str)
                            records = obj.get('data', {}).get('records', [])
                            all_records.extend(records)
                            pages_found += 1
                        except json.JSONDecodeError as e:
                            print(f"Warning: Failed to parse page {pages_found + 1}: {e}")
                        i += 1
                        break
            i += 1

    print(f"Parsed {pages_found} pages from log file")
    return all_records


def find_or_create_style(style_desc, user_id):
    """Find an existing style or create a new one."""
    if not style_desc or not style_desc.strip():
        return None

    # Try to find by exact style_prompt match
    style = Style.query.filter_by(style_prompt=style_desc).first()
    if style:
        return style

    # Create a name from first 100 chars of description
    name = style_desc[:100].strip()
    if '\n' in name:
        name = name.split('\n')[0].strip()

    # Make name unique by truncating further if needed
    base_name = name[:90]  # Leave room for counter

    # Check if name already exists
    existing = Style.query.filter_by(name=name).first()
    if existing:
        # If same style_prompt, use it
        if existing.style_prompt == style_desc:
            return existing
        # Otherwise create with unique name
        counter = 1
        while Style.query.filter_by(name=f"{base_name}_{counter}").first():
            counter += 1
        name = f"{base_name}_{counter}"

    # Create new style (using correct column names: style_prompt and created_by)
    style = Style(
        name=name,
        style_prompt=style_desc,
        created_by=user_id
    )
    db.session.add(style)
    db.session.flush()  # Get the ID without committing
    print(f"  Created style: {name[:50]}...")
    return style


def import_song(record, user_id):
    """Import a single song from a log record."""
    try:
        param = json.loads(record['paramJson'])
        result = json.loads(record['resultJson'])
    except (json.JSONDecodeError, KeyError) as e:
        print(f"  Error parsing record: {e}")
        return False

    task_id = result.get('task_id')
    title = param.get('title', 'Untitled')

    if not task_id:
        print(f"  Skipping '{title}' - no task_id")
        return False

    # Skip if already exists
    existing = Song.query.filter_by(suno_task_id=task_id).first()
    if existing:
        print(f"  Skipping '{title}' - already exists (ID: {existing.id})")
        return False

    # Find or create style
    style_desc = param.get('style', '')
    style = find_or_create_style(style_desc, user_id)

    # Get audio URLs from result data
    suno_data = result.get('data', [])
    url_1 = suno_data[0].get('audio_url') if len(suno_data) > 0 else None
    url_2 = suno_data[1].get('audio_url') if len(suno_data) > 1 else None

    if not url_1:
        print(f"  Skipping '{title}' - no audio URL")
        return False

    # Map vocal gender (normalize to lowercase 'male'/'female')
    vocal_gender = param.get('vocalGender', 'male').lower()
    if vocal_gender in ('m', 'male'):
        vocal_gender = 'male'
    elif vocal_gender in ('f', 'female'):
        vocal_gender = 'female'
    else:
        vocal_gender = 'male'  # Default to male for unknown values

    # Create song record
    song = Song(
        user_id=user_id,
        suno_task_id=task_id,
        source_type='suno',
        status='completed',
        specific_title=title,
        specific_lyrics=param.get('prompt', ''),
        style_id=style.id if style else None,
        vocal_gender=vocal_gender,
        download_url_1=url_1,
        download_url_2=url_2
    )
    db.session.add(song)
    db.session.commit()

    print(f"  Imported: '{title}' (ID: {song.id})")

    # Archive audio files to local storage
    try:
        _archive_song_to_storage(song)
        print(f"    Archived audio files")
    except Exception as e:
        print(f"    Warning: Failed to archive audio: {e}")

    return True


def main():
    """Main import function."""
    import argparse
    parser = argparse.ArgumentParser(description='Import songs from Suno API logs')
    parser.add_argument('--user', '-u', default='scott@aiacopilot.com',
                        help='Email of user to assign songs to (default: scott@aiacopilot.com)')
    parser.add_argument('--file', '-f', default='/app/SunoLogs.txt',
                        help='Path to SunoLogs.txt file (default: /app/SunoLogs.txt)')
    args = parser.parse_args()

    log_file = args.file

    if not os.path.exists(log_file):
        print(f"Error: Log file not found: {log_file}")
        print("Copy SunoLogs.txt to the container first:")
        print("  docker cp SunoLogs.txt aiamusic:/app/SunoLogs.txt")
        sys.exit(1)

    app = create_app()
    with app.app_context():
        # Get the user to assign songs to
        user = User.query.filter_by(email=args.user).first()
        if not user:
            print(f"Error: User {args.user} not found")
            print("Available users:")
            for u in User.query.all():
                print(f"  - {u.email} ({u.username})")
            sys.exit(1)

        print(f"Importing songs for user: {user.username} (ID: {user.id})")
        print(f"Reading logs from: {log_file}")
        print()

        # Parse and import
        records = parse_logs(log_file)
        print(f"Found {len(records)} records in log file")
        print()

        imported = 0
        skipped = 0
        failed = 0

        for i, record in enumerate(records, 1):
            print(f"[{i}/{len(records)}] Processing record {record.get('id', 'unknown')}...")

            # Only process successful generations
            if record.get('successFlag') != 200:
                print(f"  Skipping - not successful (flag: {record.get('successFlag')})")
                skipped += 1
                continue

            if record.get('operationType') != 'generate':
                print(f"  Skipping - not a generate operation")
                skipped += 1
                continue

            if import_song(record, user.id):
                imported += 1
            else:
                skipped += 1

        print()
        print("=" * 50)
        print(f"Import complete!")
        print(f"  Imported: {imported}")
        print(f"  Skipped:  {skipped}")
        print(f"  Failed:   {failed}")
        print()

        # Show final counts
        total_songs = Song.query.count()
        total_styles = Style.query.count()
        print(f"Database totals:")
        print(f"  Songs:  {total_songs}")
        print(f"  Styles: {total_styles}")


if __name__ == '__main__':
    main()
