from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from werkzeug.middleware.proxy_fix import ProxyFix
from config import config

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()


def create_app(config_name='default'):
    """Application factory pattern."""
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(config[config_name])

    # Disable strict slashes to allow both /endpoint and /endpoint/
    app.url_map.strict_slashes = False

    # Trust proxy headers (Traefik/nginx)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    CORS(app, origins=app.config['CORS_ORIGINS'])

    # Register blueprints
    from app.routes import auth, songs, styles, webhooks

    api_prefix = app.config['API_PREFIX']
    app.register_blueprint(auth.bp, url_prefix=f'{api_prefix}/auth')
    app.register_blueprint(songs.bp, url_prefix=f'{api_prefix}/songs')
    app.register_blueprint(styles.bp, url_prefix=f'{api_prefix}/styles')
    app.register_blueprint(webhooks.bp, url_prefix=f'{api_prefix}/webhooks')

    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'service': 'SunoApp API'}, 200

    return app
