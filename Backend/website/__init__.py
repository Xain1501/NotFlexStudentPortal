"""
Flask App Initialization
Place this in: website/__init__.py
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
    CORS(app, 
         supports_credentials=True, 
         origins=['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5000', 'http://127.0.0.1:5000'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
         allow_headers=['Content-Type', 'Authorization'])
    
    # Register all route blueprints from routes folder
    from website.routes import auth_bp, student_bp, faculty_bp, course_bp, admin_bp
    
    app.register_blueprint(auth_bp, url_prefix='/')
    app.register_blueprint(student_bp, url_prefix='/')
    app.register_blueprint(faculty_bp, url_prefix='/')
    app.register_blueprint(course_bp, url_prefix='/')
    app.register_blueprint(admin_bp, url_prefix='/')
    
    return app