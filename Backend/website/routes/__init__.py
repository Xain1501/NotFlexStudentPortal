"""
Routes Package - All API route blueprints
"""

from .student_routes import student_bp
from .faculty_routes import faculty_bp
from .course_routes import course_bp

# Export all blueprints
__all__ = ['student_bp', 'faculty_bp', 'course_bp']