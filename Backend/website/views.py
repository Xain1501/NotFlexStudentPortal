# ============================================
# FILE 4: Backend/website/views.py (FIXED WITH JWT)
# ============================================
"""
All API Routes - Student, Faculty, Admin
"""

from flask import Blueprint, request, jsonify
from Backend.website.models import StudentModel, CourseModel
from Backend.website.auth import token_required

views = Blueprint('views', __name__)

# ==================== STUDENT ROUTES ====================

@views.route('/api/student/dashboard', methods=['GET'])
@token_required
def get_student_dashboard(current_user):
    """
    Get Student Dashboard Data
    """
    # Check if user is student
    if current_user['role'] != 'student':
        return jsonify({
            'success': False,
            'message': 'Access denied - Students only'
        }), 403
    
    try:
        # Use current_user from JWT, NOT session
        student_id = current_user.get('student_id')
        
        # Get student info
        student = StudentModel.get_student_by_user_id(current_user['user_id'])
        
        if not student:
            return jsonify({
                'success': False,
                'message': 'Student not found'
            }), 404
        
        # Get enrolled courses
        courses = StudentModel.get_enrolled_courses(student_id)
        
        # Get attendance summary
        attendance = StudentModel.get_attendance_summary(student_id)
        
        # Add attendance left to courses
        for course in courses:
            att = next((a for a in attendance if a['course_code'] == course['course_code']), None)
            if att:
                total = att['total_classes']
                present = att['present']
                min_required = total * 0.75
                leaves_left = int(present - min_required)
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
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500


@views.route('/api/student/transcript', methods=['GET'])
@token_required
def get_student_transcript(current_user):
    """
    Get Student Transcript
    """
    if current_user['role'] != 'student':
        return jsonify({
            'success': False,
            'message': 'Access denied - Students only'
        }), 403
    
    try:
        student_id = current_user.get('student_id')
        
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
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500


@views.route('/api/student/marks', methods=['GET'])
@token_required
def get_student_marks(current_user):
    """
    Get Student Marks
    """
    if current_user['role'] != 'student':
        return jsonify({
            'success': False,
            'message': 'Access denied - Students only'
        }), 403
    
    try:
        student_id = current_user.get('student_id')
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
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500


@views.route('/api/student/attendance', methods=['GET'])
@token_required
def get_student_attendance(current_user):
    """
    Get Student Attendance Summary
    """
    if current_user['role'] != 'student':
        return jsonify({
            'success': False,
            'message': 'Access denied - Students only'
        }), 403
    
    try:
        student_id = current_user.get('student_id')
        attendance = StudentModel.get_attendance_summary(student_id)
        
        return jsonify({
            'success': True,
            'data': {
                'courses': attendance
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500


@views.route('/api/student/fees', methods=['GET'])
@token_required
def get_student_fees(current_user):
    """
    Get Student Fee Details
    """
    if current_user['role'] != 'student':
        return jsonify({
            'success': False,
            'message': 'Access denied - Students only'
        }), 403
    
    try:
        student_id = current_user.get('student_id')
        fees = StudentModel.get_fee_details(student_id)
        
        return jsonify({
            'success': True,
            'data': {
                'fees': fees
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500


# ==================== COURSE ROUTES (Shared) ====================

@views.route('/api/courses/available', methods=['GET'])
@token_required
def get_available_courses(current_user):
    """
    Get Available Courses for Registration
    """
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
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500


@views.route('/api/courses/enroll', methods=['POST'])
@token_required
def enroll_course(current_user):
    """
    Enroll in a Course (Students only)
    """
    if current_user['role'] != 'student':
        return jsonify({
            'success': False,
            'message': 'Access denied - Students only'
        }), 403
    
    try:
        student_id = current_user.get('student_id')
        data = request.get_json()
        section_id = data.get('section_id')
        
        if not section_id:
            return jsonify({
                'success': False,
                'message': 'Section ID is required'
            }), 400
        
        success = CourseModel.enroll_student(student_id, section_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Enrolled successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Enrollment failed - course may be full'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500


@views.route('/api/courses/drop', methods=['POST'])
@token_required
def drop_course(current_user):
    """
    Drop a Course (Students only)
    """
    if current_user['role'] != 'student':
        return jsonify({
            'success': False,
            'message': 'Access denied - Students only'
        }), 403
    
    try:
        student_id = current_user.get('student_id')
        data = request.get_json()
        section_id = data.get('section_id')
        
        if not section_id:
            return jsonify({
                'success': False,
                'message': 'Section ID is required'
            }), 400
        
        success = CourseModel.drop_course(student_id, section_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Course dropped successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Drop failed'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500


# ==================== FACULTY ROUTES (PLACEHOLDER) ====================

@views.route('/api/faculty/dashboard', methods=['GET'])
@token_required
def get_faculty_dashboard(current_user):
    """
    Get Faculty Dashboard (TODO: Implement)
    """
    if current_user['role'] != 'faculty':
        return jsonify({
            'success': False,
            'message': 'Access denied - Faculty only'
        }), 403
    
    return jsonify({
        'success': True,
        'message': 'Faculty dashboard - To be implemented',
        'data': {}
    }), 200


# ==================== ADMIN ROUTES (PLACEHOLDER) ====================

@views.route('/api/admin/dashboard', methods=['GET'])
@token_required
def get_admin_dashboard(current_user):
    """
    Get Admin Dashboard (TODO: Implement)
    """
    if current_user['role'] != 'admin':
        return jsonify({
            'success': False,
            'message': 'Access denied - Admin only'
        }), 403
    
    return jsonify({
        'success': True,
        'message': 'Admin dashboard - To be implemented',
        'data': {}
    }), 200