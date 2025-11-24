"""
Admin Routes - All admin-related API endpoints
"""

from flask import Blueprint, request, jsonify
from website.models import StudentModel, FacultyModel, CourseModel, UserModel, AdminModel, DepartmentModel
from website.auth import token_required
from database.connection import execute_query

admin_bp = Blueprint('admin', __name__)

# ==================== ADMIN DASHBOARD ====================

@admin_bp.route('/api/admin/dashboard', methods=['GET'])
@token_required
def get_admin_dashboard(current_user):
    """Get Admin Dashboard Data"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied - Admin only'}), 403
    
    try:
        students_query = "SELECT COUNT(*) as count FROM students WHERE status = 'active'"
        faculty_query = "SELECT COUNT(*) as count FROM faculty WHERE status = 'active'"
        courses_query = "SELECT COUNT(*) as count FROM courses"
        fees_query = "SELECT COUNT(*) as count FROM fee_details WHERE status = 'pending'"
        
        total_students = execute_query(students_query)[0]['count']
        total_faculty = execute_query(faculty_query)[0]['count']
        total_courses = execute_query(courses_query)[0]['count']
        pending_fees = execute_query(fees_query)[0]['count']
        
        stats = {
            'total_students': total_students,
            'total_faculty': total_faculty,
            'total_courses': total_courses,
            'pending_fees': pending_fees
        }
        
        return jsonify({
            'success': True,
            'data': {
                'stats': stats,
                'recent_activity': [
                    {'type': 'system', 'message': 'Admin dashboard accessed'},
                    {'type': 'users', 'message': f'Total students: {total_students}'}
                ]
            }
        }), 200
        
    except Exception as e:
        print(f"Admin dashboard error: {e}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


# ==================== USER MANAGEMENT ====================

@admin_bp.route('/api/admin/users', methods=['GET'])
@token_required
def get_all_users(current_user):
    """Get all users for admin"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        query = """
            SELECT u.*, 
                s.student_id, s.student_code, s.first_name as student_first_name, s.last_name as student_last_name,
                f.faculty_id, f.faculty_code, f.first_name as faculty_first_name, f.last_name as faculty_last_name
            FROM users u
            LEFT JOIN students s ON u.user_id = s.user_id
            LEFT JOIN faculty f ON u.user_id = f.user_id
            ORDER BY u.created_at DESC
        """
        users = execute_query(query)
        
        return jsonify({
            'success': True,
            'data': {
                'users': users
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@token_required
def delete_user(current_user, user_id):
    """Delete user"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        if user_id == current_user['user_id']:
            return jsonify({'success': False, 'message': 'Cannot delete your own account'}), 400
        
        delete_query = "DELETE FROM users WHERE user_id = %s"
        execute_query(delete_query, (user_id,), fetch=False)
        
        return jsonify({
            'success': True,
            'message': 'User deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/users/<int:user_id>/toggle-status', methods=['PUT'])
@token_required
def toggle_user_status(current_user, user_id):
    """Activate/Deactivate user"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        current_query = "SELECT is_active FROM users WHERE user_id = %s"
        current_status = execute_query(current_query, (user_id,))[0]['is_active']
        
        new_status = not current_status
        update_query = "UPDATE users SET is_active = %s WHERE user_id = %s"
        execute_query(update_query, (new_status, user_id), fetch=False)
        
        return jsonify({
            'success': True,
            'message': f'User {"activated" if new_status else "deactivated"} successfully',
            'is_active': new_status
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


# ==================== STUDENT MANAGEMENT ====================

@admin_bp.route('/api/admin/students', methods=['GET'])
@token_required
def get_all_students_admin(current_user):
    """Get all students for admin management"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        students = StudentModel.get_all_students_for_admin()
        
        return jsonify({
            'success': True,
            'data': {
                'students': students
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/students/<int:student_id>', methods=['GET'])
@token_required
def get_student_details_admin(current_user, student_id):
    """Get detailed student information"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        student = StudentModel.get_student_by_id(student_id)
        
        if not student:
            return jsonify({'success': False, 'message': 'Student not found'}), 404
        
        enrollments = CourseModel.get_student_enrollments(student_id)
        fees = StudentModel.get_fee_details(student_id)
        attendance = StudentModel.get_attendance_summary(student_id)
        
        return jsonify({
            'success': True,
            'data': {
                'student': student,
                'enrollments': enrollments,
                'fees': fees,
                'attendance': attendance
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/students', methods=['POST'])
@token_required
def create_student_admin(current_user):
    """Create new student"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        data = request.get_json()
        
        required_fields = ['student_code', 'first_name', 'last_name', 'email', 'major_dept_id']
        if not all(field in data for field in required_fields):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
        user_data = {
            'username': data['student_code'],
            'password_hash': 'password123',
            'email': data['email'],
            'role': 'student'
        }
        
        profile_data = {
            'student_code': data['student_code'],
            'first_name': data['first_name'],
            'last_name': data['last_name'],
            'date_of_birth': data.get('date_of_birth'),
            'phone': data.get('phone'),
            'cnic': data.get('cnic'),
            'major_dept_id': data['major_dept_id'],
            'current_semester': data.get('current_semester', 1)
        }
        
        success, message = UserModel.create_user_with_profile(user_data, profile_data)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Student created successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': message
            }), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/students/<int:student_id>', methods=['PUT'])
@token_required
def update_student_admin(current_user, student_id):
    """Update student information"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        data = request.get_json()
        
        allowed_fields = ['first_name', 'last_name', 'date_of_birth', 'phone', 'cnic', 
                         'current_semester', 'major_dept_id', 'status']
        
        update_data = {key: data[key] for key in allowed_fields if key in data}
        
        if not update_data:
            return jsonify({'success': False, 'message': 'No valid fields to update'}), 400
        
        success = StudentModel.update_student(student_id, update_data)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Student updated successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to update student'
            }), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/students/<int:student_id>', methods=['DELETE'])
@token_required
def delete_student_admin(current_user, student_id):
    """Delete student"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        student = StudentModel.get_student_by_id(student_id)
        if not student:
            return jsonify({'success': False, 'message': 'Student not found'}), 404
        
        delete_query = "DELETE FROM users WHERE user_id = %s"
        execute_query(delete_query, (student['user_id'],), fetch=False)
        
        return jsonify({
            'success': True,
            'message': 'Student deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/students/<int:student_id>/toggle-status', methods=['PUT'])
@token_required
def toggle_student_status(current_user, student_id):
    """Activate/Deactivate student"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        student = StudentModel.get_student_by_id(student_id)
        if not student:
            return jsonify({'success': False, 'message': 'Student not found'}), 404
        
        new_status = 'active' if student['status'] != 'active' else 'inactive'
        success = StudentModel.update_student(student_id, {'status': new_status})
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Student {new_status} successfully',
                'status': new_status
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to update student status'
            }), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


# ==================== FACULTY MANAGEMENT ====================

@admin_bp.route('/api/admin/faculty', methods=['GET'])
@token_required
def get_all_faculty_admin(current_user):
    """Get all faculty for admin management"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        faculty = FacultyModel.get_all_faculty_for_admin()
        
        return jsonify({
            'success': True,
            'data': {
                'faculty': faculty
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/faculty/<int:faculty_id>', methods=['GET'])
@token_required
def get_faculty_details_admin(current_user, faculty_id):
    """Get detailed faculty information"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        faculty = FacultyModel.get_faculty_by_id(faculty_id)
        
        if not faculty:
            return jsonify({'success': False, 'message': 'Faculty not found'}), 404
        
        courses = FacultyModel.get_teaching_courses(faculty_id)
        leaves = FacultyModel.get_faculty_leaves(faculty_id)
        
        return jsonify({
            'success': True,
            'data': {
                'faculty': faculty,
                'teaching_courses': courses,
                'leaves': leaves
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/faculty', methods=['POST'])
@token_required
def create_faculty_admin(current_user):
    """Create new faculty"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        data = request.get_json()
        
        required_fields = ['faculty_code', 'first_name', 'last_name', 'email', 'department_id']
        if not all(field in data for field in required_fields):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
        user_data = {
            'username': data['faculty_code'],
            'password_hash': 'password123',
            'email': data['email'],
            'role': 'faculty'
        }
        
        profile_data = {
            'faculty_code': data['faculty_code'],
            'first_name': data['first_name'],
            'last_name': data['last_name'],
            'phone': data.get('phone'),
            'department_id': data['department_id'],
            'salary': data.get('salary', 100000)
        }
        
        success, message = UserModel.create_user_with_profile(user_data, profile_data)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Faculty created successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': message
            }), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/faculty/<int:faculty_id>', methods=['PUT'])
@token_required
def update_faculty_admin(current_user, faculty_id):
    """Update faculty information"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        data = request.get_json()
        
        allowed_fields = ['first_name', 'last_name', 'phone', 'salary', 'department_id', 'status']
        update_data = {key: data[key] for key in allowed_fields if key in data}
        
        if not update_data:
            return jsonify({'success': False, 'message': 'No valid fields to update'}), 400
        
        success = FacultyModel.update_faculty(faculty_id, update_data)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Faculty updated successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to update faculty'
            }), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/faculty/<int:faculty_id>', methods=['DELETE'])
@token_required
def delete_faculty_admin(current_user, faculty_id):
    """Delete faculty"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        faculty = FacultyModel.get_faculty_by_id(faculty_id)
        if not faculty:
            return jsonify({'success': False, 'message': 'Faculty not found'}), 404
        
        delete_query = "DELETE FROM users WHERE user_id = %s"
        execute_query(delete_query, (faculty['user_id'],), fetch=False)
        
        return jsonify({
            'success': True,
            'message': 'Faculty deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/faculty/<int:faculty_id>/toggle-status', methods=['PUT'])
@token_required
def toggle_faculty_status(current_user, faculty_id):
    """Activate/Deactivate faculty"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        faculty = FacultyModel.get_faculty_by_id(faculty_id)
        if not faculty:
            return jsonify({'success': False, 'message': 'Faculty not found'}), 404
        
        new_status = 'active' if faculty['status'] != 'active' else 'inactive'
        success = FacultyModel.update_faculty(faculty_id, {'status': new_status})
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Faculty {new_status} successfully',
                'status': new_status
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to update faculty status'
            }), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


# ==================== DEPARTMENT MANAGEMENT ====================

@admin_bp.route('/api/admin/departments', methods=['GET'])
@token_required
def get_all_departments(current_user):
    """Get all departments"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        departments = DepartmentModel.get_all_departments()
        
        return jsonify({
            'success': True,
            'data': {
                'departments': departments
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/departments', methods=['POST'])
@token_required
def create_department(current_user):
    """Create new department"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        data = request.get_json()
        dept_code = data.get('dept_code')
        dept_name = data.get('dept_name')
        
        if not dept_code or not dept_name:
            return jsonify({'success': False, 'message': 'Department code and name are required'}), 400
        
        success = DepartmentModel.create_department(dept_code, dept_name)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Department created successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to create department'
            }), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


# ==================== FEE MANAGEMENT ====================

@admin_bp.route('/api/admin/fees', methods=['GET'])
@token_required
def get_all_fees(current_user):
    """Get all fee details for admin"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        query = """
            SELECT f.*, s.student_code, s.first_name, s.last_name
            FROM fee_details f
            JOIN students s ON f.student_id = s.student_id
            ORDER BY f.due_date DESC
        """
        fees = execute_query(query)
        
        return jsonify({
            'success': True,
            'data': {
                'fees': fees
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/fees', methods=['POST'])
@token_required
def add_fee_record(current_user):
    """Add new fee record for student"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        data = request.get_json()
        student_id = data.get('student_id')
        semester = data.get('semester')
        tuition_fee = data.get('tuition_fee', 0)
        lab_fee = data.get('lab_fee', 0)
        miscellaneous_fee = data.get('miscellaneous_fee', 0)
        due_date = data.get('due_date')
        
        if not all([student_id, semester, due_date]):
            return jsonify({'success': False, 'message': 'Student ID, semester and due date are required'}), 400
        
        success = StudentModel.add_fee_record(student_id, semester, tuition_fee, lab_fee, miscellaneous_fee, due_date)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Fee record added successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to add fee record'
            }), 400
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/fees/<int:fee_id>/mark-paid', methods=['PUT'])
@token_required
def mark_fee_paid(current_user, fee_id):
    """Mark fee as paid"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        success = StudentModel.mark_fee_paid(fee_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Fee marked as paid successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to mark fee as paid'
            }), 400
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/fees/breakdown', methods=['GET'])
@token_required
def get_fee_breakdown(current_user):
    """Get fee breakdown for admin"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        fees = StudentModel.get_all_fee_details()
        
        return jsonify({
            'success': True,
            'data': {
                'fees': fees
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


# ==================== LEAVE MANAGEMENT ====================

@admin_bp.route('/api/admin/leaves', methods=['GET'])
@token_required
def get_all_leaves(current_user):
    """Get all faculty leave requests"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        query = """
            SELECT l.*, f.faculty_code, f.first_name, f.last_name
            FROM faculty_leaves l
            JOIN faculty f ON l.faculty_id = f.faculty_id
            ORDER BY l.applied_at DESC
        """
        leaves = execute_query(query)
        
        return jsonify({
            'success': True,
            'data': {
                'leaves': leaves
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/leaves/pending', methods=['GET'])
@token_required
def get_pending_leaves(current_user):
    """Get all pending leave requests"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        query = """
            SELECT 
                fl.leave_id,
                fl.faculty_id,
                f.faculty_code,
                CONCAT(f.first_name, ' ', f.last_name) as faculty_name,
                d.dept_name,
                fl.leave_date,
                fl.reason,
                fl.status,
                fl.applied_at
            FROM faculty_leaves fl
            JOIN faculty f ON fl.faculty_id = f.faculty_id
            JOIN departments d ON f.department_id = d.dept_id
            WHERE fl.status = 'pending'
            ORDER BY fl.applied_at DESC
        """
        leaves = execute_query(query)
        
        return jsonify({
            'success': True,
            'leaves': leaves
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/leaves/<int:leave_id>/<action>', methods=['PUT'])
@token_required
def update_leave_status(current_user, leave_id, action):
    """Approve or reject faculty leave"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        if action not in ['approve', 'reject']:
            return jsonify({'success': False, 'message': 'Invalid action'}), 400
        
        status = 'approved' if action == 'approve' else 'rejected'
        query = "UPDATE faculty_leaves SET status = %s WHERE leave_id = %s"
        execute_query(query, (status, leave_id), fetch=False)
        
        return jsonify({
            'success': True,
            'message': f'Leave {action}d successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


# ==================== FACULTY ATTENDANCE ====================

@admin_bp.route('/api/admin/faculty-attendance/mark', methods=['POST'])
@token_required
def mark_faculty_attendance(current_user):
    """Mark faculty attendance"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        data = request.get_json()
        faculty_id = data.get('faculty_id')
        date = data.get('date')
        session = data.get('session')
        status = data.get('status')
        
        if not all([faculty_id, date, session, status]):
            return jsonify({'success': False, 'message': 'All fields are required'}), 400
        
        success = AdminModel.mark_faculty_attendance(
            faculty_id, date, session, status, current_user['user_id']
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Faculty attendance marked successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to mark attendance'
            }), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/faculty-attendance/bulk', methods=['POST'])
@token_required
def mark_bulk_faculty_attendance(current_user):
    """Mark attendance for multiple faculty at once"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        data = request.get_json()
        attendance_date = data.get('date')
        session = data.get('session')
        attendance_data = data.get('attendance', [])
        
        if not attendance_date or not session:
            return jsonify({'success': False, 'message': 'Date and session are required'}), 400
        
        for record in attendance_data:
            faculty_id = record['faculty_id']
            status = record['status']
            
            AdminModel.mark_faculty_attendance(
                faculty_id, attendance_date, session, status, current_user['user_id']
            )
        
        return jsonify({
            'success': True,
            'message': f'Attendance marked for {len(attendance_data)} faculty members'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/faculty-attendance/<date>', methods=['GET'])
@token_required
def get_faculty_attendance(current_user, date):
    """Get faculty attendance for a specific date"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        attendance = AdminModel.get_faculty_attendance_by_date(date)
        
        return jsonify({
            'success': True,
            'data': {
                'attendance': attendance
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/faculty-attendance/summary', methods=['GET'])
@token_required
def get_faculty_attendance_summary(current_user):
    """Get faculty attendance summary"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        summary = AdminModel.get_faculty_attendance_summary()
        
        return jsonify({
            'success': True,
            'summary': summary
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


# ==================== COURSE MANAGEMENT ====================

@admin_bp.route('/api/admin/courses', methods=['GET'])
@token_required
def get_all_courses_admin(current_user):
    """Get all courses with details"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        courses = AdminModel.get_all_courses_with_details()
        
        return jsonify({
            'success': True,
            'data': {
                'courses': courses
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/courses/<int:section_id>/students', methods=['GET'])
@token_required
def get_course_students_admin(current_user, section_id):
    """Get students in a course section"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        query = """
            SELECT s.student_id, s.student_code, s.first_name, s.last_name,
                   e.enrollment_id, e.enrollment_date, e.status
            FROM enrollments e
            JOIN students s ON e.student_id = s.student_id
            WHERE e.section_id = %s
            ORDER BY s.first_name, s.last_name
        """
        students = execute_query(query, (section_id,))
        
        return jsonify({
            'success': True,
            'data': {
                'students': students
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/course-management/students', methods=['GET'])
@token_required
def get_all_students_courses_admin(current_user):
    """Get all students with their course enrollments"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        students = StudentModel.get_all_students_for_admin()
        
        for student in students:
            enrollments = CourseModel.get_student_enrollments(student['student_id'])
            student['enrollments'] = enrollments
        
        return jsonify({
            'success': True,
            'data': {
                'students': students
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/course-management/enroll', methods=['POST'])
@token_required
def admin_enroll_student(current_user):
    """Admin enrolls student in course"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        data = request.get_json()
        student_id = data.get('student_id')
        section_id = data.get('section_id')
        
        if not student_id or not section_id:
            return jsonify({'success': False, 'message': 'Student ID and Section ID are required'}), 400
        
        check_query = "SELECT * FROM enrollments WHERE student_id = %s AND section_id = %s AND status = 'enrolled'"
        existing = execute_query(check_query, (student_id, section_id))
        
        if existing:
            return jsonify({'success': False, 'message': 'Student is already enrolled in this course'}), 400
        
        seats_info = CourseModel.check_seats_available(section_id)
        if not seats_info or seats_info['seats_available'] <= 0:
            return jsonify({'success': False, 'message': 'Course is full'}), 400
        
        enroll_query = """
            INSERT INTO enrollments (student_id, section_id, enrollment_date, status)
            VALUES (%s, %s, CURDATE(), 'enrolled')
        """
        execute_query(enroll_query, (student_id, section_id), fetch=False)
        
        return jsonify({
            'success': True,
            'message': 'Student enrolled successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/course-management/drop', methods=['POST'])
@token_required
def admin_drop_student(current_user):
    """Admin drops student from course"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        data = request.get_json()
        enrollment_id = data.get('enrollment_id')
        
        if not enrollment_id:
            return jsonify({'success': False, 'message': 'Enrollment ID is required'}), 400
        
        drop_query = "UPDATE enrollments SET status = 'dropped' WHERE enrollment_id = %s"
        execute_query(drop_query, (enrollment_id,), fetch=False)
        
        return jsonify({
            'success': True,
            'message': 'Student dropped from course successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


# ==================== REGISTRATION PERIOD ====================

@admin_bp.route('/api/admin/registration-period', methods=['POST'])
@token_required
def set_registration_period(current_user):
    """Set course registration period"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        data = request.get_json()
        semester = data.get('semester')
        year = data.get('year')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        is_active = data.get('is_active', True)
        
        if not all([semester, year, start_date, end_date]):
            return jsonify({'success': False, 'message': 'All fields are required'}), 400
        
        query = """
            INSERT INTO registration_periods (semester, year, start_date, end_date, is_active)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
            start_date = %s, end_date = %s, is_active = %s
        """
        execute_query(query, (semester, year, start_date, end_date, is_active, 
                             start_date, end_date, is_active), fetch=False)
        
        return jsonify({
            'success': True,
            'message': f'Registration period for {semester} {year} set successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/registration-period/current', methods=['GET'])
def get_current_registration_period():
    """Get current active registration period"""
    try:
        query = "SELECT * FROM registration_periods WHERE is_active = TRUE LIMIT 1"
        result = execute_query(query)
        
        if result:
            return jsonify({
                'success': True,
                'data': result[0]
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'No active registration period'
            }), 404
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


# ==================== ANNOUNCEMENTS ====================

@admin_bp.route('/api/admin/announcements', methods=['GET'])
@token_required
def get_admin_announcements(current_user):
    """Get all admin announcements"""
    try:
        query = """
            SELECT a.*, u.username as created_by_name
            FROM admin_announcements a
            JOIN users u ON a.created_by = u.user_id
            WHERE a.is_active = TRUE
            ORDER BY a.created_at DESC
        """
        announcements = execute_query(query)
        
        return jsonify({
            'success': True,
            'data': {
                'announcements': announcements
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/announcements', methods=['POST'])
@token_required
def create_admin_announcement(current_user):
    """Create new admin announcement"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        data = request.get_json()
        title = data.get('title')
        message = data.get('message')
        announcement_type = data.get('type', 'general')
        
        if not title or not message:
            return jsonify({'success': False, 'message': 'Title and message are required'}), 400
        
        query = """
            INSERT INTO admin_announcements (title, message, type, created_by)
            VALUES (%s, %s, %s, %s)
        """
        execute_query(query, (title, message, announcement_type, current_user['user_id']), fetch=False)
        
        return jsonify({
            'success': True,
            'message': 'Announcement created successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@admin_bp.route('/api/admin/announcements/<int:announcement_id>', methods=['DELETE'])
@token_required
def delete_admin_announcement(current_user, announcement_id):
    """Delete admin announcement"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        query = "DELETE FROM admin_announcements WHERE announcement_id = %s"
        execute_query(query, (announcement_id,), fetch=False)
        
        return jsonify({
            'success': True,
            'message': 'Announcement deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


# ==================== DEBUG ROUTES ====================

@admin_bp.route('/api/debug/student-data/<int:student_id>', methods=['GET'])
@token_required
def debug_student_data(current_user, student_id):
    """Debug student data issues"""
    try:
        student_query = "SELECT * FROM students WHERE student_id = %s"
        student = execute_query(student_query, (student_id,))
        
        enrollments_query = """
            SELECT e.*, cs.section_code, c.course_code, c.course_name
            FROM enrollments e
            JOIN course_sections cs ON e.section_id = cs.section_id
            JOIN courses c ON cs.course_id = c.course_id
            WHERE e.student_id = %s
        """
        enrollments = execute_query(enrollments_query, (student_id,))
        
        marks_query = """
            SELECT m.*, e.enrollment_id, c.course_code
            FROM marks m
            JOIN enrollments e ON m.enrollment_id = e.enrollment_id
            JOIN course_sections cs ON e.section_id = cs.section_id
            JOIN courses c ON cs.course_id = c.course_id
            WHERE e.student_id = %s
        """
        marks = execute_query(marks_query, (student_id,))
        
        return jsonify({
            'success': True,
            'debug': {
                'student': student[0] if student else None,
                'enrollments': enrollments,
                'marks': marks,
                'enrollment_count': len(enrollments),
                'marks_count': len(marks)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500