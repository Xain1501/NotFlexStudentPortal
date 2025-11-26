import os
import pymysql
from pymysql import Error
from contextlib import contextmanager

# DB config - prefer environment variables for Codespace/production
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'portal_app'),
    'password': os.getenv('DB_PASSWORD', 'Portal@1234!'),
    'database': os.getenv('DB_NAME', 'student_portal'),
    'port': int(os.getenv('DB_PORT', 3307)),
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

def create_database_if_not_exists():
    try:
        connection = pymysql.connect(
            host=DB_CONFIG['host'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            port=DB_CONFIG['port'],
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True
        )
        with connection.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_CONFIG['database']}` DEFAULT CHARACTER SET utf8mb4;")
            print(f"✓ Database '{DB_CONFIG['database']}' is ready")
        connection.close()
    except Error as e:
        print(f"Error creating database: {e}")
        # re-raise so caller can decide whether to continue without DB creation privileges
        raise

def get_connection():
    return pymysql.connect(
        host=DB_CONFIG['host'],
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password'],
        database=DB_CONFIG['database'],
        port=DB_CONFIG['port'],
        charset=DB_CONFIG['charset'],
        cursorclass=DB_CONFIG['cursorclass'],
        autocommit=False
    )

def execute_query(query, params=None, fetch=True):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, params or ())
            if fetch:
                rows = cursor.fetchall()
                conn.commit()
                return rows
            else:
                conn.commit()
                return None
    except Exception as e:
        conn.rollback()
        print(f"Query error: {e}\nQuery: {query}\nParams: {params}")
        raise
    finally:
        conn.close()

@contextmanager
def transaction():
    """
    Yields (conn, cursor) inside a transaction context. Use SELECT ... FOR UPDATE here.
    Example:
        with transaction() as (conn, cursor):
            cursor.execute("SELECT ... FOR UPDATE", (...,))
            ...
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            yield conn, cursor
            conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    """Initialize DB from schema.sql (keeps your existing init behavior)

    Returns True if initialization was successful (schema created or already present).
    Returns False if initialization could not be completed due to permission/connection issues.
    """
    try:
        # Optionally skip CREATE DATABASE step (useful in CI/prod where DB is pre-provisioned)
        skip_create = os.getenv('SKIP_DB_CREATE', '0') in ('1', 'true', 'TRUE')
        if not skip_create:
            create_database_if_not_exists()
        else:
            print('SKIP_DB_CREATE enabled: Skipping CREATE DATABASE step')
        print("🔄 Initializing database schema...")
        schema_path = os.path.join('Backend', 'database', 'schema.sql')
        if not os.path.exists(schema_path):
            schema_path = os.path.join('database', 'schema.sql')
        with open(schema_path, 'r', encoding='utf-8') as f:
            sql_script = f.read()
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        commands = [cmd.strip() for cmd in sql_script.split(';') if cmd.strip()]
        with conn.cursor() as cursor:
            for command in commands:
                if command and not command.strip().startswith('--'):
                    try:
                        cursor.execute(command)
                    except Exception as e:
                        msg = str(e).lower()
                        if 'already exists' not in msg and 'duplicate' not in msg:
                            print(f"Warning executing statement: {e}")
        with conn.cursor() as cursor:
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        conn.commit()
        conn.close()
        # After creating base schema, try to apply any incremental migrations if present
        migrate_path = os.path.join('Backend', 'database', 'migrate_update_schema.sql')
        if not os.path.exists(migrate_path):
            migrate_path = os.path.join('database', 'migrate_update_schema.sql')
        if os.path.exists(migrate_path):
            try:
                print("🔁 Applying DB migrations (if any)...")
                with open(migrate_path, 'r', encoding='utf-8') as mf:
                    mig_script = mf.read()
                conn = get_connection()
                with conn.cursor() as cursor:
                    commands = [cmd.strip() for cmd in mig_script.split(';') if cmd.strip()]
                    for command in commands:
                        if command and not command.strip().startswith('--'):
                            try:
                                cursor.execute(command)
                            except Exception as e:
                                # ignore if already exists or other duplicate errors
                                msg = str(e).lower()
                                if 'already exists' not in msg and 'duplicate' not in msg and 'unknown column' not in msg:
                                    print(f"Warning executing migration statement: {e}")
                conn.commit()
                conn.close()
                print("✓ Migrations applied (if any)")
            except Exception as e:
                print(f"Error applying migrations: {e}")
        print("✓ Database schema initialized successfully")
        # Ensure critical columns exist in case migration parsing failed
        try:
            conn = get_connection()
            with conn.cursor() as cursor:
                # Helper to ensure a column exists
                def ensure_column(table, column_name, column_def_sql):
                    cursor.execute("SELECT COUNT(*) as cnt FROM information_schema.columns WHERE table_schema = %s AND table_name = %s AND column_name = %s", (DB_CONFIG['database'], table, column_name))
                    exists = cursor.fetchone()
                    if exists and exists.get('cnt', 0) == 0:
                        try:
                            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column_def_sql}")
                            print(f"Added missing column {column_name} to {table}")
                        except Exception as e:
                            # If we can't add (permissions or syntax), warn and continue
                            print(f"Warning: could not add column {column_name} to {table}: {e}")

                # Faculty: email, hire_date
                ensure_column('faculty', 'email', "email VARCHAR(100) NULL")
                ensure_column('faculty', 'hire_date', "hire_date DATE NULL")

                # Courses: fee_per_credit, department_id
                ensure_column('courses', 'fee_per_credit', "fee_per_credit DECIMAL(10,2) DEFAULT 10000.00")
                ensure_column('courses', 'department_id', "department_id INT NULL")

                # Students: fee_balance
                ensure_column('students', 'fee_balance', "fee_balance DECIMAL(10,2) DEFAULT 0.00")

                # Fee details: tuition_fee, lab_fee, miscellaneous_fee
                ensure_column('fee_details', 'tuition_fee', "tuition_fee DECIMAL(10,2) DEFAULT 0.00")
                ensure_column('fee_details', 'lab_fee', "lab_fee DECIMAL(10,2) DEFAULT 0.00")
                ensure_column('fee_details', 'miscellaneous_fee', "miscellaneous_fee DECIMAL(10,2) DEFAULT 0.00")
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Warning while ensuring columns after migrations: {e}")
        # Ensure important tables exist (sequence tables for code generation)
        try:
            conn = get_connection()
            with conn.cursor() as cursor:
                def ensure_table(table_name, create_sql):
                    cursor.execute("SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = %s AND table_name = %s", (DB_CONFIG['database'], table_name))
                    exists = cursor.fetchone()
                    if exists and exists.get('cnt', 0) == 0:
                        try:
                            cursor.execute(create_sql)
                            print(f"Created missing table {table_name}")
                        except Exception as e:
                            print(f"Warning: could not create table {table_name}: {e}")

                ensure_table('student_code_seq', 'CREATE TABLE IF NOT EXISTS student_code_seq (year_small INT PRIMARY KEY, last_seq INT DEFAULT 0)')
                ensure_table('faculty_code_seq', 'CREATE TABLE IF NOT EXISTS faculty_code_seq (year_small INT PRIMARY KEY, last_seq INT DEFAULT 0)')
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Warning while ensuring important tables after migrations: {e}")
    except Exception as e:
        # If we fail while creating DB due to access denied, check if DB exists and is accessible
        msg = str(e).lower()
        if 'access denied' in msg or '1045' in msg:
            try:
                # try to connect to the database directly; if successful, we can continue
                conn_test = get_connection()
                conn_test.close()
                print("Notice: DB create/alter failed due to access denied, but the DB is accessible with provided credentials. Continuing with schema operations may still succeed if privileges are sufficient.")
                return True
            except Exception as inner_err:
                print("ERROR: Could not create the database and also could not connect to it with the provided credentials. Please create the database manually or provide a user with CREATE DATABASE privileges.")
                print(f"Original error: {e}")
                print(f"Connection test error: {inner_err}")
                return False
        else:
            print(f"Error initializing database: {e}")
            return False
    # If we reach here without exceptions, return True
    return True