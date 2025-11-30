# Frontend Integration Guide

## Overview
This document helps frontend developers integrate with the Student Portal app. It summarizes authentication, the main API endpoints, request/response formats, environment configuration, and recommended security improvements.

Base URL: http://localhost:5000
React dev UI (default): http://localhost:5173

---

## Quick Start (local dev)
1. Install dependencies:
   - Create a virtualenv and install requirements: `pip install -r Backend/database/requirments.txt` (or `pip install -r Backend/requirments.txt` depending on your environment)
2. Copy `.env.example` to `.env` under the `Backend/` folder and update values
   - `cp .env.example .env` (PowerShell: `Copy-Item .env.example .env`) and fill in the database and secret values.
3. Start backend server from project root:
   - `python main.py`
4. The server initializes the database (schema + migrations) automatically and seeds if you run seed scripts.

---

## Environment Variables (configuration layer)
The backend supports environment-based configuration. By default, `main.py` loads `Backend/.env` using `dotenv`.

Required environment variables (used across code):
- DB_HOST (default: `localhost`)
- DB_PORT (default: `3307`)
- DB_NAME (default: `student_portal`)
- DB_USER (default: `root`)
- DB_PASSWORD (default: `muzukashi1234@` in code) — *replace in `.env`* for dev and production
- SECRET_KEY — Flask app session secret (used in `Backend/website/__init__.py`)
- JWT_SECRET — Recommended for JWT tokens (currently `Backend/website/auth.py` has a hard-coded secret; set `JWT_SECRET` to use this with a small code change described below)

Important config & notes:
- `main.py` runs `load_dotenv(...)` so `.env` in `Backend/` will be loaded automatically during development.
- `Backend/database/connection.py` reads DB credentials from environment variables.
- `Backend/website/init.py` reads `SECRET_KEY` from environment variable with a fallback default string.

Security note: Do NOT commit `.env` to source control — add it to `.gitignore`. There isn't a `.gitignore` in the project root as of now; please add one.

---

## JWT / Auth
- Login endpoint: `POST /api/auth/login` — body: `{ "username": "...", "password": "..." }`
  - Successful response: `{ success: true, message: 'Login successful!', data: { token: '<jwt>', user: { user_id, username, email, role } } }`
- Token usage: Set `Authorization` header with `Bearer <token>` for protected endpoints.
- Important: `auth.py` currently defines `SECRET_KEY = 'your-secret-key-change-in-production'` inside the module. To use the `JWT_SECRET` environment variable and have safer secret management, we recommend replacing that line with something like:

```python
import os
from flask import current_app
JWT_SECRET = os.getenv('JWT_SECRET', current_app.config.get('SECRET_KEY'))
```

However, if referencing `current_app` outside of request context, use `os.getenv('JWT_SECRET')` or set `JWT_SECRET` into `app.config` at startup (see `create_app()` changes below).

---

## App Configuration & Improvements (Recommended)
- Move hard-coded secrets to env variables:
  - Replace `auth.py` local `SECRET_KEY` constant with `os.getenv('JWT_SECRET')` and/or use `current_app.config['SECRET_KEY']`.
- Passwords should be hashed in production (e.g., `bcrypt`, `passlib`). Current code stores `password_hash` but uses plain text in tests; update `UserModel.authenticate_user()` to compare hashed passwords.
- Add `.gitignore` with `.env` and other local files to avoid leaking secrets.
- Consider a secrets manager for production (Azure Key Vault, AWS Secrets Manager, or HashiCorp Vault).
- Add a migration tool (Alembic/Flask-Migrate) for production DB management.

---

## CORS
CORS is enabled in `create_app()` with allowed origins:
- http://localhost:5173
- http://127.0.0.1:5173
- http://localhost:5000
- http://127.0.0.1:5000

This should be fine for development. For production set `origins` to your frontend domain.

---

## API Conventions & Error Handling
- Responses generally follow:
  - `{ success: Boolean, message: String, data?: Object }`
  - HTTP status codes: 2xx success, 4xx client errors, 5xx server errors.
- When token is missing/invalid: 401 with `{'success': False, 'message': 'Token is missing!|Token has expired', 'error_code': 'TOKEN_MISSING|TOKEN_EXPIRED'}`

---

## Key Endpoints (Minimal set for frontend)
### Auth
- POST /api/auth/login — body: `{ username, password }` — returns { token }
- POST /api/auth/register — body: `{ username, password, email, role }` — registers user
- GET /api/auth/me — header: `Authorization: Bearer <token>` — returns user info

