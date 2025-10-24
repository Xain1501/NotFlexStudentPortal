# ============================================
# FILE 3: Backend/website/auth.py
# ============================================
"""
Authentication Routes
Handles login/logout
"""

from flask import Blueprint, request, jsonify, session
from Backend.website.models import UserModel, StudentModel

auth = Blueprint('auth', __name__)

@auth.route('/api/login', methods=['POST'])
def login():
    """
    Student Login
    
    Request Body:
    {
        "username": "23k-0846",
        "password": "password123"
    }
    
    Response:
    {
        "success": true,
        "message": "Login successful",
        "user": {
            "user_id": 1,
            "username": "23k-0846",
            "role": "student",
            "student_id": 1
        }
    }
    """
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        # Validate input
        if not username or not password:
            return jsonify({
                'success': False,
                'message': 'Username and password are required'
            }), 400
        
        # Authenticate user
        user = UserModel.authenticate_user(username, password)
        
        if user and user['role'] == 'student':
            # Get student details
            student = StudentModel.get_student_by_user_id(user['user_id'])
            
            if student:
                # Store in session
                session['user_id'] = user['user_id']
                session['student_id'] = student['student_id']
                session['role'] = user['role']
                
                return jsonify({
                    'success': True,
                    'message': 'Login successful',
                    'user': {
                        'user_id': user['user_id'],
                        'username': user['username'],
                        'role': user['role'],
                        'student_id': student['student_id'],
                        'student_name': f"{student['first_name']} {student['last_name']}"
                    }
                }), 200
        
        # Authentication failed
        return jsonify({
            'success': False,
            'message': 'Invalid username or password'
        }), 401
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500


@auth.route('/api/logout', methods=['POST'])
def logout():
    """
    Logout
    Clears session data
    """
    session.clear()
    return jsonify({
        'success': True,
        'message': 'Logged out successfully'
    }), 200


@auth.route('/api/check-auth', methods=['GET'])
def check_auth():
    """
    Check if user is authenticated
    """
    if 'user_id' in session:
        return jsonify({
            'authenticated': True,
            'user_id': session['user_id'],
            'student_id': session.get('student_id'),
            'role': session.get('role')
        }), 200
    
    return jsonify({
        'authenticated': False
    }), 401

