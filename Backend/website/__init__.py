#website folder --> python package
#whatever insides it will run automatically 
# ============================================
# FILE 5: Backend/website/__init__.py
# ============================================
"""
Flask App Initialization
"""

from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    
    # Secret key for sessions
    app.config['SECRET_KEY'] = 'sonnadasaikotomoshitanainoyogoodbye'
    
    # Session configuration
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 hour
    
    # Enable CORS for React frontend
    CORS(app, supports_credentials=True, origins=['http://localhost:5173'])
    
    # Register blueprints
    from .auth import auth
    from .views import views
    
    app.register_blueprint(auth, url_prefix='/')
    app.register_blueprint(views, url_prefix='/')
    
    return app


# ============================================
# FILE 6: main.py
# ============================================
"""
Main Application Entry Point
Run this file to start the server
"""
