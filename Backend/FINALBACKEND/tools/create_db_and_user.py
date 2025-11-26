"""
Create the application database and an app user with limited privileges.
Runs with: venv\Scripts\python.exe tools\create_db_and_user.py --app_user portal_app --app_pass <password> --grant 'SELECT,INSERT,UPDATE,DELETE'
If app_pass is omitted, the script generates a strong password.
"""
import os, sys, argparse, secrets
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.append(ROOT)
from Backend.database import connection as c
import pymysql

parser = argparse.ArgumentParser()
parser.add_argument('--app_user', default='portal_app')
parser.add_argument('--app_pass')
parser.add_argument('--grant', default='SELECT,INSERT,UPDATE,DELETE')
parser.add_argument('--write_env', action='store_true', help='Write updated DB_USER/DB_PASSWORD to Backend/.env')
args = parser.parse_args()

app_user = args.app_user
app_pass = args.app_pass or secrets.token_urlsafe(12)
grant = args.grant

DB = c.DB_CONFIG
print('Using DB_CONFIG from connection module')
print(DB)
try:
    admin_conn = pymysql.connect(host=DB['host'], user=DB['user'], password=DB['password'], port=DB['port'], charset=DB['charset'], cursorclass=DB['cursorclass'], autocommit=True)
    with admin_conn.cursor() as cur:
        print('Creating database (if not exists):', DB['database'])
        cur.execute(f"CREATE DATABASE IF NOT EXISTS `{DB['database']}` DEFAULT CHARACTER SET utf8mb4")
        print('Database ensured')
        # Create user
        print('Creating app user (if not exists):', app_user)
        cur.execute(f"CREATE USER IF NOT EXISTS %s@%s IDENTIFIED BY %s", (app_user, DB['host'], app_pass))
        # Grant privileges on the database
        cur.execute(f"GRANT {grant} ON `{DB['database']}`.* TO %s@%s", (app_user, DB['host']))
        cur.execute("FLUSH PRIVILEGES")
        print('Grants applied')
    admin_conn.close()
    print('\nNew DB user created:')
    print('  user:', app_user)
    print('  password:', app_pass)
    if args.write_env:
        env_path = os.path.join(ROOT, 'Backend', '.env')
        if not os.path.exists(env_path):
            print(env_path, 'not found - create one first')
        else:
            with open(env_path, 'r', encoding='utf-8') as f:
                lines = f.read().splitlines()
            # update DB_USER / DB_PASSWORD
            out = []
            for line in lines:
                if line.startswith('DB_USER='):
                    out.append(f'DB_USER={app_user}')
                elif line.startswith('DB_PASSWORD='):
                    out.append(f'DB_PASSWORD={app_pass}')
                else:
                    out.append(line)
            with open(env_path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(out))
            print('Updated Backend/.env with new app user')
    sys.exit(0)
except Exception as e:
    print('Error creating DB / user:', type(e).__name__, e)
    sys.exit(1)
