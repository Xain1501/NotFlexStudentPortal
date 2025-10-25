# ============================================
# FILE 3: Backend/website/auth.py (DEBUGGED VERSION)
# ============================================

from flask import Blueprint, request, jsonify
from Backend.website.models import UserModel, StudentModel, FacultyModel
import jwt
import datetime
from functools import wraps

auth = Blueprint('auth', __name__)
JWT_SECRET = 'CRAWLINGBACKTOYOU'
JWT_ALGORITHM = 'HS256'

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
       
        
        if not token:
            return jsonify({
                'success': False,
                'message': 'Token is missing!'
            }), 401
        
        try:
            # FIX: Check if token exists before calling startswith
            if token and token.startswith('Bearer '):
                token = token[7:]
            
            
            
            # Decode JWT token
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            
            
            # Get user from database
            current_user = UserModel.get_user_by_id(payload['user_id'])
           
            
            if not current_user:
                return jsonify({
                    'success': False,
                    'message': 'User not found!'
                }), 401
                
        except Exception as e:
            print(f" Token error: {e}")
            return jsonify({
                'success': False,
                'message': f'Token verification failed: {str(e)}'
            }), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

@auth.route('/api/login', methods=['POST'])
def login():
    try:
        print("logging in...")
        
        data = request.get_json()
        print(f"LOGIN: Request data: {data}")
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
            
        username = data.get('username')
        password = data.get('password')

        print(f"LOGIN: Username: {username}, Password: {password}")

        if not username or not password:
            return jsonify({
                'success': False,
                'message': 'Username and password are required'
            }), 400
        
        # Authenticate user
        print("LOGIN: Calling authenticate_user...")
        user = UserModel.authenticate_user(username, password)
        print(f" LOGIN: User result: {user}")
        
        if user:
            print(" LOGIN: User authenticated, generating token...")
            # Generate JWT token
            token_payload = {
                'user_id': user['user_id'],
                'username': user['username'],
                'role': user['role'],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }
            
            
            token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
            print(f"LOGIN: Token generated: {token}")

            # Build user response
            user_data = {
                'user_id': user['user_id'],
                'username': user['username'],
                'role': user['role'],
                'email': user['email']
            }
            
            
            if user['role'] == 'student':
                student = StudentModel.get_student_by_user_id(user['user_id'])
                if student:
                    user_data['student_id'] = student['student_id']
                    user_data['name'] = f"{student['first_name']} {student['last_name']}"
            
            elif user['role'] == 'faculty':
                faculty = FacultyModel.get_faculty_by_user_id(user['user_id'])
                if faculty:
                    user_data['faculty_id'] = faculty['faculty_id']  # THIS IS CRITICAL
                    user_data['name'] = f"{faculty['first_name']} {faculty['last_name']}"
            
            token_payload = {
                'user_id': user_data['user_id'],
                'username': user_data['username'],
                'role': user_data['role'],
                'faculty_id': user_data.get('faculty_id'),  # ADD THIS
                'student_id': user_data.get('student_id'),  # ADD THIS
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }
            
            token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
            
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'token': token,
                'user': user_data
            }), 200
        
        
        print("LOGIN: Authentication failed")
        return jsonify({
            'success': False,
            'message': 'Invalid username or password'
        }), 401
        
    except Exception as e:
        print(f"❌ LOGIN ERROR: {e}")
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@auth.route('/api/logout', methods=['POST'])
@token_required
def logout(current_user):
    return jsonify({
        'success': True,
        'message': 'Logged out successfully'
    }), 200

@auth.route('/api/check-auth', methods=['GET'])
@token_required
def check_auth(current_user):
    return jsonify({
        'success': True,
        'authenticated': True,
        'user': {
            'user_id': current_user['user_id'],
            'username': current_user['username'],
            'role': current_user['role']
        }
    }), 200