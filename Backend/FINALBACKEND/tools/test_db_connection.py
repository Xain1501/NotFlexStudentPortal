"""
Quick diagnostic script to test MySQL connectivity and privileges using DB_CONFIG in code.
Run with: .venv\Scripts\python.exe tools\test_db_connection.py
"""
import sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
from Backend.database import connection as c
import pymysql

print('Using DB_CONFIG:', c.DB_CONFIG)
try:
    conn = pymysql.connect(host=c.DB_CONFIG['host'], user=c.DB_CONFIG['user'], password=c.DB_CONFIG['password'], port=c.DB_CONFIG['port'], connect_timeout=10)
    print('Connected to server OK')
    with conn.cursor() as cur:
        cur.execute('SELECT CURRENT_USER() as cur, USER() as user, VERSION() as version')
        print('User info:', cur.fetchone())
        try:
            cur.execute('SHOW GRANTS FOR CURRENT_USER()')
            print('Grants:')
            for row in cur.fetchall():
                print(' -', row[0])
        except Exception as e:
            print('Could not SHOW GRANTS (permissions may restrict):', e)
    conn.close()
except Exception as e:
    print('Connection error:', type(e).__name__, e)
    sys.exit(1)