### Health
- GET /api/health — public — `{ success: true, status: 'ok' }`

### Student (needs `Authorization` and `role: 'student'`)
- GET /api/student/dashboard — returns profile, enrolled courses, announcements
- GET /api/student/transcript — returns CGPA, semesters
- GET /api/student/marks — returns marks list
- GET /api/student/attendance — returns attendance summary
- GET /api/student/fees — returns fees records
- GET /api/student/courses/enrolled — list of sections
- POST /api/student/courses/enroll — body: `{ "section_id": <id> }`
- POST /api/student/courses/unenroll — body: `{ "section_id": <id> }`

### Faculty (needs `Authorization` and `role: 'faculty'`)
- GET /api/faculty/dashboard — personal info, teaching courses
- POST /api/faculty/leave/apply — `{ leave_date, reason }`
- GET /api/faculty/leaves — list leaves
- GET /api/faculty/announcements — list faculty announcements
- POST /api/faculty/announcements — `{section_id, title, message }`
- GET /api/faculty/courses/<section_id>/students — list students
- POST /api/faculty/attendance/mark — `{ student_id, section_id, date, status }`
- POST /api/faculty/marks/upload — `{ enrollment_id, marks: { quiz_marks, assignment1_marks, midterm_marks, final_marks, ... } }`

### Courses (shared / public for listing; auth required for actions)
- GET /api/courses/available?semester=Fall&year=2024 — list available sections for a semester
- GET /api/courses/check-seats?section_id=<id> — check seats
- POST /api/courses/enroll — student enrollment endpoint — same as /api/student/courses/enroll

### Admin (needs `Authorization` and `role: 'admin'`)
- GET /api/admin/dashboard — stats summary
- GET /api/admin/users — list of users
- POST /api/admin/users — (not present — use `register`) create user? Admin uses `POST /api/admin/students` or `POST /api/admin/faculty` to create profiles
- POST /api/admin/departments — `{ dept_code, dept_name }`
- POST /api/admin/courses — `{ course_code, course_name, credits, fee_per_credit, department_id? }`
- POST /api/admin/course_sections — `{ course_id, faculty_id, section_code, semester, year, schedule, room, max_capacity }`
- POST /api/admin/enroll-student — `{ student_id, section_id }`
- POST /api/admin/fees — `{ student_id, semester, amount_due, due_date }`
- Staff: GET /api/admin/faculty, POST /api/admin/faculty, PUT /api/admin/faculty/<id>
- GET /api/admin/announcements — public for admin announcements

There are many more admin endpoints — see the `Backend/website/views.py` file for a complete list.

---

## Sample cURL Flows
Authenticate and call Student Dashboard:

```bash
# Login
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"adminpass"}'

# Assuming the login response returns token in data.token, call dashboard
curl -s -X GET http://localhost:5000/api/student/dashboard \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

Enroll a student in a course:
```bash
curl -s -X POST http://localhost:5000/api/student/courses/enroll \
  -H "Authorization: Bearer <studentToken>" \
  -H "Content-Type: application/json" \
  -d '{"section_id": 123}'
```

Create a course (Admin only):
```bash
curl -s -X POST http://localhost:5000/api/admin/courses \
  -H "Authorization: Bearer <adminToken>" \
  -H "Content-Type: application/json" \
  -d '{"course_code":"CS101","course_name":"Intro to CS","credits":3, "fee_per_credit":10000}'
```

---

## Recommendations for Frontend Team
- Use a global HTTP request utility to manage the Authorization header (Bearer token).
- Respect API response patterns and status codes; handle `401` (login and token expiry) and `403` for role-based access.
- Use request retries for idempotent GET endpoints; use proper error handling for POST/PUT.
- For local development use `Backend/.env` and the seed script `tools/seed_db.py` for quick sample data.

---

## Next Steps & Improvements (optional)
- Update `Backend/website/auth.py` to use environment variable `JWT_SECRET` instead of hard-coded key.
- Add `bcrypt` password hashing and update `UserModel.authenticate_user()` accordingly.
- Add `.gitignore` with `.env`, `__pycache__`, `.vscode`, etc.
- Optionally add OpenAPI/Swagger docs for precise types and example responses.

---

If you'd like, I can implement the JWT env-variable improvement and add the `FRONTEND_INTEGRATION.md` file to the repo (already done). I can also add a minimal Postman collection if you want.
