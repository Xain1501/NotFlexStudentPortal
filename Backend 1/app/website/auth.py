"""
COMPLETE AUTH.PY - Fixed CORS duplication
"""

from flask import Blueprint, request, jsonify
from .models import UserModel
import jwt
import datetime
from functools import wraps
from app.database.connection import execute_query

auth = Blueprint('auth', __name__)

# JWT Secret Key - CHANGE THIS IN PRODUCTION!
SECRET_KEY = 'your-secret-key-change-in-production'

def generate_token(user_id, username, role):
    """Generate JWT token"""
    payload = {
        'user_id': user_id,
        'username': username,
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def token_required(f):
    """Token verification decorator with enhanced error handling"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                if auth_header.startswith('Bearer '):
                    token = auth_header.split(' ')[1]
            except Exception:
                token = None
        
        if not token:
            return jsonify({
                'success': False,
                'message': 'Token is missing!',
                'error_code': 'TOKEN_MISSING'
            }), 401
        
        try:
            # Decode token
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_user = {
                'user_id': data['user_id'],
                'username': data['username'],
                'role': data['role']
            }
        except jwt.ExpiredSignatureError:
            return jsonify({
                'success': False,
                'message': 'Token has expired!',
                'error_code': 'TOKEN_EXPIRED'
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                'success': False,
                'message': 'Invalid token!',
                'error_code': 'TOKEN_INVALID'
            }), 401
        except Exception as e:
            return jsonify({
                'success': False,
                'message': 'Token verification failed',
                'error_code': 'TOKEN_VERIFICATION_FAILED'
            }), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

# SIMPLE OPTIONS HANDLER - NO duplication
@auth.route('/api/auth/login', methods=['OPTIONS'])
@auth.route('/api/auth/register', methods=['OPTIONS'])
@auth.route('/api/auth/logout', methods=['OPTIONS'])
def handle_options():
    """Handle OPTIONS requests for all auth endpoints"""
    return '', 200

# MAIN LOGIN ENDPOINT - Only one definition
@auth.route('/api/auth/login', methods=['POST'])
def login():
    """User login with enhanced response messages"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided in request'
            }), 400
        
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        if not username:
            return jsonify({
                'success': False,
                'message': 'Username is required'
            }), 400
        
        if not password:
            return jsonify({
                'success': False,
                'message': 'Password is required'
            }), 400
        
        # Authenticate user
        user = UserModel.authenticate_user(username, password)
        
        if user:
            # Generate JWT token
            token = generate_token(user['user_id'], user['username'], user['role'])
            
            return jsonify({
                'success': True,
                'message': 'Login successful!',
                'data': {
                    'token': token,
                    'user': {
                        'user_id': user['user_id'],
                        'username': user['username'],
                        'email': user['email'],
                        'role': user['role']
                    }
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Invalid username or password',
                'error_code': 'INVALID_CREDENTIALS'
            }), 401
            
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({
            'success': False,
            'message': 'Internal server error during login'
        }), 500

@auth.route('/api/auth/register', methods=['POST'])
def register():
    """User registration - Enhanced for frontend"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No registration data provided'
            }), 400
        
        required_fields = ['username', 'password', 'email', 'role']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'message': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Check if username already exists
        existing_user = UserModel.get_user_by_username(data['username'])
        if existing_user:
            return jsonify({
                'success': False,
                'message': 'Username already exists'
            }), 400
        
        # Check if email already exists
        existing_email = execute_query(
            "SELECT user_id FROM users WHERE email = %s", 
            (data['email'],)
        )
        if existing_email:
            return jsonify({
                'success': False,
                'message': 'Email already registered'
            }), 400
        
        # Create user
        user_data = {
            'username': data['username'],
            'password_hash': data['password'],  # In production, hash this!
            'email': data['email'],
            'role': data['role']
        }
        
        profile_data = {}
        
        success, result = UserModel.create_user_with_profile(user_data, profile_data)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Registration successful!',
                'data': {
                    'user_id': result.get('user_id'),
                    'generated_password': result.get('password')  # If auto-generated
                }
            }), 201
        else:
            return jsonify({
                'success': False,
                'message': result.get('message', 'Registration failed')
            }), 400
            
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({
            'success': False,
            'message': 'Internal server error during registration'
        }), 500

@auth.route('/api/auth/verify', methods=['GET'])
@token_required
def verify_token(current_user):
    """Verify token validity"""
    return jsonify({
        'success': True,
        'message': 'Token is valid',
        'data': {
            'user': current_user
        }
    }), 200

@auth.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Get current user profile"""
    try:
        user_id = current_user['user_id']
        user = UserModel.get_user_by_id(user_id)
        
        if user:
            return jsonify({
                'success': True,
                'data': {
                    'user': {
                        'user_id': user['user_id'],
                        'username': user['username'],
                        'email': user['email'],
                        'role': user['role'],
                        'is_active': user.get('is_active', True)
                    }
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error fetching user profile'
        }), 500

@auth.route('/api/auth/logout', methods=['POST'])
@token_required
def logout(current_user):
    """Logout endpoint (client should remove token)"""
    return jsonify({
        'success': True,
        'message': 'Logout successful'
    }), 200

