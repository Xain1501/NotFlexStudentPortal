"""
Main Application Entry Point
Run this file to start the server
"""
import os
from dotenv import load_dotenv

# Load .env from the app folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, 'app', '.env'))

from app.website import create_app
from app.database.connection import init_db

# Create Flask app instance
app = create_app()

# Initialize database (creates tables if they don't exist)
with app.app_context():
    print(" Initializing database...")
    init_db()
    print(" Database ready!")

if __name__ == '__main__':
    print("=" * 50)
    print(" Starting Student Portal Backend Server")
    print("=" * 50)
    print(" Server running at: http://localhost:5000")
    print(" React frontend should run at: http://localhost:5173")
    print("=" * 50)

    # Run the Flask development server
    app.run(
        debug=True,          # Auto reload
        host='0.0.0.0',      # Accessible on LAN
        port=5000
    )
