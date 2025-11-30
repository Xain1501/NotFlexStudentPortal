from app.database.connection import execute_query

try:
    execute_query("CREATE TABLE IF NOT EXISTS student_code_seq (year_small INT PRIMARY KEY, last_seq INT DEFAULT 0)", fetch=False)
    print('Created table student_code_seq')
except Exception as e:
    print('Error creating student_code_seq:', e)

try:
    execute_query("CREATE TABLE IF NOT EXISTS faculty_code_seq (year_small INT PRIMARY KEY, last_seq INT DEFAULT 0)", fetch=False)
    print('Created table faculty_code_seq')
except Exception as e:
    print('Error creating faculty_code_seq:', e)
