# Student Portal - Quick Start Script
# This script helps you set up the project quickly

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Student Portal - Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version 2>&1
    Write-Host "✓ npm found: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found. Please install npm" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "All prerequisites met!" -ForegroundColor Green
Write-Host ""

# Backend Setup
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Setting up Backend..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

$backendPath = "Backend 1"

if (Test-Path $backendPath) {
    Set-Location $backendPath
    
    # Create virtual environment if it doesn't exist
    if (-not (Test-Path "venv")) {
        Write-Host "Creating virtual environment..." -ForegroundColor Yellow
        python -m venv venv
        Write-Host "✓ Virtual environment created" -ForegroundColor Green
    } else {
        Write-Host "✓ Virtual environment already exists" -ForegroundColor Green
    }
    
    # Activate virtual environment
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & .\venv\Scripts\Activate.ps1
    
    # Install dependencies
    Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
    pip install -q -r requirements.txt
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
    
    # Check .env file
    if (-not (Test-Path "app\.env")) {
        Write-Host "Creating .env file from example..." -ForegroundColor Yellow
        Copy-Item "app\.env.example" "app\.env"
        Write-Host "✓ .env file created - Please update with your database credentials" -ForegroundColor Yellow
        Write-Host "  Edit: Backend 1\app\.env" -ForegroundColor Yellow
    } else {
        Write-Host "✓ .env file exists" -ForegroundColor Green
    }
    
    Set-Location ..
    Write-Host ""
    Write-Host "Backend setup complete!" -ForegroundColor Green
} else {
    Write-Host "✗ Backend folder not found: $backendPath" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Frontend Setup
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Setting up Frontend..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

$frontendPath = "frontend"

if (Test-Path $frontendPath) {
    Set-Location $frontendPath
    
    # Install dependencies
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    Write-Host "(This may take a few minutes...)" -ForegroundColor Gray
    npm install --silent
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
    
    Set-Location ..
    Write-Host ""
    Write-Host "Frontend setup complete!" -ForegroundColor Green
} else {
    Write-Host "✗ Frontend folder not found: $frontendPath" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update database credentials in: Backend 1\app\.env" -ForegroundColor White
Write-Host "2. Create MySQL database: CREATE DATABASE student_portal;" -ForegroundColor White
Write-Host "3. Run backend: cd 'Backend 1'; python main.py" -ForegroundColor White
Write-Host "4. In new terminal, run frontend: cd frontend; npm run dev" -ForegroundColor White
Write-Host "5. Open browser: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Demo Credentials:" -ForegroundColor Yellow
Write-Host "  Student: student / studentpass" -ForegroundColor White
Write-Host "  Faculty: faculty / facultypass" -ForegroundColor White
Write-Host "  Admin: admin / adminpass" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see SETUP_GUIDE.md" -ForegroundColor Gray
