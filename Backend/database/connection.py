# Backend/database/connection.py
import pymysql
from pymysql import Error

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'zain',
    'database': 'student_portal',
    'port': 3307,
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

def create_database_if_not_exists():
    """Creates database if it doesn't exist"""
    try:
        # Connect without database first
        connection = pymysql.connect(
            host=DB_CONFIG['host'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            port= 3307,
            charset='utf8mb4'
        )
        
        with connection.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_CONFIG['database']}")
            print(f"✓ Database '{DB_CONFIG['database']}' is ready")
            
        connection.close()
        
    except Error as e:
        print(f"Error creating database: {e}")

def execute_query(query, params=None, fetch=True):
    """Execute query - works EXACTLY like your current function"""
    connection = pymysql.connect(**DB_CONFIG)
    
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, params or {})
            
            if fetch:
                result = cursor.fetchall()
                return result
            else:
                connection.commit()
                return None
                
    except Error as e:
        connection.rollback()
        print(f"Query error: {e}")
        raise
    finally:
        connection.close()

# For compatibility with your existing code
def get_db_session():
    """Dummy function - your models don't actually use this"""
    return None

def get_engine():
    """Dummy function - your models don't actually use this"""
    return None

def init_db():
    """Initialize database with schema"""
    try:
        create_database_if_not_exists()
        
        print("🔄 Initializing database schema...")
        
        # Read and execute schema.sql
        with open('database/schema.sql', 'r', encoding='utf-8') as f:
            sql_script = f.read()
            
        connection = pymysql.connect(**DB_CONFIG)
        
        # FORCE DISABLE foreign key checks at connection level
        with connection.cursor() as cursor:
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
        # Split SQL commands
        commands = [cmd.strip() for cmd in sql_script.split(';') if cmd.strip()]
        
        with connection.cursor() as cursor:
            for command in commands:
                if command and not command.startswith('--'):
                    try:
                        cursor.execute(command)
                    except Exception as e:
                        # Ignore "already exists" errors
                        if 'already exists' not in str(e).lower():
                            print(f"Warning: {e}")
        
        # Re-enable at the end
        with connection.cursor() as cursor:
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            
        connection.commit()
        connection.close()
        
        print("✓ Database schema initialized successfully")
        
    except Exception as e:
        print(f"Error initializing database: {e}")