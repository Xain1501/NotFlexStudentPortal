from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
# from database.connection import get_db_connection  # Not needed - models handle DB
from website.models import UserModel, StudentModel, FacultyModel
import jwt
import datetime
from functools import wraps


auth = Blueprint('auth', __name__)


JWT_SECRET = 'CRAWLINGBACKTOYOU'
JWT_ALGORITHM = 'HS256'

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Get token from Authorization header
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({
                'success': False,
                'message': 'Token is missing!'
            }), 401
        
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
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
                
        except jwt.ExpiredSignatureError:
            return jsonify({
                'success': False,
                'message': 'Token has expired!'
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                'success': False,
                'message': 'Invalid token!'
            }), 401
        except Exception as e:
            return jsonify({
                'success': False,
                'message': 'Token verification failed!'
            }), 401
        
        # Pass current_user to the protected route
        return f(current_user, *args, **kwargs)
    
    return decorated

@auth.route('/api/login', methods=['POST'])
@cross_origin(supports_credentials=True)
def login():
    """
    Login for ALL users (student, faculty, admin)
    
    Request Body:
    {
        "username": "23k-0846",
        "password": "password123"
    }
    
    Response:
    {
        "success": true,
        "message": "Login successful",
        "token": "jwt_token_here",
        "user": {
            "user_id": 1,
            "username": "23k-0846", 
            "role": "student",
            "email": "madiha@university.edu",
            "student_id": 1,
            "name": "Madiha Aslam"
        }
    }
    """
    try:
        data = request.get_json()
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({
                "status": "error",
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
            # Create token payload
            token_payload = {
                'user_id': user['user_id'],
                'username': user['username'],
                'role': user['role'],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)  # 24 hours expiry
            }
            
            # Generate JWT token
            token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

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
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@auth.route('/api/logout', methods=['POST'])
@token_required
def logout(current_user):
    """
    Logout user
    Client should remove the token from storage
    
    Response:
    {
        "success": true,
        "message": "Logged out successfully"
    }
    """
    return jsonify({
        'success': True,
        'message': 'Logged out successfully'
    }), 200

@auth.route('/api/check-auth', methods=['GET'])
@token_required
def check_auth(current_user):
    """
    Check if user is authenticated and return user data
    
    Response:
    {
        "success": true,
        "authenticated": true,
        "user": {
            "user_id": 1,
            "username": "23k-0846",
            "role": "student"
        }
    }
    """
    return jsonify({
        'success': True,
        'authenticated': True,
        'user': {
            'user_id': current_user['user_id'],
            'username': current_user['username'],
            'role': current_user['role']
        }
    }), 200