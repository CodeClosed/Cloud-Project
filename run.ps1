$Host.UI.RawUI.WindowTitle = "Dual Branch AI for Chest X-Ray Analysis System Launcher"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

$python = if (Test-Path ".\.venv\Scripts\python.exe") {
    ".\.venv\Scripts\python.exe"
} else {
    "python"
}

& $python run.py @args
