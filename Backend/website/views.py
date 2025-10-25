"""
COMPLETE VIEWS.PY - ALL ROUTES FIXED
"""

from flask import Blueprint, request, jsonify
from Backend.website.models import StudentModel, CourseModel, FacultyModel
from Backend.website.auth import token_required

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


# ==================== ADMIN ROUTES (PLACEHOLDER) ====================

@views.route('/api/admin/dashboard', methods=['GET'])
@token_required
def get_admin_dashboard(current_user):
    """Get Admin Dashboard (TODO: Implement)"""
    if current_user['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    return jsonify({
        'success': True,
        'message': 'Admin dashboard - To be implemented',
        'data': {}
    }), 200