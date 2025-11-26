# Student Portal Backend (FinalBackend)

Quick setup and test instructions

Prerequisites:
- Python 3.11+ (Use your system's Python issuer, e.g., `python` or `python3`)
- MySQL 8.x (or MariaDB compatible)

1) Environment variables
 - Copy `.env.example` in `Backend/` to a `.env` file and fill in values (DB connection string, SECRET_KEY).
 - Copy `.env.example` in `Backend/` to a `.env` file and fill in values (DB connection string, SECRET_KEY).
	 - Or run the helper script to interactively create `.env` (cross-platform):
		 - `python tools/create_env.py` (or pass `--db_host`, `--db_user`, etc.)
 - Alternatively set env vars: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, SECRET_KEY, JWT_SECRET.

2) Initialize DB
- Ensure DB is reachable and credentials in `.env` are correct.
- Run:
```powershell
python main.py
```
This will initialize the DB schema and start the Flask server on `http://localhost:5000`.

3) Running tests
 - Install pytest and the dev requirements:
 ```powershell
 - Use the project-level requirements file (recommended):
	 - `pip install -r Backend\requirements.txt`
 
 - The `Backend\database\requirments.txt` file still exists (with pytest & python-dotenv), but we recommend using `Backend/requirements.txt` so your IDE (like Pylance) can find installed packages with the selected interpreter.
 ```powershell
 pip install -r Backend\database\requirements.txt
```
- Run tests:
```powershell
pytest -q
```

4) Notes to Frontend Integration
- JWT token must be sent in `Authorization: Bearer <token>` header for protected endpoints.
- For local dev, CORS allows `http://localhost:5173`.

5) Important Info
- `main.py` now imports `Backend.website` and `Backend.database.connection` to avoid path issues.
- For VSCode, `.vscode/settings.json` adds `Backend` as an `extraPath` so Pylance resolves imports. If you still see missing import errors, add `Backend` to your workspace or configure `PYTHONPATH`.
