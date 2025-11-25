"""
Authentication Module - JWT Token Management
This file handles JWT tokens and the @token_required decorator
Place this in: website/auth.py
"""

from flask import request, jsonify
from functools import wraps
import jwt
import datetime

# JWT Configuration
JWT_SECRET = 'CRAWLINGBACKTOYOU'
JWT_ALGORITHM = 'HS256'

def token_required(f):
    """
    Decorator to protect routes with JWT authentication
    Usage: @token_required
    """
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
            from website.models import UserModel
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


def generate_token(user_id, username, role):
    """
    Generate JWT token for user
    """
    token_payload = {
        'user_id': user_id,
        'username': username,
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)  # 24 hours expiry
    }
    
    token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token