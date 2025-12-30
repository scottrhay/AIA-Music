from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Style

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
        style_prompt=data.get('style_prompt'),
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
    style = Style.query.get(style_id)

    if not style:
        return jsonify({'error': 'Style not found'}), 404

    data = request.get_json()

    # Check if name is being changed to an existing name
    if 'name' in data and data['name'] != style.name:
        if Style.query.filter_by(name=data['name']).first():
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


@bp.route('/<int:style_id>', methods=['DELETE'])
@jwt_required()
def delete_style(style_id):
    """Delete a style."""
    style = Style.query.get(style_id)

    if not style:
        return jsonify({'error': 'Style not found'}), 404

    # Check if style is being used by any songs
    if style.songs.count() > 0:
        return jsonify({
            'error': 'Cannot delete style that is being used by songs',
            'songs_count': style.songs.count()
        }), 409

    try:
        db.session.delete(style)
        db.session.commit()
        return jsonify({'message': 'Style deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
