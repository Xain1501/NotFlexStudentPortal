"""
Database Setup and Repair Script
Run this script to:
1. Initialize fresh database OR
2. Fix existing database OR  
3. Load seed data

Usage:
    python setup_database.py                    # Interactive mode
    python setup_database.py --fresh            # Fresh install with seed data
    python setup_database.py --fix              # Fix existing database
    python setup_database.py --seed             # Load seed data only
"""

import os
import sys
import argparse

# Add parent directory to path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.database.connection import get_connection, create_database_if_not_exists, DB_CONFIG


def run_sql_file(filepath, description):
    """Execute SQL file"""
    try:
        print(f"\n🔄 {description}...")
        
        if not os.path.exists(filepath):
            print(f"❌ File not found: {filepath}")
            return False
        
        with open(filepath, 'r', encoding='utf-8') as f:
            sql_script = f.read()
        
        conn = get_connection()
        cursor = conn.cursor()
        
        # Split by semicolon and execute each statement
        statements = [s.strip() for s in sql_script.split(';') if s.strip()]
        
        for i, statement in enumerate(statements):
            # Skip comments and empty statements
            if not statement or statement.startswith('--'):
                continue
            
            try:
                cursor.execute(statement)
                if i % 50 == 0 and i > 0:
                    print(f"  Executed {i}/{len(statements)} statements...")
            except Exception as e:
                error_msg = str(e).lower()
                # Ignore duplicate/already exists errors
                if 'duplicate' not in error_msg and 'already exists' not in error_msg:
                    print(f"  ⚠️  Warning on statement {i}: {e}")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ {description} completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def fresh_install():
    """Fresh database installation with seed data"""
    print("\n" + "="*60)
    print("🆕 FRESH DATABASE INSTALLATION")
    print("="*60)
    
    # Ensure database exists
    create_database_if_not_exists()
    
    # Run schema
    schema_path = os.path.join(os.path.dirname(__file__), 'database', 'schema.sql')
    if not run_sql_file(schema_path, "Creating database schema"):
        return False
    
    # Run seed data
    seed_path = os.path.join(os.path.dirname(__file__), 'database', 'seed_data.sql')
    if not run_sql_file(seed_path, "Loading seed data"):
        return False
    
    print("\n" + "="*60)
    print("✅ DATABASE SETUP COMPLETE!")
    print("="*60)
    print_login_info()
    return True


def fix_existing():
    """Fix existing database"""
    print("\n" + "="*60)
    print("🔧 FIXING EXISTING DATABASE")
    print("="*60)
    
    fix_path = os.path.join(os.path.dirname(__file__), 'database', 'fix_existing_db.sql')
    if not run_sql_file(fix_path, "Applying database fixes"):
        return False
    
    print("\n" + "="*60)
    print("✅ DATABASE FIXED SUCCESSFULLY!")
    print("="*60)
    print("\n💡 Your existing data has been preserved.")
    print("   Foreign keys, missing columns, and data integrity issues have been fixed.")
    return True


def load_seed_data():
    """Load seed data only"""
    print("\n" + "="*60)
    print("📊 LOADING SEED DATA")
    print("="*60)
    
    seed_path = os.path.join(os.path.dirname(__file__), 'database', 'seed_data.sql')
    if not run_sql_file(seed_path, "Loading seed data"):
        return False
    
    print("\n" + "="*60)
    print("✅ SEED DATA LOADED!")
    print("="*60)
    print_login_info()
    return True


def print_login_info():
    """Print default login credentials"""
    print("\n📝 DEFAULT LOGIN CREDENTIALS:")
    print("-" * 60)
    print("ADMIN:")
    print("  Username: admin")
    print("  Password: password123")
    print()
    print("FACULTY (10 available):")
    print("  Usernames: 24f-001 to 24f-005, 23f-001 to 23f-005")
    print("  Password: password123")
    print("  Example: 24f-001 (John Smith)")
    print()
    print("STUDENTS (20 available):")
    print("  Usernames: 24k-001 to 24k-007 (2024 batch)")
    print("  Usernames: 23k-001 to 23k-007 (2023 batch)")
    print("  Usernames: 22k-001 to 22k-006 (2022 batch)")
    print("  Password: password123")
    print("  Example: 24k-001 (Alice Anderson)")
    print("-" * 60)


def verify_database():
    """Verify database setup"""
    try:
        print("\n🔍 Verifying database...")
        conn = get_connection()
        cursor = conn.cursor()
        
        # Check tables
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print(f"  ✓ Found {len(tables)} tables")
        
        # Check counts
        counts = {}
        important_tables = ['users', 'students', 'faculty', 'courses', 'course_sections', 'enrollments']
        
        for table in important_tables:
            try:
                cursor.execute(f"SELECT COUNT(*) as cnt FROM {table}")
                result = cursor.fetchone()
                counts[table] = result['cnt'] if result else 0
            except:
                counts[table] = 0
        
        print("\n📊 Table Counts:")
        for table, count in counts.items():
            status = "✓" if count > 0 else "⚠️"
            print(f"  {status} {table}: {count}")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False


def interactive_menu():
    """Interactive menu for database setup"""
    print("\n" + "="*60)
    print("🗄️  STUDENT PORTAL DATABASE SETUP")
    print("="*60)
    print(f"\nDatabase Configuration:")
    print(f"  Host: {DB_CONFIG['host']}")
    print(f"  Port: {DB_CONFIG['port']}")
    print(f"  Database: {DB_CONFIG['database']}")
    print(f"  User: {DB_CONFIG['user']}")
    
    print("\nWhat would you like to do?\n")
    print("1. 🆕 Fresh Install (Delete everything and start fresh)")
    print("2. 🔧 Fix Existing Database (Keep data, fix issues)")
    print("3. 📊 Load Seed Data Only (Add sample data)")
    print("4. 🔍 Verify Database Setup")
    print("5. ❌ Exit")
    
    while True:
        try:
            choice = input("\nEnter your choice (1-5): ").strip()
            
            if choice == '1':
                confirm = input("\n⚠️  This will DELETE all existing data. Continue? (yes/no): ").lower()
                if confirm == 'yes':
                    fresh_install()
                    verify_database()
                else:
                    print("❌ Operation cancelled")
                break
                
            elif choice == '2':
                fix_existing()
                verify_database()
                break
                
            elif choice == '3':
                load_seed_data()
                verify_database()
                break
                
            elif choice == '4':
                verify_database()
                break
                
            elif choice == '5':
                print("\n👋 Goodbye!")
                break
                
            else:
                print("❌ Invalid choice. Please enter 1-5.")
                
        except KeyboardInterrupt:
            print("\n\n❌ Operation cancelled by user")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")
            break


def main():
    parser = argparse.ArgumentParser(description='Database Setup and Repair Script')
    parser.add_argument('--fresh', action='store_true', help='Fresh install with seed data')
    parser.add_argument('--fix', action='store_true', help='Fix existing database')
    parser.add_argument('--seed', action='store_true', help='Load seed data only')
    parser.add_argument('--verify', action='store_true', help='Verify database setup')
    
    args = parser.parse_args()
    
    # Check if any flag was provided
    if args.fresh:
        fresh_install()
        verify_database()
    elif args.fix:
        fix_existing()
        verify_database()
    elif args.seed:
        load_seed_data()
        verify_database()
    elif args.verify:
        verify_database()
    else:
        # No flags provided, show interactive menu
        interactive_menu()


if __name__ == '__main__':
    main()
