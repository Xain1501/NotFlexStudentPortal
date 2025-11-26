#!/usr/bin/env python3
"""
Create or update Backend/.env interactively or via CLI args
Usage:
  python tools/create_env.py --db_host localhost --db_port 3307 --db_name student_portal --db_user portal_app --db_password Portal@1234! --secret_key somesecret --jwt_secret yourjwt
or interactive prompt
"""
import os
import sys
import argparse

parser = argparse.ArgumentParser(description='Create Backend/.env from provided values or prompt')
parser.add_argument('--db_host')
parser.add_argument('--db_port')
parser.add_argument('--db_name')
parser.add_argument('--db_user')
parser.add_argument('--db_password')
parser.add_argument('--secret_key')
parser.add_argument('--jwt_secret')
parser.add_argument('--force', action='store_true')
args = parser.parse_args()

env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'Backend', '.env')

if os.path.exists(env_path) and not args.force:
    print(f'{env_path} already exists; use --force to overwrite')
    sys.exit(1)

values = {}
values['DB_HOST'] = args.db_host or input('DB_HOST (localhost): ') or 'localhost'
values['DB_PORT'] = args.db_port or input('DB_PORT (3307): ') or '3307'
values['DB_NAME'] = args.db_name or input('DB_NAME (student_portal): ') or 'student_portal'
values['DB_USER'] = args.db_user or input('DB_USER (portal_app): ') or 'portal_app'
values['DB_PASSWORD'] = args.db_password or input('DB_PASSWORD: ')
values['SECRET_KEY'] = args.secret_key or input('SECRET_KEY (cx fallback): ') or 'change-me'
values['JWT_SECRET'] = args.jwt_secret or input('JWT_SECRET (same as SECRET_KEY recommended): ') or values['SECRET_KEY']

# Write .env
lines = [f"{k}={v}" for k, v in values.items()]
with open(env_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
print(f'Wrote {env_path}')
print('Remember to add Backend/.env to .gitignore (already present) and DO NOT COMMIT secrets to git.')
