"""
COMPLETE VIEWS.PY - ALL ROUTES FIXED
"""

from flask import Blueprint, request, jsonify
from website.models import StudentModel,UserModel, CourseModel, FacultyModel,AdminModel,DepartmentModel
from website.auth import token_required
from database.connection import execute_query

views = Blueprint('views', __name__)

# ==================== STUDENT ROUTES ====================

@views.route('/api/student/dashboard', methods=['GET'])
@token_required
def get_student_dashboard(current_user):
    """Get Student Dashboard Data"""
    if current_user['role'] != 'student':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        # FIX: Get student from database to get real student_id
        student = StudentModel.get_student_by_user_id(current_user['user_id'])
        if not student:
            return jsonify({'success': False, 'message': 'Student not found'}), 404
        
        student_id = student['student_id']  # Use this instead of current_user.get('student_id')
        
        # Get enrolled courses
        courses = StudentModel.get_enrolled_courses(student_id)
        
        # Get attendance summary
        attendance = StudentModel.get_attendance_summary(student_id)
        
        # Add attendance info to courses
        for course in courses:
            att = next((a for a in attendance if a['course_code'] == course['course_code']), None)
            if att:
                total = att['total_classes']
                present = att['present']
                min_required = total * 0.75
                leaves_left = int(float(present) - min_required)
                course['attendance_left'] = max(0, leaves_left)
                course['attendance_percentage'] = att['attendance_percentage']
            else:
                course['attendance_left'] = 0
                course['attendance_percentage'] = 0
        
        return jsonify({
            'success': True,
            'data': {
                'student': {
                    'name': f"{student['first_name']} {student['last_name']}",
                    'roll_no': student['student_code'],
                    'department': student['dept_name'],
                    'year': f"{student['current_semester']} Semester",
                    'email': student['email'],
                    'phone': student['phone'],
                    'status': student['status']
                },
                'enrolled_courses': courses,
                'announcements': [
                    {'id': 1, 'message': 'Midterm exams start from next week', 'type': 'exam'},
                    {'id': 2, 'message': 'Fee payment deadline: 30th March', 'type': 'fee'}
                ]
            }
        }), 200
        
    except Exception as e:
        print(f"Dashboard error: {e}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@views.route('/api/student/transcript', methods=['GET'])
@token_required
def get_student_transcript(current_user):
    """Get Student Transcript"""
    if current_user['role'] != 'student':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        # FIX: Get student_id from database
        student = StudentModel.get_student_by_user_id(current_user['user_id'])
        if not student:
            return jsonify({'success': False, 'message': 'Student not found'}), 404
        
        student_id = student['student_id']
        
        # Get transcript
        transcript = StudentModel.get_transcript(student_id)
        
        # Calculate CGPA
        cgpa = StudentModel.calculate_gpa(student_id)
        
        # Group by semester
        semesters = {}
        for record in transcript:
            sem = record['semester']
            if sem not in semesters:
                semesters[sem] = {
                    'semester': sem,
                    'courses': [],
                    'sgpa': StudentModel.calculate_gpa(student_id, sem)
                }
            semesters[sem]['courses'].append(record)
        
        return jsonify({
            'success': True,
            'data': {
                'cgpa': cgpa,
                'semesters': list(semesters.values())
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@views.route('/api/student/marks', methods=['GET'])
@token_required
def get_student_marks(current_user):
    """Get Student Marks"""
    if current_user['role'] != 'student':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        # FIX: Get student_id from database
        student = StudentModel.get_student_by_user_id(current_user['user_id'])
        if not student:
            return jsonify({'success': False, 'message': 'Student not found'}), 404
        
        student_id = student['student_id']
        marks = StudentModel.get_all_marks(student_id)
        
        # Format response
        courses_marks = {}
        for mark in marks:
            code = mark['course_code']
            if code not in courses_marks:
                courses_marks[code] = {
                    'code': code,
                    'name': mark['course_name'],
                    'marks': []
                }
            
            if mark.get('mark_id'):
                courses_marks[code]['marks'] = [
                    {'title': 'Quiz', 'score': mark['quiz_marks'], 'outOf': mark['quiz_total']},
                    {'title': 'Assignment 1', 'score': mark['assignment1_marks'], 'outOf': mark['assignment1_total']},
                    {'title': 'Assignment 2', 'score': mark['assignment2_marks'], 'outOf': mark['assignment2_total']},
                    {'title': 'Project', 'score': mark['project_marks'], 'outOf': mark['project_total']},
                    {'title': 'Midterm', 'score': mark['midterm_marks'], 'outOf': mark['midterm_total']},
                    {'title': 'Final', 'score': mark['final_marks'], 'outOf': mark['final_total']}
                ]
                courses_marks[code]['total_obtained'] = mark.get('total_obtained', 0)
                courses_marks[code]['percentage'] = mark.get('percentage', 0)
                courses_marks[code]['grade'] = mark.get('final_grade', 'N/A')
        
        return jsonify({
            'success': True,
            'data': {
                'courses': list(courses_marks.values())
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@views.route('/api/student/attendance', methods=['GET'])
@token_required
def get_student_attendance(current_user):
    """Get Student Attendance Summary"""
    if current_user['role'] != 'student':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        # FIX: Get student_id from database
        student = StudentModel.get_student_by_user_id(current_user['user_id'])
        if not student:
            return jsonify({'success': False, 'message': 'Student not found'}), 404
        
        student_id = student['student_id']
        attendance = StudentModel.get_attendance_summary(student_id)
        
        return jsonify({
            'success': True,
            'data': {
                'courses': attendance
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@views.route('/api/student/fees', methods=['GET'])
@token_required
def get_student_fees(current_user):
    """Get Student Fee Details"""
    if current_user['role'] != 'student':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        # FIX: Get student_id from database
        student = StudentModel.get_student_by_user_id(current_user['user_id'])
        if not student:
            return jsonify({'success': False, 'message': 'Student not found'}), 404
        
        student_id = student['student_id']
        fees = StudentModel.get_fee_details(student_id)
        
        return jsonify({
            'success': True,
            'data': {
                'fees': fees
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@views.route('/api/student/courses/enrolled', methods=['GET'])
@token_required
def get_student_enrollments(current_user):
    """Get all courses student is enrolled in"""
    if current_user['role'] != 'student':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        # FIX: Get student_id from database
        student = StudentModel.get_student_by_user_id(current_user['user_id'])
        if not student:
            return jsonify({'success': False, 'message': 'Student profile not found'}), 404
        
        student_id = student['student_id']
        enrollments = CourseModel.get_student_enrollments(student_id)
        
        return jsonify({
            'success': True,
            'data': {
                'enrollments': enrollments
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500
@views.route('/api/student/courses/unenroll', methods=['POST'])
@token_required
def unenroll_course(current_user):
    """Unenroll from a course (Students only)"""
    if current_user['role'] != 'student':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        # Get student_id from database
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
            return jsonify({'success': True, 'message': 'Course unenrolled successfully'}), 200
        else:
            return jsonify({'success': False, 'message': 'Failed to unenroll from course'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500
    
@views.route('/api/student/courses/enroll', methods=['POST'])
@token_required
def enroll_course_student(current_user):
    """Enroll in a course (Students only)"""
    if current_user['role'] != 'student':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        # Get student_id from database
        student = StudentModel.get_student_by_user_id(current_user['user_id'])
        if not student:
            return jsonify({'success': False, 'message': 'Student profile not found'}), 404
        
        student_id = student['student_id']
        data = request.get_json()
        section_id = data.get('section_id')
        
        if not section_id:
            return jsonify({'success': False, 'message': 'Section ID is required'}), 400
        
        success = CourseModel.enroll_student(student_id, section_id)
        
        if success:
            return jsonify({'success': True, 'message': 'Course enrolled successfully'}), 200
        else:
            return jsonify({'success': False, 'message': 'Enrollment failed - course may be full or you are already enrolled'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500
# ==================== FACULTY ROUTES ====================

@views.route('/api/faculty/dashboard', methods=['GET'])
@token_required
def get_faculty_dashboard(current_user):
    """Get Faculty Dashboard"""
    if current_user['role'] != 'faculty':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        # FIX: Get faculty from database to get real faculty_id
        faculty = FacultyModel.get_faculty_by_user_id(current_user['user_id'])
        
        if not faculty:
            return jsonify({'success': False, 'message': 'Faculty not found'}), 404
        
        faculty_id = faculty['faculty_id']  # Use this instead of current_user.get('faculty_id')
        
        # Get teaching courses
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
@views.route('/api/faculty/leave/apply', methods=['POST'])
@token_required
def apply_for_leave(current_user):
    """Faculty apply for leave"""
    if current_user['role'] != 'faculty':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        # Get faculty_id from database
        faculty = FacultyModel.get_faculty_by_user_id(current_user['user_id'])
        if not faculty:
            return jsonify({'success': False, 'message': 'Faculty not found'}), 404
        
        data = request.get_json()
        leave_date = data.get('leave_date')
        reason = data.get('reason')
        #leave_type = data.get('leave_type', 'casual')
        
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

@views.route('/api/faculty/leaves', methods=['GET'])
@token_required
def get_faculty_leaves(current_user):
    """Get faculty's own leave applications"""
    if current_user['role'] != 'faculty':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        # Get faculty_id from database
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

@views.route('/api/faculty/courses/<int:section_id>/students', methods=['GET'])
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


@views.route('/api/faculty/courses/<int:section_id>/attendance', methods=['GET'])
@token_required
def get_course_attendance(current_user, section_id):
    """Get attendance for a course section"""
    if current_user['role'] != 'faculty':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        date = request.args.get('date')  # Optional: specific date
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


@views.route('/api/faculty/attendance/mark', methods=['POST'])
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
        status = data.get('status')  # 'present' or 'absent'
        
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


@views.route('/api/faculty/attendance/mark-bulk', methods=['POST'])
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


@views.route('/api/faculty/marks/upload', methods=['POST'])
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


# ==================== COURSE ROUTES (Shared) ====================

@views.route('/api/courses/available', methods=['GET'])
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


@views.route('/api/courses/check-seats', methods=['GET'])
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


@views.route('/api/courses/enroll', methods=['POST'])
@token_required
def enroll_course(current_user):
    """Enroll in a Course (Students only)"""
    if current_user['role'] != 'student':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        # FIX: Get student_id from database
        student = StudentModel.get_student_by_user_id(current_user['user_id'])
        if not student:
            return jsonify({'success': False, 'message': 'Student profile not found'}), 404
        
        student_id = student['student_id']
        data = request.get_json()
        section_id = data.get('section_id')
        
        if not section_id:
            return jsonify({'success': False, 'message': 'Section ID is required'}), 400
        
        success = CourseModel.enroll_student(student_id, section_id)
        
        if success:
            return jsonify({'success': True, 'message': 'Enrolled successfully'}), 200
        else:
            return jsonify({'success': False, 'message': 'Enrollment failed - course may be full'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@views.route('/api/courses/drop', methods=['POST'])
@token_required
def drop_course(current_user):
    """Drop a Course (Students only)"""
    if current_user['role'] != 'student':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        # FIX: Get student_id from database
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


# ==================== ADMIN ROUTES ====================

# ==================== ADMIN ROUTES (FIXED & COMPLETE) ====================

@views.route('/api/admin/dashboard', methods=['GET'])
@token_required
def get_admin_dashboard(current_user):
    """Get Admin Dashboard Data"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied - Admin only'}), 403
    
    try:
        # Get counts using direct queries (more reliable)
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

@views.route('/api/admin/users', methods=['GET'])
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

@views.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@token_required
def delete_user(current_user, user_id):
    """Delete user (cascade delete will handle student/faculty records)"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        # Check if trying to delete self
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

@views.route('/api/admin/users/<int:user_id>/toggle-status', methods=['PUT'])
@token_required
def toggle_user_status(current_user, user_id):
    """Activate/Deactivate user"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        # Get current status
        current_query = "SELECT is_active FROM users WHERE user_id = %s"
        current_status = execute_query(current_query, (user_id,))[0]['is_active']
        
        # Toggle status
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

# ==================== FEE MANAGEMENT ====================

@views.route('/api/admin/fees', methods=['GET'])
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

@views.route('/api/admin/fees/<int:fee_id>/mark-paid', methods=['PUT'])
@token_required
def mark_fee_paid(current_user, fee_id):
    """Mark fee as paid"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        query = """
            UPDATE fee_details 
            SET status = 'paid', payment_date = CURDATE()
            WHERE fee_id = %s
        """
        execute_query(query, (fee_id,), fetch=False)
        
        return jsonify({
            'success': True,
            'message': 'Fee marked as paid successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@views.route('/api/admin/fees', methods=['POST'])
@token_required
def add_fee_record(current_user):
    """Add new fee record for student"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        data = request.get_json()
        student_id = data.get('student_id')
        semester = data.get('semester')
        amount_due = data.get('amount_due')
        due_date = data.get('due_date')
        
        if not all([student_id, semester, amount_due, due_date]):
            return jsonify({'success': False, 'message': 'All fields are required'}), 400
        
        query = """
            INSERT INTO fee_details (student_id, semester, amount_due, due_date, status)
            VALUES (%s, %s, %s, %s, 'pending')
        """
        execute_query(query, (student_id, semester, amount_due, due_date), fetch=False)
        
        return jsonify({
            'success': True,
            'message': 'Fee record added successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500
    # ==================== COURSE REGISTRATION MANAGEMENT ====================

@views.route('/api/admin/registration-period', methods=['POST'])
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
        
        # Create or update registration period
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

@views.route('/api/admin/registration-period/current', methods=['GET'])
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

# ==================== FACULTY LEAVE MANAGEMENT ====================

@views.route('/api/admin/leaves', methods=['GET'])
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

@views.route('/api/admin/leaves/<int:leave_id>/<action>', methods=['PUT'])
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
# ==================== FACULTY ATTENDANCE (ADMIN) ====================

@views.route('/api/admin/faculty-attendance/mark', methods=['POST'])
@token_required
def mark_faculty_attendance(current_user):
    """Mark faculty attendance (Admin only)"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        data = request.get_json()
        faculty_id = data.get('faculty_id')
        date = data.get('date')
        session = data.get('session')  # 'Morning' or 'Evening'
        status = data.get('status')    # 'present' or 'absent'
        
        if not all([faculty_id, date, session, status]):
            return jsonify({'success': False, 'message': 'All fields are required'}), 400
        
        query = """
            INSERT INTO faculty_attendance (faculty_id, attendance_date, session, status, marked_by)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE status = %s, marked_by = %s
        """
        execute_query(query, (faculty_id, date, session, status, current_user['user_id'], status, current_user['user_id']), fetch=False)
        
        return jsonify({
            'success': True,
            'message': 'Faculty attendance marked successfully'
        }), 200
        
    except Exception as e:
        print(f"Faculty attendance error: {e}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@views.route('/api/admin/faculty-attendance/bulk', methods=['POST'])
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
            
            query = """
                INSERT INTO faculty_attendance (faculty_id, attendance_date, session, status, marked_by)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE status = %s, marked_by = %s
            """
            execute_query(query, (faculty_id, attendance_date, session, status, current_user['user_id'], status, current_user['user_id']), fetch=False)
        
        return jsonify({
            'success': True,
            'message': f'Attendance marked for {len(attendance_data)} faculty members'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@views.route('/api/admin/faculty-attendance/<date>', methods=['GET'])
@token_required
def get_faculty_attendance(current_user, date):
    """Get faculty attendance for a specific date"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        query = """
            SELECT fa.*, f.faculty_code, f.first_name, f.last_name
            FROM faculty_attendance fa
            JOIN faculty f ON fa.faculty_id = f.faculty_id
            WHERE fa.attendance_date = %s
            ORDER BY fa.session, f.first_name
        """
        attendance = execute_query(query, (date,))
        
        return jsonify({
            'success': True,
            'data': {
                'attendance': attendance
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

# ==================== ADMIN ANNOUNCEMENTS ====================

@views.route('/api/admin/announcements', methods=['GET'])
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

@views.route('/api/admin/announcements', methods=['POST'])
@token_required
def create_admin_announcement(current_user):
    """Create new admin announcement (Admin only)"""
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

@views.route('/api/admin/announcements/<int:announcement_id>', methods=['DELETE'])
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
# ==================== COURSE MANAGEMENT (ADMIN) ====================

@views.route('/api/admin/courses/<int:section_id>/students', methods=['GET'])
@token_required
def get_course_students_admin(current_user, section_id):
    """Get students in a course section (Admin version)"""
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

@views.route('/api/admin/enroll-student', methods=['POST'])
@token_required
def admin_enroll_student(current_user):
    """Admin manually enrolls student in course"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        data = request.get_json()
        student_id = data.get('student_id')
        section_id = data.get('section_id')
        
        if not student_id or not section_id:
            return jsonify({'success': False, 'message': 'Student ID and Section ID are required'}), 400
        
        # Check if already enrolled
        check_query = "SELECT * FROM enrollments WHERE student_id = %s AND section_id = %s"
        existing = execute_query(check_query, (student_id, section_id))
        
        if existing:
            return jsonify({'success': False, 'message': 'Student is already enrolled in this course'}), 400
        
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

@views.route('/api/admin/drop-student', methods=['POST'])
@token_required
def admin_drop_student(current_user):
    """Admin manually drops student from course"""
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
    
@views.route('/api/admin/faculty-attendance/mark', methods=['POST'])
@token_required
def mark_faculty_attendance_admin(current_user):
    """Mark faculty attendance (Admin only)"""
    try:
        if current_user['role'] != 'admin':
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
        data = request.get_json()
        faculty_id = data.get('faculty_id')
        date = data.get('date')
        session = data.get('session')  # Morning or Evening
        status = data.get('status')  # present or absent
        
        if not all([faculty_id, date, session, status]):
            return jsonify({
                'success': False,
                'message': 'Missing required fields'
            }), 400
        
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
            }), 500
            
    except Exception as e:
        print(f"Mark faculty attendance error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@views.route('/api/admin/faculty-attendance/multiple', methods=['POST'])
@token_required
def mark_multiple_faculty_attendance_admin(current_user):
    """Mark attendance for multiple faculty at once (Admin only)"""
    try:
        if current_user['role'] != 'admin':
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
        data = request.get_json()
        attendance_data = data.get('attendance', [])
        
        if not attendance_data:
            return jsonify({
                'success': False,
                'message': 'No attendance data provided'
            }), 400
        
        success = AdminModel.mark_multiple_faculty_attendance(
            attendance_data, current_user['user_id']
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
            }), 500
            
    except Exception as e:
        print(f"Multiple faculty attendance error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@views.route('/api/admin/faculty-attendance/date/<date>', methods=['GET'])
@token_required
def get_faculty_attendance_by_date_admin(current_user, date):
    """Get faculty attendance for a specific date (Admin only)"""
    try:
        if current_user['role'] != 'admin':
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
        attendance = AdminModel.get_faculty_attendance_by_date(date)
        
        return jsonify({
            'success': True,
            'attendance': attendance
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@views.route('/api/admin/faculty-attendance/summary', methods=['GET'])
@token_required
def get_faculty_attendance_summary_admin(current_user):
    """Get faculty attendance summary (Admin only)"""
    try:
        if current_user['role'] != 'admin':
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
        summary = AdminModel.get_faculty_attendance_summary()
        
        return jsonify({
            'success': True,
            'summary': summary
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================
# LEAVE APPROVAL ROUTES
# ============================================

@views.route('/api/admin/leaves/pending', methods=['GET'])
@token_required
def get_pending_leaves(current_user):
    """Get all pending leave requests"""
    try:
        if current_user['role'] != 'admin':
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
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
        from database.connection import execute_query
        leaves = execute_query(query)
        
        return jsonify({
            'success': True,
            'leaves': leaves
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@views.route('/api/admin/leave/<int:leave_id>/approve', methods=['POST'])
@token_required
def approve_leave(current_user, leave_id):
    """Approve a leave request"""
    try:
        if current_user['role'] != 'admin':
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
        from database.connection import execute_query
        query = "UPDATE faculty_leaves SET status = 'approved' WHERE leave_id = %s"
        execute_query(query, (leave_id,), fetch=False)
        
        return jsonify({
            'success': True,
            'message': 'Leave approved successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@views.route('/api/admin/leave/<int:leave_id>/reject', methods=['POST'])
@token_required
def reject_leave(current_user, leave_id):
    """Reject a leave request"""
    try:
        if current_user['role'] != 'admin':
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
        from database.connection import execute_query
        query = "UPDATE faculty_leaves SET status = 'rejected' WHERE leave_id = %s"
        execute_query(query, (leave_id,), fetch=False)
        
        return jsonify({
            'success': True,
            'message': 'Leave rejected'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    
@views.route('/api/debug/student-data/<int:student_id>', methods=['GET'])
@token_required
def debug_student_data(current_user, student_id):
    """Debug student data issues"""
    try:
        from database.connection import execute_query
        
        # 1. Check student exists
        student_query = "SELECT * FROM students WHERE student_id = %s"
        student = execute_query(student_query, (student_id,))
        
        # 2. Check enrollments
        enrollments_query = """
            SELECT e.*, cs.section_code, c.course_code, c.course_name
            FROM enrollments e
            JOIN course_sections cs ON e.section_id = cs.section_id
            JOIN courses c ON cs.course_id = c.course_id
            WHERE e.student_id = %s
        """
        enrollments = execute_query(enrollments_query, (student_id,))
        
        # 3. Check marks
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
# ==================== STUDENT MANAGEMENT ====================

@views.route('/api/admin/students', methods=['GET'])
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

@views.route('/api/admin/students/<int:student_id>', methods=['GET'])
@token_required
def get_student_details_admin(current_user, student_id):
    """Get detailed student information"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        student = StudentModel.get_student_by_id(student_id)
        
        if not student:
            return jsonify({'success': False, 'message': 'Student not found'}), 404
        
        # Get student's enrolled courses
        enrollments = CourseModel.get_student_enrollments(student_id)
        # Get student's fees
        fees = StudentModel.get_fee_details(student_id)
        # Get student's attendance summary
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

@views.route('/api/admin/students/<int:student_id>', methods=['PUT'])
@token_required
def update_student_admin(current_user, student_id):
    """Update student information"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        data = request.get_json()
        
        # Fields that can be updated
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

@views.route('/api/admin/students/<int:student_id>/toggle-status', methods=['PUT'])
@token_required
def toggle_student_status(current_user, student_id):
    """Activate/Deactivate student"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        # Get current status
        student = StudentModel.get_student_by_id(student_id)
        if not student:
            return jsonify({'success': False, 'message': 'Student not found'}), 404
        
        # Toggle status
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
@views.route('/api/admin/students', methods=['POST'])
@token_required
def create_student_admin(current_user):
    """Create new student (Admin only)"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        data = request.get_json()
        
        # Required fields
        required_fields = ['student_code', 'first_name', 'last_name', 'email', 'major_dept_id']
        if not all(field in data for field in required_fields):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
        # Create user first
        user_data = {
            'username': data['student_code'],
            'password_hash': 'password123',  # Default password
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

@views.route('/api/admin/students/<int:student_id>', methods=['DELETE'])
@token_required
def delete_student_admin(current_user, student_id):
    """Delete student (Admin only)"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        # Get user_id from student
        student = StudentModel.get_student_by_id(student_id)
        if not student:
            return jsonify({'success': False, 'message': 'Student not found'}), 404
        
        # Delete user (cascade delete will handle student record)
        delete_query = "DELETE FROM users WHERE user_id = %s"
        execute_query(delete_query, (student['user_id'],), fetch=False)
        
        return jsonify({
            'success': True,
            'message': 'Student deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500
    # ==================== FACULTY MANAGEMENT ====================

@views.route('/api/admin/faculty', methods=['GET'])
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

@views.route('/api/admin/faculty/<int:faculty_id>', methods=['GET'])
@token_required
def get_faculty_details_admin(current_user, faculty_id):
    """Get detailed faculty information"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        faculty = FacultyModel.get_faculty_by_id(faculty_id)
        
        if not faculty:
            return jsonify({'success': False, 'message': 'Faculty not found'}), 404
        
        # Get faculty's teaching courses
        courses = FacultyModel.get_teaching_courses(faculty_id)
        # Get faculty's leaves
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

@views.route('/api/admin/faculty/<int:faculty_id>', methods=['PUT'])
@token_required
def update_faculty_admin(current_user, faculty_id):
    """Update faculty information"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        data = request.get_json()
        
        # Fields that can be updated
        allowed_fields = ['first_name', 'last_name', 'phone', 'salary', 
                         'department_id', 'status']
        
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

@views.route('/api/admin/faculty/<int:faculty_id>/toggle-status', methods=['PUT'])
@token_required
def toggle_faculty_status(current_user, faculty_id):
    """Activate/Deactivate faculty"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        # Get current status
        faculty = FacultyModel.get_faculty_by_id(faculty_id)
        if not faculty:
            return jsonify({'success': False, 'message': 'Faculty not found'}), 404
        
        # Toggle status
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

@views.route('/api/admin/faculty', methods=['POST'])
@token_required
def create_faculty_admin(current_user):
    """Create new faculty (Admin only)"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        data = request.get_json()
        
        # Required fields
        required_fields = ['faculty_code', 'first_name', 'last_name', 'email', 'department_id']
        if not all(field in data for field in required_fields):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
        # Create user first
        user_data = {
            'username': data['faculty_code'],
            'password_hash': 'password123',  # Default password
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

@views.route('/api/admin/faculty/<int:faculty_id>', methods=['DELETE'])
@token_required
def delete_faculty_admin(current_user, faculty_id):
    """Delete faculty (Admin only)"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        # Get user_id from faculty
        faculty = FacultyModel.get_faculty_by_id(faculty_id)
        if not faculty:
            return jsonify({'success': False, 'message': 'Faculty not found'}), 404
        
        # Delete user (cascade delete will handle faculty record)
        delete_query = "DELETE FROM users WHERE user_id = %s"
        execute_query(delete_query, (faculty['user_id'],), fetch=False)
        
        return jsonify({
            'success': True,
            'message': 'Faculty deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500
    # ==================== DEPARTMENT MANAGEMENT ====================

@views.route('/api/admin/departments', methods=['GET'])
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
    # Update the add_fee_record route
@views.route('/api/admin/fees', methods=['POST'])
@token_required
def add_fee_record_admin(current_user):
    """Add new fee record for student with component breakdown"""
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

# New route to get fee breakdown
@views.route('/api/admin/fees/breakdown', methods=['GET'])
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
# ==================== ADMIN COURSE MANAGEMENT ====================

@views.route('/api/admin/course-management/students', methods=['GET'])
@token_required
def get_all_students_courses_admin(current_user):
    """Get all students with their course enrollments for admin"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        # Get all students
        students = StudentModel.get_all_students_for_admin()
        
        # Add course enrollments for each student
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

@views.route('/api/admin/course-management/enroll', methods=['POST'])
@token_required
def admin_enroll_student_course(current_user):
    """Admin enrolls student in course"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        data = request.get_json()
        student_id = data.get('student_id')
        section_id = data.get('section_id')
        
        if not student_id or not section_id:
            return jsonify({'success': False, 'message': 'Student ID and Section ID are required'}), 400
        
        # Check if already enrolled
        check_query = "SELECT * FROM enrollments WHERE student_id = %s AND section_id = %s AND status = 'enrolled'"
        existing = execute_query(check_query, (student_id, section_id))
        
        if existing:
            return jsonify({'success': False, 'message': 'Student is already enrolled in this course'}), 400
        
        # Check seat availability
        seats_info = CourseModel.check_seats_available(section_id)
        if not seats_info or seats_info['seats_available'] <= 0:
            return jsonify({'success': False, 'message': 'Course is full'}), 400
        
        # Enroll student
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

@views.route('/api/admin/course-management/drop', methods=['POST'])
@token_required
def admin_drop_student_course(current_user):
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