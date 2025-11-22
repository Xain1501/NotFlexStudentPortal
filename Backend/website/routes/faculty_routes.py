"""
Faculty Routes - All faculty-related API endpoints
"""

from flask import Blueprint, request, jsonify
from website.models import FacultyModel
from website.auth import token_required

faculty_bp = Blueprint('faculty', __name__)

# ==================== FACULTY DASHBOARD ====================

@faculty_bp.route('/api/faculty/dashboard', methods=['GET'])
@token_required
def get_faculty_dashboard(current_user):
    """Get Faculty Dashboard"""
    if current_user['role'] != 'faculty':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        faculty = FacultyModel.get_faculty_by_user_id(current_user['user_id'])
        
        if not faculty:
            return jsonify({'success': False, 'message': 'Faculty not found'}), 404
        
        faculty_id = faculty['faculty_id']
        courses = FacultyModel.get_teaching_courses(faculty_id)
        
        return jsonify({
            'success': True,
            'data': {
                'faculty': {
                    'name': f"{faculty['first_name']} {faculty['last_name']}",
                    'employee_id': faculty['faculty_code'],
                    'department': faculty['dept_name'],
                    'email': faculty['email'],
                    'phone': faculty['phone'],
                    'status': faculty['status']
                },
                'teaching_courses': courses,
                'announcements': [
                    {'id': 1, 'message': 'Submit midterm marks by next Friday', 'type': 'deadline'},
                    {'id': 2, 'message': 'Department meeting tomorrow at 10 AM', 'type': 'meeting'}
                ]
            }
        }), 200
        
    except Exception as e:
        print(f"Faculty dashboard error: {e}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


# ==================== TEACHING COURSES ====================

@faculty_bp.route('/api/faculty/courses', methods=['GET'])
@token_required
def get_faculty_courses(current_user):
    """Get courses taught by faculty"""
    if current_user['role'] != 'faculty':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        faculty = FacultyModel.get_faculty_by_user_id(current_user['user_id'])
        if not faculty:
            return jsonify({'success': False, 'message': 'Faculty not found'}), 404
        
        courses = FacultyModel.get_teaching_courses(faculty['faculty_id'])
        
        return jsonify({
            'success': True,
            'data': {
                'courses': courses
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@faculty_bp.route('/api/faculty/courses/<int:section_id>/students', methods=['GET'])
@token_required
def get_course_students(current_user, section_id):
    """Get students enrolled in a course section"""
    if current_user['role'] != 'faculty':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        students = FacultyModel.get_course_students(section_id)
        
        return jsonify({
            'success': True,
            'data': {
                'students': students
            }
        }), 200
        
    except Exception as e:
        print(f"Get students error: {e}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


# ==================== ATTENDANCE MANAGEMENT ====================

@faculty_bp.route('/api/faculty/courses/<int:section_id>/attendance', methods=['GET'])
@token_required
def get_course_attendance(current_user, section_id):
    """Get attendance for a course section"""
    if current_user['role'] != 'faculty':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        date = request.args.get('date')
        attendance = FacultyModel.get_course_attendance(section_id, date)
        
        return jsonify({
            'success': True,
            'data': {
                'attendance': attendance,
                'date': date
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@faculty_bp.route('/api/faculty/attendance/mark', methods=['POST'])
@token_required
def mark_attendance(current_user):
    """Mark student attendance"""
    if current_user['role'] != 'faculty':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        data = request.get_json()
        student_id = data.get('student_id')
        section_id = data.get('section_id')
        date = data.get('date')
        status = data.get('status')
        
        if not all([student_id, section_id, date, status]):
            return jsonify({'success': False, 'message': 'All fields are required'}), 400
        
        success = FacultyModel.mark_attendance(student_id, section_id, date, status)
        
        if success:
            return jsonify({'success': True, 'message': 'Attendance marked successfully'}), 200
        else:
            return jsonify({'success': False, 'message': 'Failed to mark attendance'}), 400
            
    except Exception as e:
        print(f"Mark attendance error: {e}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@faculty_bp.route('/api/faculty/attendance/mark-bulk', methods=['POST'])
@token_required
def mark_bulk_attendance(current_user):
    """Mark attendance for multiple students at once"""
    if current_user['role'] != 'faculty':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        data = request.get_json()
        attendance_records = data.get('attendance')
        
        if not attendance_records:
            return jsonify({'success': False, 'message': 'Attendance data is required'}), 400
        
        success = FacultyModel.mark_multiple_attendance(attendance_records)
        
        if success:
            return jsonify({'success': True, 'message': 'Attendance marked successfully for all students'}), 200
        else:
            return jsonify({'success': False, 'message': 'Failed to mark attendance'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


# ==================== MARKS MANAGEMENT ====================

@faculty_bp.route('/api/faculty/marks/upload', methods=['POST'])
@token_required
def upload_marks(current_user):
    """Upload student marks"""
    if current_user['role'] != 'faculty':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        data = request.get_json()
        enrollment_id = data.get('enrollment_id')
        marks_data = data.get('marks')
        
        if not enrollment_id or not marks_data:
            return jsonify({'success': False, 'message': 'Enrollment ID and marks data are required'}), 400
        
        success = FacultyModel.upload_marks(enrollment_id, marks_data)
        
        if success:
            return jsonify({'success': True, 'message': 'Marks uploaded successfully'}), 200
        else:
            return jsonify({'success': False, 'message': 'Failed to upload marks'}), 400
            
    except Exception as e:
        print(f"Marks upload error: {e}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@faculty_bp.route('/api/faculty/marks/<int:section_id>', methods=['GET'])
@token_required
def get_course_marks(current_user, section_id):
    """Get marks for all students in a course section"""
    if current_user['role'] != 'faculty':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        from database.connection import execute_query
        
        query = """
            SELECT 
                s.student_id, s.student_code, s.first_name, s.last_name,
                e.enrollment_id,
                m.quiz_marks, m.assignment1_marks, m.assignment2_marks,
                m.project_marks, m.midterm_marks, m.final_marks,
                m.quiz_total, m.assignment1_total, m.assignment2_total,
                m.project_total, m.midterm_total, m.final_total
            FROM enrollments e
            JOIN students s ON e.student_id = s.student_id
            LEFT JOIN marks m ON e.enrollment_id = m.enrollment_id
            WHERE e.section_id = %s AND e.status = 'enrolled'
            ORDER BY s.first_name, s.last_name
        """
        students_marks = execute_query(query, (section_id,))
        
        return jsonify({
            'success': True,
            'data': {
                'students': students_marks
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


# ==================== LEAVE MANAGEMENT ====================

@faculty_bp.route('/api/faculty/leave/apply', methods=['POST'])
@token_required
def apply_for_leave(current_user):
    """Faculty apply for leave"""
    if current_user['role'] != 'faculty':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        faculty = FacultyModel.get_faculty_by_user_id(current_user['user_id'])
        if not faculty:
            return jsonify({'success': False, 'message': 'Faculty not found'}), 404
        
        data = request.get_json()
        leave_date = data.get('leave_date')
        reason = data.get('reason')
        
        if not all([leave_date, reason]):
            return jsonify({'success': False, 'message': 'Leave date and reason are required'}), 400
        
        success = FacultyModel.apply_for_leave(faculty['faculty_id'], leave_date, reason)
        
        if success:
            return jsonify({'success': True, 'message': 'Leave application submitted successfully'}), 200
        else:
            return jsonify({'success': False, 'message': 'Failed to submit leave application'}), 400
            
    except Exception as e:
        print(f"Leave application error: {e}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@faculty_bp.route('/api/faculty/leaves', methods=['GET'])
@token_required
def get_faculty_leaves(current_user):
    """Get faculty's own leave applications"""
    if current_user['role'] != 'faculty':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        faculty = FacultyModel.get_faculty_by_user_id(current_user['user_id'])
        if not faculty:
            return jsonify({'success': False, 'message': 'Faculty not found'}), 404
        
        leaves = FacultyModel.get_faculty_leaves(faculty['faculty_id'])
        
        return jsonify({
            'success': True,
            'data': {
                'leaves': leaves
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500