"""Comprehensive script to consolidate duplicate styles and remove quotes."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import Style, Song

# Define merge groups: {keep_id: [ids_to_merge_into_it]}
MERGE_GROUPS = {
    # "Create a powerful, futuristic anthem" variants -> keep ID 6 (17 songs)
    6: [15],  # ID 15 has 1 song

    # Jewish EDM pop variations -> keep ID 7 "EDM pop with Jewish dance + TRON" (57 songs)
    # This is the main Matt Dubb style
    7: [3],  # Matt Dubb x TRON Hybrid (8 songs) - essentially same as ID 7

    # Jewish EDM, dance-pop, big-room festival style -> keep ID 10 (42 songs)
    10: [1],  # Classic Matt Dubb EDM (1 song) - very similar to ID 10

    # Jewish EDM pop, uplifting variations -> keep ID 21 (20 songs)
    21: [19],  # ID 19 has 3 songs, nearly identical

    # Meditative EDM with Jewish influence -> keep ID 18 (28 songs)
    18: [12],  # ID 12 has 3 songs, very similar

    # Hip hop / country variations -> keep ID 42 (2 songs)
    42: [38, 39, 40, 41],  # IDs 38-41 each have 1 song
}

# Styles to rename (remove quotes and clean up names)
STYLE_RENAMES = {
    6: "Create a powerful, futuristic anthem with a heroic and cinematic mood",
    10: "Jewish EDM, dance-pop, big-room festival style",
    14: "EDM pop with Jewish melodic influence, intimate and reverent",
}

def main():
    app = create_app()
    with app.app_context():
        print("Starting comprehensive style cleanup...")
        print("=" * 70)

        # First, rename styles to remove quotes
        print("\n1. Removing quotes from style names...")
        for style_id, new_name in STYLE_RENAMES.items():
            style = Style.query.get(style_id)
            if style:
                old_name = style.name
                style.name = new_name
                print(f"   ID {style_id}: '{old_name}' -> '{new_name}'")

        db.session.commit()

        # Process merge groups
        print("\n2. Merging duplicate styles...")
        for keep_id, merge_ids in MERGE_GROUPS.items():
            keep_style = Style.query.get(keep_id)
            if not keep_style:
                print(f"   Warning: Style {keep_id} not found, skipping group")
                continue

            print(f"\n   Keeping '{keep_style.name}' (ID {keep_id}):")

            for merge_id in merge_ids:
                merge_style = Style.query.get(merge_id)
                if not merge_style:
                    print(f"     - Style {merge_id} not found, skipping")
                    continue

                song_count = Song.query.filter_by(style_id=merge_id).count()
                print(f"     - Merging '{merge_style.name}' -> {song_count} songs reassigned")

                # Reassign songs
                Song.query.filter_by(style_id=merge_id).update({'style_id': keep_id})

                # Delete the merged style
                db.session.delete(merge_style)

        db.session.commit()
        print("\n" + "=" * 70)
        print("Cleanup complete!")

        # Show final counts
        print("\n3. Final style list:")
        styles = Style.query.order_by(Style.name).all()
        print(f"\n   Total styles: {len(styles)}\n")

        for s in styles:
            count = Song.query.filter_by(style_id=s.id).count()
            print(f"   {s.id:3d}: {s.name[:60]:60s} ({count:3d} songs)")

if __name__ == '__main__':
    main()
