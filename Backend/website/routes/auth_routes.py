"""
Authentication Routes - Login, Logout, Check Auth endpoints
Place this in: website/routes/auth_routes.py
"""

from flask import Blueprint, request, jsonify
from website.models import UserModel, StudentModel, FacultyModel
from website.auth import token_required, generate_token

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/login', methods=['POST'])
def login():
    """
    Login for ALL users (student, faculty, admin)
    """
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({
                "success": False,
                "message": "Missing username or password"
            }), 400
            
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({
                'success': False,
                'message': 'Username and password are required'
            }), 400
        
        # Authenticate user
        user = UserModel.authenticate_user(username, password)
        
        if user:
            # Generate JWT token
            token = generate_token(user['user_id'], user['username'], user['role'])

            # Build user response data
            user_data = {
                'user_id': user['user_id'],
                'username': user['username'],
                'role': user['role'],
                'email': user['email']
            }
            
            # Add role-specific data
            if user['role'] == 'student':
                student = StudentModel.get_student_by_user_id(user['user_id'])
                if student:
                    user_data['student_id'] = student['student_id']
                    user_data['name'] = f"{student['first_name']} {student['last_name']}"
                    user_data['roll_number'] = student['student_code']
            
            elif user['role'] == 'faculty':
                faculty = FacultyModel.get_faculty_by_user_id(user['user_id'])
                if faculty:
                    user_data['faculty_id'] = faculty['faculty_id']
                    user_data['name'] = f"{faculty['first_name']} {faculty['last_name']}"
                    user_data['employee_id'] = faculty['faculty_code']
            
            elif user['role'] == 'admin':
                user_data['name'] = 'Administrator'
            
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'token': token,
                'user': user_data
            }), 200
        
        # Authentication failed
        return jsonify({
            'success': False,
            'message': 'Invalid username or password'
        }), 401
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500


@auth_bp.route('/api/logout', methods=['POST'])
@token_required
def logout(current_user):
    """Logout user"""
    return jsonify({
        'success': True,
        'message': 'Logged out successfully'
    }), 200


@auth_bp.route('/api/check-auth', methods=['GET'])
@token_required
def check_auth(current_user):
    """Check if user is authenticated"""
    return jsonify({
        'success': True,
        'authenticated': True,
        'user': {
            'user_id': current_user['user_id'],
            'username': current_user['username'],
            'role': current_user['role'],
            'email': current_user.get('email')
        }
    }), 200


@auth_bp.route('/api/debug/users', methods=['GET'])
def debug_users():
    """Debug endpoint to check all users"""
    try:
        query = """
            SELECT u.user_id, u.username, u.role, u.email, 
                   s.student_id, s.student_code, s.first_name as student_name,
                   f.faculty_id, f.faculty_code, f.first_name as faculty_name
            FROM users u
            LEFT JOIN students s ON u.user_id = s.user_id
            LEFT JOIN faculty f ON u.user_id = f.user_id
            ORDER BY u.user_id
        """
        from database.connection import execute_query
        users = execute_query(query)
        
        return jsonify({
            'success': True,
            'users': users
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500