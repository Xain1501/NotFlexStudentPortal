import os, sys
# Add project root to sys.path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)
from Backend.database.connection import execute_query

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
