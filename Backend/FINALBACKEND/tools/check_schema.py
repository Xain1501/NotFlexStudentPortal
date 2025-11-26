import os, sys
# Add project root to sys.path so 'Backend' package can be imported when running from tools directory
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)
from Backend.database.connection import execute_query, DB_CONFIG

expected_columns = {
    'faculty': ['hire_date', 'email', 'salary', 'department_id'],
    'courses': ['fee_per_credit', 'department_id'],
    'students': ['fee_balance'],
    'fee_details': ['tuition_fee', 'lab_fee', 'miscellaneous_fee', 'amount_due'],
    'course_sections': ['is_active'],
}
expected_tables = ['student_code_seq', 'faculty_code_seq', 'admin_info']

missing = []
print('Checking tables...')
for t in expected_tables:
    r = execute_query("SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = %s AND table_name = %s", (DB_CONFIG['database'], t))
    cnt = r[0]['cnt'] if r else 0
    if cnt == 0:
        missing.append((t, 'table'))
        print(f"Missing table: {t}")
    else:
        print(f"Found table: {t}")

print('\nChecking columns...')
for table, cols in expected_columns.items():
    for col in cols:
        r = execute_query("SELECT COUNT(*) as cnt FROM information_schema.columns WHERE table_schema = %s AND table_name = %s AND column_name = %s", (DB_CONFIG['database'], table, col))
        cnt = r[0]['cnt'] if r else 0
        if cnt == 0:
            missing.append((f"{table}.{col}", 'column'))
            print(f"Missing column: {table}.{col}")
        else:
            print(f"Found column: {table}.{col}")

if not missing:
    print('\nAll expected tables/columns appear present')
else:
    print('\nSummary: Missing elements:')
    for m in missing:
        print(' -', m[0])
