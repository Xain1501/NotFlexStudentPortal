# backend/app/routes/admin.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, Student, Faculty, Course, Fee, Enrollment
from app.utils import role_required
from datetime import datetime
from sqlalchemy import func

bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@bp.route('/dashboard', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_dashboard():
    """Get admin dashboard statistics"""
    try:
        total_students = Student.query.count()
        active_students = Student.query.filter_by(status='active').count()
        total_faculty = Faculty.query.count()
        total_courses = Course.query.count()
        
        # Fee statistics
        pending_fees = Fee.query.filter_by(status='pending').count()
        total_fee_amount = db.session.query(func.sum(Fee.amount)).filter_by(status='paid').scalar() or 0
        
        return jsonify({
            "statistics": {
                "total_students": total_students,
                "active_students": active_students,
                "total_faculty": total_faculty,
                "total_courses": total_courses,
                "pending_fees": pending_fees,
                "total_revenue": float(total_fee_amount)
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== STUDENT MANAGEMENT ====================

@bp.route('/students', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_all_students():
    """Get all students"""
    try:
        students = Student.query.all()
        
        student_list = []
        for student in students:
            user = student.user
            student_list.append({
                "id": student.id,
                "student_id": student.student_id,
                "student_code": student.student_id,
                "name": f"{user.first_name} {user.last_name}".strip(),
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "batch": student.batch,
                "section": student.section,
                "campus": student.campus,
                "status": student.status,
                "cgpa": float(student.cgpa) if student.cgpa else 0.0,
                "departmentId": student.batch,  # Using batch as department for now
                "department_id": student.batch,
                "rollNo": student.student_id
            })
        
        return jsonify({"students": student_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/students', methods=['POST'])
@jwt_required()
@role_required(['admin'])
def create_student():
    """Create a new student"""
    data = request.get_json()
    
    try:
        # Validate required fields
        if not data.get('student_id') and not data.get('student_code'):
            return jsonify({"error": "Student ID/Code is required"}), 400
        
        student_id = data.get('student_id') or data.get('student_code')
        username = data.get('username', f"student_{student_id}")
        email = data.get('email', f"{student_id}@student.com")
        
        # Check if username already exists
        if User.query.filter_by(username=username).first():
            return jsonify({"error": "Username already exists"}), 400
        
        # Check if email already exists
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already exists"}), 400
        
        # Check if student_id already exists
        if Student.query.filter_by(student_id=student_id).first():
            return jsonify({"error": "Student ID already exists"}), 400
        
        # Create user
        user = User(
            username=username,
            email=email,
            role='student',
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            gender=data.get('gender'),
            cnic=data.get('cnic'),
            mobile=data.get('mobile'),
            nationality=data.get('nationality'),
            address=data.get('address'),
            city=data.get('city'),
            country=data.get('country'),
            postal_code=data.get('postal_code')
        )
        user.set_password(data.get('password', 'student123'))
        
        db.session.add(user)
        db.session.flush()
        
        # Create student
        student = Student(
            user_id=user.id,
            student_id=student_id,
            batch=data.get('batch', str(datetime.now().year)),
            section=data.get('section', ''),
            campus=data.get('campus', 'Main Campus'),
            status='active',
            cgpa=0.0,
            admission_date=datetime.now().date()
        )
        
        db.session.add(student)
        db.session.commit()
        
        return jsonify({
            "message": "Student created successfully", 
            "id": student.id,
            "student_id": student.student_id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@bp.route('/students/<int:student_id>', methods=['PUT'])
@jwt_required()
@role_required(['admin'])
def update_student(student_id):
    """Update student information"""
    data = request.get_json()
    
    try:
        student = Student.query.get(student_id)
        
        if not student:
            return jsonify({"error": "Student not found"}), 404
        
        user = student.user
        
        # Update user fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'email' in data:
            # Check if email is already taken by another user
            existing = User.query.filter_by(email=data['email']).first()
            if existing and existing.id != user.id:
                return jsonify({"error": "Email already exists"}), 400
            user.email = data['email']
        if 'gender' in data:
            user.gender = data['gender']
        if 'mobile' in data:
            user.mobile = data['mobile']
        if 'cnic' in data:
            user.cnic = data['cnic']
        if 'address' in data:
            user.address = data['address']
        if 'city' in data:
            user.city = data['city']
        if 'country' in data:
            user.country = data['country']
        
        # Update student fields
        if 'batch' in data:
            student.batch = data['batch']
        if 'section' in data:
            student.section = data['section']
        if 'campus' in data:
            student.campus = data['campus']
        if 'status' in data:
            student.status = data['status']
        if 'cgpa' in data:
            student.cgpa = float(data['cgpa'])
        
        db.session.commit()
        
        return jsonify({"message": "Student updated successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@bp.route('/students/<int:student_id>', methods=['DELETE'])
@jwt_required()
@role_required(['admin'])
def delete_student(student_id):
    """Delete a student"""
    try:
        student = Student.query.get(student_id)
        
        if not student:
            return jsonify({"error": "Student not found"}), 404
        
        user = student.user
        
        # Delete user (cascade will delete student and related records)
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({"message": "Student deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

# ==================== FACULTY MANAGEMENT ====================

@bp.route('/faculty', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_all_faculty():
    """Get all faculty members"""
    try:
        faculty_members = Faculty.query.all()
        
        faculty_list = []
        for faculty in faculty_members:
            user = faculty.user
            
            # Count courses taught
            courses_count = Course.query.filter_by(faculty_id=faculty.id).count()
            
            faculty_list.append({
                "id": faculty.id,
                "faculty_id": faculty.faculty_id,
                "name": f"{user.first_name} {user.last_name}".strip(),
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "mobile": user.mobile,
                "department": faculty.department,
                "designation": faculty.designation,
                "salary": float(faculty.salary) if faculty.salary else 0.0,
                "joining_date": faculty.joining_date.isoformat() if faculty.joining_date else None,
                "courses_count": courses_count
            })
        
        return jsonify({"faculty": faculty_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/faculty', methods=['POST'])
@jwt_required()
@role_required(['admin'])
def create_faculty():
    """Create a new faculty member"""
    data = request.get_json()
    
    try:
        # Validate required fields
        if not data.get('faculty_id'):
            return jsonify({"error": "Faculty ID is required"}), 400
        
        username = data.get('username', f"faculty_{data['faculty_id']}")
        email = data.get('email', f"{data['faculty_id']}@faculty.com")
        
        # Check if username exists
        if User.query.filter_by(username=username).first():
            return jsonify({"error": "Username already exists"}), 400
        
        # Check if email exists
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already exists"}), 400
        
        # Check if faculty_id exists
        if Faculty.query.filter_by(faculty_id=data['faculty_id']).first():
            return jsonify({"error": "Faculty ID already exists"}), 400
        
        # Create user
        user = User(
            username=username,
            email=email,
            role='faculty',
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            mobile=data.get('mobile'),
            gender=data.get('gender'),
            cnic=data.get('cnic')
        )
        user.set_password(data.get('password', 'faculty123'))
        
        db.session.add(user)
        db.session.flush()
        
        # Create faculty
        faculty = Faculty(
            user_id=user.id,
            faculty_id=data['faculty_id'],
            department=data.get('department', ''),
            designation=data.get('designation', ''),
            salary=float(data.get('salary', 0)),
            joining_date=datetime.now().date()
        )
        
        db.session.add(faculty)
        db.session.commit()
        
        return jsonify({
            "message": "Faculty created successfully", 
            "id": faculty.id,
            "faculty_id": faculty.faculty_id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@bp.route('/faculty/<int:faculty_id>', methods=['PUT'])
@jwt_required()
@role_required(['admin'])
def update_faculty(faculty_id):
    """Update faculty information"""
    data = request.get_json()
    
    try:
        faculty = Faculty.query.get(faculty_id)
        
        if not faculty:
            return jsonify({"error": "Faculty not found"}), 404
        
        user = faculty.user
        
        # Update user fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'email' in data:
            existing = User.query.filter_by(email=data['email']).first()
            if existing and existing.id != user.id:
                return jsonify({"error": "Email already exists"}), 400
            user.email = data['email']
        if 'mobile' in data:
            user.mobile = data['mobile']
        
        # Update faculty fields
        if 'department' in data:
            faculty.department = data['department']
        if 'designation' in data:
            faculty.designation = data['designation']
        if 'salary' in data:
            faculty.salary = float(data['salary'])
        
        db.session.commit()
        
        return jsonify({"message": "Faculty updated successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@bp.route('/faculty/<int:faculty_id>', methods=['DELETE'])
@jwt_required()
@role_required(['admin'])
def delete_faculty(faculty_id):
    """Delete a faculty member"""
    try:
        faculty = Faculty.query.get(faculty_id)
        
        if not faculty:
            return jsonify({"error": "Faculty not found"}), 404
        
        # Check if faculty has assigned courses
        courses_count = Course.query.filter_by(faculty_id=faculty.id).count()
        if courses_count > 0:
            return jsonify({
                "error": f"Cannot delete faculty. They have {courses_count} assigned course(s). Please reassign courses first."
            }), 400
        
        user = faculty.user
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({"message": "Faculty deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

# ==================== COURSE MANAGEMENT ====================

@bp.route('/courses', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_all_courses():
    """Get all courses"""
    try:
        courses = Course.query.all()
        
        course_list = []
        for course in courses:
            faculty_name = ""
            if course.faculty:
                user = User.query.get(course.faculty.user_id)
                faculty_name = f"{user.first_name} {user.last_name}".strip()
            
            # Count enrolled students
            enrolled_count = Enrollment.query.filter_by(
                course_id=course.id, 
                status='enrolled'
            ).count()
            
            course_list.append({
                "id": course.id,
                "course_code": course.course_code,
                "course_name": course.course_name,
                "credit_hours": course.credit_hours,
                "semester": course.semester,
                "room_number": course.room_number,
                "faculty_id": course.faculty_id,
                "faculty_name": faculty_name,
                "enrolled_students": enrolled_count
            })
        
        return jsonify({"courses": course_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/courses', methods=['POST'])
@jwt_required()
@role_required(['admin'])
def create_course():
    """Create a new course"""
    data = request.get_json()
    
    try:
        # Validate required fields
        if not data.get('course_code'):
            return jsonify({"error": "Course code is required"}), 400
        if not data.get('course_name'):
            return jsonify({"error": "Course name is required"}), 400
        if not data.get('credit_hours'):
            return jsonify({"error": "Credit hours is required"}), 400
        
        # Check if course code exists
        if Course.query.filter_by(course_code=data['course_code']).first():
            return jsonify({"error": "Course code already exists"}), 400
        
        # Validate faculty if provided
        if data.get('faculty_id'):
            faculty = Faculty.query.get(data['faculty_id'])
            if not faculty:
                return jsonify({"error": "Faculty not found"}), 404
        
        course = Course(
            course_code=data['course_code'],
            course_name=data['course_name'],
            credit_hours=int(data['credit_hours']),
            faculty_id=data.get('faculty_id'),
            semester=data.get('semester', ''),
            room_number=data.get('room_number', '')
        )
        
        db.session.add(course)
        db.session.commit()
        
        return jsonify({
            "message": "Course created successfully", 
            "id": course.id,
            "course_code": course.course_code
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@bp.route('/courses/<int:course_id>', methods=['PUT'])
@jwt_required()
@role_required(['admin'])
def update_course(course_id):
    """Update course information"""
    data = request.get_json()
    
    try:
        course = Course.query.get(course_id)
        
        if not course:
            return jsonify({"error": "Course not found"}), 404
        
        # Update fields
        if 'course_name' in data:
            course.course_name = data['course_name']
        if 'credit_hours' in data:
            course.credit_hours = int(data['credit_hours'])
        if 'faculty_id' in data:
            if data['faculty_id']:
                faculty = Faculty.query.get(data['faculty_id'])
                if not faculty:
                    return jsonify({"error": "Faculty not found"}), 404
            course.faculty_id = data['faculty_id']
        if 'semester' in data:
            course.semester = data['semester']
        if 'room_number' in data:
            course.room_number = data['room_number']
        
        db.session.commit()
        
        return jsonify({"message": "Course updated successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@bp.route('/courses/<int:course_id>', methods=['DELETE'])
@jwt_required()
@role_required(['admin'])
def delete_course(course_id):
    """Delete a course"""
    try:
        course = Course.query.get(course_id)
        
        if not course:
            return jsonify({"error": "Course not found"}), 404
        
        # Check if course has enrollments
        enrollments_count = Enrollment.query.filter_by(course_id=course.id).count()
        if enrollments_count > 0:
            return jsonify({
                "error": f"Cannot delete course. {enrollments_count} student(s) are enrolled. Please remove enrollments first."
            }), 400
        
        db.session.delete(course)
        db.session.commit()
        
        return jsonify({"message": "Course deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

# ==================== FEE MANAGEMENT ====================

@bp.route('/fees', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_all_fees():
    """Get all fee records"""
    try:
        fees = Fee.query.order_by(Fee.due_date.desc()).all()
        
        fee_list = []
        for fee in fees:
            student = fee.student
            user = student.user
            
            fee_list.append({
                "id": fee.id,
                "student_id": student.student_id,
                "student_name": f"{user.first_name} {user.last_name}".strip(),
                "challan_number": fee.challan_number,
                "amount": float(fee.amount),
                "due_date": fee.due_date.isoformat(),
                "paid_date": fee.paid_date.isoformat() if fee.paid_date else None,
                "status": fee.status,
                "semester": fee.semester,
                "description": fee.description
            })
        
        return jsonify({"fees": fee_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/fees', methods=['POST'])
@jwt_required()
@role_required(['admin'])
def create_fee():
    """Create a new fee record"""
    data = request.get_json()
    
    try:
        # Validate required fields
        if not data.get('student_id'):
            return jsonify({"error": "Student ID is required"}), 400
        if not data.get('amount'):
            return jsonify({"error": "Amount is required"}), 400
        if not data.get('due_date'):
            return jsonify({"error": "Due date is required"}), 400
        
        # Find student by student_id (not database id)
        student = Student.query.filter_by(student_id=data['student_id']).first()
        if not student:
            return jsonify({"error": "Student not found"}), 404
        
        # Generate challan number if not provided
        challan_number = data.get('challan_number')
        if not challan_number:
            # Generate unique challan number
            import random
            challan_number = f"CH-{datetime.now().year}-{random.randint(1000, 9999)}"
        
        # Check if challan number exists
        if Fee.query.filter_by(challan_number=challan_number).first():
            return jsonify({"error": "Challan number already exists"}), 400
        
        fee = Fee(
            student_id=student.id,
            challan_number=challan_number,
            amount=float(data['amount']),
            due_date=datetime.strptime(data['due_date'], '%Y-%m-%d').date(),
            semester=data.get('semester', ''),
            description=data.get('description', ''),
            status='pending'
        )
        
        db.session.add(fee)
        db.session.commit()
        
        return jsonify({
            "message": "Fee record created successfully",
            "id": fee.id,
            "challan_number": fee.challan_number
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@bp.route('/fees/<int:fee_id>/mark-paid', methods=['PUT'])
@jwt_required()
@role_required(['admin'])
def mark_fee_paid(fee_id):
    """Mark a fee as paid"""
    try:
        fee = Fee.query.get(fee_id)
        
        if not fee:
            return jsonify({"error": "Fee record not found"}), 404
        
        if fee.status == 'paid':
            return jsonify({"message": "Fee is already marked as paid"}), 200
        
        fee.status = 'paid'
        fee.paid_date = datetime.now().date()
        
        db.session.commit()
        
        return jsonify({"message": "Fee marked as paid successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@bp.route('/fees/<int:fee_id>', methods=['DELETE'])
@jwt_required()
@role_required(['admin'])
def delete_fee(fee_id):
    """Delete a fee record"""
    try:
        fee = Fee.query.get(fee_id)
        
        if not fee:
            return jsonify({"error": "Fee record not found"}), 404
        
        db.session.delete(fee)
        db.session.commit()
        
        return jsonify({"message": "Fee record deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

# ==================== DEPARTMENTS (Mock endpoint) ====================

@bp.route('/departments', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_departments():
    """Get all departments - Mock implementation"""
    # Since you don't have a departments table, return hardcoded departments
    # Or you can get unique batches/departments from students
    try:
        departments = [
            {"id": "CS", "name": "Computer Science", "code": "CS", "description": "Computer Science Department"},
            {"id": "EE", "name": "Electrical Engineering", "code": "EE", "description": "Electrical Engineering Department"},
            {"id": "ME", "name": "Mechanical Engineering", "code": "ME", "description": "Mechanical Engineering Department"},
            {"id": "CE", "name": "Civil Engineering", "code": "CE", "description": "Civil Engineering Department"},
            {"id": "BBA", "name": "Business Administration", "code": "BBA", "description": "Business Administration Department"},
        ]
        
        return jsonify({"departments": departments}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500