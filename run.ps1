# Launcher for Chest X-Ray AI Full-Stack App
$PythonBin = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
if (Test-Path $PythonBin) {
    & $PythonBin (Join-Path $PSScriptRoot "dev.py")
} else {
    python (Join-Path $PSScriptRoot "dev.py")
}
