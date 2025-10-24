#store all the urls for actual functioning of website 
#kinda frontend aspect

#this means it has bunch of routes define inside it,it act as blueprint
 #name of blueprint 
#WHEN WE GO TO SLASH IT WILL CALL FUCNTION

# ============================================
# FILE 4: Backend/website/views.py
# ============================================
"""
Student API Routes
All student-facing endpoints
"""

from flask import Blueprint, request, jsonify, session
from Backend.website.models import StudentModel, CourseModel
from functools import wraps

views = Blueprint('views', __name__)

# Decorator to protect routes (require login)
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        return f(*args, **kwargs)
    return decorated_function


@views.route('/api/student/dashboard', methods=['GET'])
@login_required
def get_dashboard():
    """
    Get Student Dashboard Data
    
    Returns:
    - Student details
    - Enrolled courses
    - Attendance summary
    - Recent announcements
    """
    try:
        student_id = session.get('student_id')
        
        # Get student info
        student = StudentModel.get_student_by_user_id(session['user_id'])
        
        # Get enrolled courses
        courses = StudentModel.get_enrolled_courses(student_id)
        
        # Get attendance summary
        attendance = StudentModel.get_attendance_summary(student_id)
        
        # Add attendance left to courses
        for course in courses:
            att = next((a for a in attendance if a['course_code'] == course['course_code']), None)
            if att:
                # Calculate leaves left (assuming 75% requirement, max 25% leaves)
                total = att['total_classes']
                present = att['present']
                min_required = total * 0.75
                leaves_left = int(present - min_required)
                course['attendance_left'] = max(0, leaves_left)
            else:
                course['attendance_left'] = 0
        
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
                    'dob': str(student['date_of_birth']) if student['date_of_birth'] else None,
                    'cnic': student['cnic'],
                    'status': student['status']
                },
                'enrolled_courses': courses,
                'announcements': [
                    {'id': 1, 'message': 'Midterm exams start from next week'},
                    {'id': 2, 'message': 'Fee payment deadline: 30th March'}
                ]
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500


@views.route('/api/student/transcript', methods=['GET'])
@login_required
def get_transcript():
    """
    Get Student Transcript
    
    Returns complete transcript with CGPA
    """
    try:
        student_id = session.get('student_id')
        
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
@login_required
def get_marks():
    """
    Get All Marks
    
    Returns marks for all enrolled courses
    """
    try:
        student_id = session.get('student_id')
        
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
            
            # Add individual marks
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
@login_required
def get_attendance():
    """
    Get Attendance Summary
    """
    try:
        student_id = session.get('student_id')
        
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
@login_required
def get_fees():
    """
    Get Fee Details
    """
    try:
        student_id = session.get('student_id')
        
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


@views.route('/api/courses/available', methods=['GET'])
@login_required
def get_available_courses():
    """
    Get Available Courses for Registration
    
    Query params: semester, year
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
@login_required
def enroll_course():
    """
    Enroll in a Course
    
    Request Body:
    {
        "section_id": 1
    }
    """
    try:
        student_id = session.get('student_id')
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
                'message': 'Enrollment failed'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500


@views.route('/api/courses/drop', methods=['POST'])
@login_required
def drop_course():
    """
    Drop a Course
    
    Request Body:
    {
        "section_id": 1
    }
    """
    try:
        student_id = session.get('student_id')
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

