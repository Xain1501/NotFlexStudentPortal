# PowerShell script to bootstrap a dev environment for the project
# Usage: Open PowerShell in the repo root and run: .\tools\setup_dev_env.ps1

$VENV_DIR = ".venv"

Write-Host "Creating virtual environment in $VENV_DIR..."
python -m venv $VENV_DIR

Write-Host "Activating virtual environment..."
& "$VENV_DIR\Scripts\Activate"

Write-Host "Installing project dependencies..."
# install main requirements
pip install -r Backend\requirements.txt
# install db/development requirements too
pip install -r Backend\database\requirments.txt

Write-Host "Installing additional tools: pytest, requests (already included, but ensure latest)"
pip install pytest requests

Write-Host "Installation complete. Run the following to initialize the DB and start the server:" 
Write-Host "1) Activate venv: . .\venv\Scripts\Activate" 
Write-Host "2) Set env variables (or copy Backend/.env.example to Backend/.env)"
Write-Host "3) Run preflight checks: python .\tools\preflight.py --seed"
Write-Host "4) Start app: python main.py"

Write-Host "Tip: In VS Code select 'Python: Select Interpreter' and choose ${PWD}\$VENV_DIR\Scripts\python.exe for Pylance to pick up packages."