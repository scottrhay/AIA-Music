from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Style, Song

bp = Blueprint('styles', __name__)


@bp.route('/', methods=['GET'])
@jwt_required()
def get_styles():
    """Get all styles."""
    styles = Style.query.order_by(Style.name).all()
    return jsonify({
        'styles': [style.to_dict() for style in styles],
        'total': len(styles)
    }), 200


@bp.route('/<int:style_id>', methods=['GET'])
@jwt_required()
def get_style(style_id):
    """Get a specific style."""
    style = Style.query.get(style_id)

    if not style:
        return jsonify({'error': 'Style not found'}), 404

    return jsonify({'style': style.to_dict()}), 200


@bp.route('/', methods=['POST'])
@jwt_required()
def create_style():
    """Create a new style."""
    user_id = get_jwt_identity()
    data = request.get_json()

    # Validate required field
    if not data or not data.get('name'):
        return jsonify({'error': 'Style name is required'}), 400

    # Check if style name already exists
    if Style.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'Style name already exists'}), 409

    # Create style
    style = Style(
        name=data['name'],
        style_prompt=data.get('style_prompt', ''),
        created_by=user_id
    )

    try:
        db.session.add(style)
        db.session.commit()
        return jsonify({
            'message': 'Style created successfully',
            'style': style.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:style_id>', methods=['PUT'])
@jwt_required()
def update_style(style_id):
    """Update an existing style."""
    user_id = get_jwt_identity()
    style = Style.query.get(style_id)

    if not style:
        return jsonify({'error': 'Style not found'}), 404

    # Check if user owns this style
    if style.created_by != user_id:
        return jsonify({'error': 'You can only edit styles you created'}), 403

    data = request.get_json()

    # Trim whitespace from name if present
    if 'name' in data:
        data['name'] = data['name'].strip()

    # Check if name is being changed to an existing name
    if 'name' in data and data['name'] != style.name:
        existing_style = Style.query.filter_by(name=data['name']).first()
        if existing_style and existing_style.id != style.id:
            return jsonify({'error': 'Style name already exists'}), 409

    # Update fields
    if 'name' in data:
        style.name = data['name']
    if 'style_prompt' in data:
        style.style_prompt = data['style_prompt']

    try:
        db.session.commit()
        return jsonify({
            'message': 'Style updated successfully',
            'style': style.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:style_id>/songs-count', methods=['GET'])
@jwt_required()
def get_style_songs_count(style_id):
    """Get the count of songs using this style."""
    style = Style.query.get(style_id)

    if not style:
        return jsonify({'error': 'Style not found'}), 404

    count = Song.query.filter_by(style_id=style_id).count()
    return jsonify({'count': count, 'style_id': style_id}), 200


@bp.route('/<int:style_id>', methods=['DELETE'])
@jwt_required()
def delete_style(style_id):
    """Delete a style, optionally reassigning songs to another style."""
    style = Style.query.get(style_id)

    if not style:
        return jsonify({'error': 'Style not found'}), 404

    # Get song count for this style
    songs_count = Song.query.filter_by(style_id=style_id).count()

    # Check if reassignment is needed
    data = request.get_json() or {}
    reassign_to = data.get('reassign_to')

    if songs_count > 0:
        if reassign_to is None:
            # Return info about songs that need reassignment
            return jsonify({
                'error': 'Style has songs that need reassignment',
                'songs_count': songs_count,
                'needs_reassignment': True
            }), 409

        # Validate reassign target
        if reassign_to != 0:  # 0 means set to null/no style
            target_style = Style.query.get(reassign_to)
            if not target_style:
                return jsonify({'error': 'Target style not found'}), 404
            if target_style.id == style_id:
                return jsonify({'error': 'Cannot reassign to the same style'}), 400

        # Reassign all songs
        new_style_id = reassign_to if reassign_to != 0 else None
        Song.query.filter_by(style_id=style_id).update({'style_id': new_style_id})

    try:
        db.session.delete(style)
        db.session.commit()
        return jsonify({
            'message': 'Style deleted successfully',
            'songs_reassigned': songs_count
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
