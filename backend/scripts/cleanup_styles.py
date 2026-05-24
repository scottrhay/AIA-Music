"""One-time script to consolidate duplicate styles."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import Style, Song

# Define merge groups: {keep_id: [ids_to_merge_into_it]}
MERGE_GROUPS = {
    # EDM pop with Jewish dance influence variants -> keep ID 7
    7: [25, 26, 34, 37],

    # Jewish EDM, dance-pop, big-room festival style variants -> keep ID 10
    10: [5, 24, 29, 30, 31],

    # EDM pop with Jewish melodic influence variants -> keep ID 14
    14: [23],

    # Meditative EDM with Jewish chant influence variants -> keep ID 18
    18: [22],

    # Contemporary worship pop variants -> keep ID 44
    44: [46],

    # Battle anthem variants -> keep ID 11
    11: [17],
}

# Styles to delete (0 songs, not useful)
DELETE_EMPTY = [46]  # Will be handled by merge

def main():
    app = create_app()
    with app.app_context():
        print("Starting style cleanup...")

        # Process each merge group
        for keep_id, merge_ids in MERGE_GROUPS.items():
            keep_style = Style.query.get(keep_id)
            if not keep_style:
                print(f"  Warning: Style {keep_id} not found, skipping group")
                continue

            print(f"\nMerging into '{keep_style.name}' (ID {keep_id}):")

            for merge_id in merge_ids:
                merge_style = Style.query.get(merge_id)
                if not merge_style:
                    print(f"  - Style {merge_id} not found, skipping")
                    continue

                # Count songs to reassign
                song_count = Song.query.filter_by(style_id=merge_id).count()
                print(f"  - Merging '{merge_style.name}' ({song_count} songs)")

                # Reassign songs
                Song.query.filter_by(style_id=merge_id).update({'style_id': keep_id})

                # Delete the merged style
                db.session.delete(merge_style)

        db.session.commit()
        print("\nCleanup complete!")

        # Show final counts
        styles = Style.query.order_by(Style.name).all()
        print(f"\nRemaining styles: {len(styles)}")
        for s in styles:
            count = Song.query.filter_by(style_id=s.id).count()
            print(f"  {s.id}: {s.name} ({count} songs)")

if __name__ == '__main__':
    main()
