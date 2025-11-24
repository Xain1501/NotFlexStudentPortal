"""
Routes Package - All API route blueprints
Place this in: website/routes/__init__.py
"""

from .auth_routes import auth_bp
from .student_routes import student_bp
from .faculty_routes import faculty_bp
from .course_routes import course_bp
from .admin_routes import admin_bp

# Export all blueprints
__all__ = ['auth_bp', 'student_bp', 'faculty_bp', 'course_bp', 'admin_bp']