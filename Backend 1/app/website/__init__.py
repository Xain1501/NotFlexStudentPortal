"""
Flask App Initialization (package initializer)
This module mirrors the existing `init.py` and provides the `create_app` factory
so `from app.website import create_app` works for top-level `main.py`.
"""
from flask import Flask
from flask_cors import CORS
import os

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'sonnadasaikotomoshitanainoyogoodbye')
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 hour

    # allow dev frontend at 5173 to access backend APIs directly
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173"]}}, supports_credentials=True)

    from .auth import auth
    from .views import views
    app.register_blueprint(auth, url_prefix='/')
    app.register_blueprint(views, url_prefix='/')
    return app
