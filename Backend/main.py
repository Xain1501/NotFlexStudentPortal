"""
Main Application Entry Point
Run this file to start the server
"""

from Backend.website import create_app
from Backend.database.connection import init_db

# Create Flask app
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
    print("React frontend should run at: http://localhost:5173")
    print("=" * 50)
    
    # Run the Flask development server
    app.run(
        debug=True,      # Enable debug mode (auto-reload on code changes)
        host='0.0.0.0',  # Make server accessible from network
        port=5000        # Port number
    )