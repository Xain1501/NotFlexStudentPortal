"""
Student Routes - All student-related API endpoints
"""

from flask import Blueprint, request, jsonify
from ..models import StudentModel, CourseModel
from .auth_routes import token_required

student_bp = Blueprint('student', __name__)

# ==================== STUDENT DASHBOARD ====================

@student_bp.route('/api/student/dashboard', methods=['GET'])
@token_required
def get_student_dashboard(current_user):
    """Get Student Dashboard Data"""
    if current_user['role'] != 'student':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        student = StudentModel.get_student_by_user_id(current_user['user_id'])
        if not student:
            return jsonify({'success': False, 'message': 'Student not found'}), 404
        
        student_id = student['student_id']
        courses = StudentModel.get_enrolled_courses(student_id)
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


# ==================== TRANSCRIPT ====================

@student_bp.route('/api/student/transcript', methods=['GET'])
@token_required
def get_student_transcript(current_user):
    """Get Student Transcript"""
    if current_user['role'] != 'student':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        student = StudentModel.get_student_by_user_id(current_user['user_id'])
        if not student:
            return jsonify({'success': False, 'message': 'Student not found'}), 404
        
        student_id = student['student_id']
        transcript = StudentModel.get_transcript(student_id)
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


# ==================== MARKS ====================

@student_bp.route('/api/student/marks', methods=['GET'])
@token_required
def get_student_marks(current_user):
    """Get Student Marks"""
    if current_user['role'] != 'student':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        student = StudentModel.get_student_by_user_id(current_user['user_id'])
        if not student:
            return jsonify({'success': False, 'message': 'Student not found'}), 404
        
        student_id = student['student_id']
        marks = StudentModel.get_all_marks(student_id)
        
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


# ==================== ATTENDANCE ====================

@student_bp.route('/api/student/attendance', methods=['GET'])
@token_required
def get_student_attendance(current_user):
    """Get Student Attendance Summary"""
    if current_user['role'] != 'student':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
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


# ==================== FEES ====================

@student_bp.route('/api/student/fees', methods=['GET'])
@token_required
def get_student_fees(current_user):
    """Get Student Fee Details"""
    if current_user['role'] != 'student':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
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


# ==================== COURSE ENROLLMENT ====================

@student_bp.route('/api/student/courses/enrolled', methods=['GET'])
@token_required
def get_student_enrollments(current_user):
    """Get all courses student is enrolled in"""
    if current_user['role'] != 'student':
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
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


@student_bp.route('/api/student/courses/enroll', methods=['POST'])
@token_required
def enroll_course_student(current_user):
    """Enroll in a course (Students only)"""
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
        
        success = CourseModel.enroll_student(student_id, section_id)
        
        if success:
            return jsonify({'success': True, 'message': 'Course enrolled successfully'}), 200
        else:
            return jsonify({'success': False, 'message': 'Enrollment failed - course may be full or already enrolled'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@student_bp.route('/api/student/courses/unenroll', methods=['POST'])
@token_required
def unenroll_course(current_user):
    """Unenroll from a course (Students only)"""
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
            return jsonify({'success': True, 'message': 'Course unenrolled successfully'}), 200
        else:
            return jsonify({'success': False, 'message': 'Failed to unenroll from course'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500