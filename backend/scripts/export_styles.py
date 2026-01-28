"""Export all styles from database."""
import sys
sys.path.insert(0, '/app')

from app import create_app, db
from app.models import Style

app = create_app()

with app.app_context():
    styles = Style.query.order_by(Style.name).all()

    print("ID,Name,Prompt")
    for style in styles:
        # Escape quotes and newlines for CSV
        name = style.name.replace('"', '""')
        prompt = (style.style_prompt or '').replace('"', '""').replace('\n', ' ')
        print(f'{style.id},"{name}","{prompt[:100]}"')
