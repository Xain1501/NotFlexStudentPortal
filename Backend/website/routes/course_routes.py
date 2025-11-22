"""
Course Routes - All course-related API endpoints (shared between roles)
"""

from flask import Blueprint, request, jsonify
from website.models import StudentModel, CourseModel
from website.auth import token_required

course_bp = Blueprint('course', __name__)

# ==================== AVAILABLE COURSES ====================

@course_bp.route('/api/courses/available', methods=['GET'])
@token_required
def get_available_courses(current_user):
    """Get Available Courses for Registration"""
    try:
        semester = request.args.get('semester', 'Fall')
        year = request.args.get('year', '2024')
        
        courses = CourseModel.get_available_courses(semester, year)
        
        return jsonify({
            'success': True,
            'data': {
                'courses': courses
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@course_bp.route('/api/courses/check-seats', methods=['GET'])
@token_required
def check_course_seats(current_user):
    """Check available seats in a course section"""
    try:
        section_id = request.args.get('section_id')
        
        if not section_id:
            return jsonify({'success': False, 'message': 'Section ID is required'}), 400
        
        seats_info = CourseModel.check_seats_available(section_id)
        
        return jsonify({
            'success': True,
            'data': seats_info
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


# ==================== COURSE ENROLLMENT (Student) ====================

@course_bp.route('/api/courses/enroll', methods=['POST'])
@token_required
def enroll_course(current_user):
    """Enroll in a Course (Students only)"""
    if current_user['role'] != 'student':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        student = StudentModel.get_student_by_user_id(current_user['user_id'])
        if not student:
            return jsonify({'success': False, 'message': 'Student profile not found'}), 404
        
        student_id = student['student_id']
        data = request.get_json()
        section_id = data.get('section_id')
        
        if not section_id:
            return jsonify({'success': False, 'message': 'Section ID is required'}), 400
        
        # Check seat availability
        seats_info = CourseModel.check_seats_available(section_id)
        if not seats_info or seats_info.get('seats_available', 0) <= 0:
            return jsonify({'success': False, 'message': 'Course is full'}), 400
        
        success = CourseModel.enroll_student(student_id, section_id)
        
        if success:
            return jsonify({'success': True, 'message': 'Enrolled successfully'}), 200
        else:
            return jsonify({'success': False, 'message': 'Enrollment failed - may already be enrolled'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@course_bp.route('/api/courses/drop', methods=['POST'])
@token_required
def drop_course(current_user):
    """Drop a Course (Students only)"""
    if current_user['role'] != 'student':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        student = StudentModel.get_student_by_user_id(current_user['user_id'])
        if not student:
            return jsonify({'success': False, 'message': 'Student profile not found'}), 404
        
        student_id = student['student_id']
        data = request.get_json()
        section_id = data.get('section_id')
        
        if not section_id:
            return jsonify({'success': False, 'message': 'Section ID is required'}), 400
        
        success = CourseModel.drop_course(student_id, section_id)
        
        if success:
            return jsonify({'success': True, 'message': 'Course dropped successfully'}), 200
        else:
            return jsonify({'success': False, 'message': 'Drop failed'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


# ==================== COURSE DETAILS ====================

@course_bp.route('/api/courses/<int:section_id>', methods=['GET'])
@token_required
def get_course_details(current_user, section_id):
    """Get detailed information about a course section"""
    try:
        from database.connection import execute_query
        
        query = """
            SELECT 
                cs.section_id,
                c.course_id,
                c.course_code,
                c.course_name,
                c.credits,
                cs.section_code,
                cs.semester,
                cs.year,
                cs.schedule,
                cs.room,
                cs.max_capacity,
                CONCAT(f.first_name, ' ', f.last_name) as faculty_name,
                f.faculty_code,
                COUNT(e.enrollment_id) as enrolled_count,
                (cs.max_capacity - COUNT(e.enrollment_id)) as seats_available
            FROM course_sections cs
            JOIN courses c ON cs.course_id = c.course_id
            JOIN faculty f ON cs.faculty_id = f.faculty_id
            LEFT JOIN enrollments e ON cs.section_id = e.section_id AND e.status = 'enrolled'
            WHERE cs.section_id = %s
            GROUP BY cs.section_id
        """
        result = execute_query(query, (section_id,))
        
        if not result:
            return jsonify({'success': False, 'message': 'Course section not found'}), 404
        
        return jsonify({
            'success': True,
            'data': result[0]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@course_bp.route('/api/courses/all', methods=['GET'])
@token_required
def get_all_courses(current_user):
    """Get all courses with sections"""
    try:
        from database.connection import execute_query
        
        query = """
            SELECT 
                cs.section_id,
                c.course_id,
                c.course_code,
                c.course_name,
                c.credits,
                cs.section_code,
                cs.semester,
                cs.year,
                cs.schedule,
                cs.room,
                cs.max_capacity,
                CONCAT(f.first_name, ' ', f.last_name) as faculty_name,
                COUNT(e.enrollment_id) as enrolled_count
            FROM course_sections cs
            JOIN courses c ON cs.course_id = c.course_id
            JOIN faculty f ON cs.faculty_id = f.faculty_id
            LEFT JOIN enrollments e ON cs.section_id = e.section_id AND e.status = 'enrolled'
            GROUP BY cs.section_id
            ORDER BY c.course_code, cs.section_code
        """
        courses = execute_query(query)
        
        return jsonify({
            'success': True,
            'data': {
                'courses': courses
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


# ==================== COURSE SEARCH ====================

@course_bp.route('/api/courses/search', methods=['GET'])
@token_required
def search_courses(current_user):
    """Search courses by code or name"""
    try:
        from database.connection import execute_query
        
        search_term = request.args.get('q', '')
        semester = request.args.get('semester')
        year = request.args.get('year')
        
        query = """
            SELECT 
                cs.section_id,
                c.course_code,
                c.course_name,
                c.credits,
                cs.section_code,
                cs.semester,
                cs.year,
                cs.schedule,
                cs.room,
                CONCAT(f.first_name, ' ', f.last_name) as faculty_name,
                (cs.max_capacity - COUNT(e.enrollment_id)) as seats_available
            FROM course_sections cs
            JOIN courses c ON cs.course_id = c.course_id
            JOIN faculty f ON cs.faculty_id = f.faculty_id
            LEFT JOIN enrollments e ON cs.section_id = e.section_id AND e.status = 'enrolled'
            WHERE (c.course_code LIKE %s OR c.course_name LIKE %s)
        """
        params = [f'%{search_term}%', f'%{search_term}%']
        
        if semester:
            query += " AND cs.semester = %s"
            params.append(semester)
        if year:
            query += " AND cs.year = %s"
            params.append(year)
        
        query += " GROUP BY cs.section_id ORDER BY c.course_code"
        
        courses = execute_query(query, params)
        
        return jsonify({
            'success': True,
            'data': {
                'courses': courses
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500