#!/usr/bin/env python3
"""
Single-command launcher for Dual Branch AI for Chest X-Ray Analysis System.
Spawns and manages both FastAPI backend and Next.js frontend concurrently.
Automatically opens http://localhost:3000 in your browser when ready.
"""

import os
import sys
import time
import signal
import shutil
import urllib.request
import webbrowser
import subprocess
import threading
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Paths
ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "frontend"
VENV_PYTHON = ROOT_DIR / ".venv" / "Scripts" / "python.exe"

# ANSI Colors for terminal output
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_banner():
    banner = f"""
{CYAN}========================================================================={RESET}
{BOLD}{GREEN}      [+] DUAL BRANCH AI FOR CHEST X-RAY ANALYSIS SYSTEM [+]{RESET}
{CYAN}========================================================================={RESET}
  {BOLD}Frontend:{RESET}     http://localhost:3000
  {BOLD}Backend API:{RESET}  http://localhost:8000
  {BOLD}API Docs:{RESET}     http://localhost:8000/docs
  {BOLD}Health Check:{RESET} http://localhost:8000/health
{CYAN}-------------------------------------------------------------------------{RESET}
  {YELLOW}Starting both servers... The browser will open automatically when ready.{RESET}
  {YELLOW}Press Ctrl+C at any time to cleanly stop all services.{RESET}
{CYAN}========================================================================={RESET}
"""
    print(banner)


def stream_logs(process, prefix, color):
    """Stream subprocess logs with a color-coded prefix."""
    try:
        for line in iter(process.stdout.readline, ""):
            if not line:
                break
            cleaned = line.rstrip()
            if cleaned:
                print(f"{color}[{prefix}]{RESET} {cleaned}", flush=True)
    except Exception:
        pass


def kill_process_tree(pid):
    """Kill process and all child processes on Windows or POSIX."""
    if not pid:
        return
    try:
        if sys.platform == "win32":
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(pid)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False
            )
        else:
            os.killpg(os.getpgid(pid), signal.SIGTERM)
    except Exception:
        pass


def wait_and_open_browser(frontend_url, stop_event, no_browser=False):
    """Polls frontend until reachable and opens the default browser."""
    if no_browser:
        return

    max_retries = 40  # up to ~20 seconds
    for _ in range(max_retries):
        if stop_event.is_set():
            return
        try:
            with urllib.request.urlopen(frontend_url, timeout=1) as resp:
                if resp.status in (200, 304, 308):
                    print(f"\n{BOLD}{GREEN}✓ Services are online! Opening {frontend_url} in your browser...{RESET}\n", flush=True)
                    webbrowser.open(frontend_url)
                    return
        except Exception:
            pass
        time.sleep(0.5)

    print(f"\n{YELLOW}Note: Frontend is still compiling or starting. You can visit {frontend_url} manually.{RESET}\n", flush=True)


def main():
    no_browser = "--no-browser" in sys.argv

    # Enable ANSI color support on Windows
    if sys.platform == "win32":
        os.system("")

    print_banner()

    # Determine Python executable
    if VENV_PYTHON.exists():
        python_exe = str(VENV_PYTHON)
    else:
        python_exe = sys.executable

    # Check for npm
    npm_cmd = shutil.which("npm.cmd" if sys.platform == "win32" else "npm")
    if not npm_cmd:
        print(f"{RED}Error: 'npm' was not found in your system PATH. Please ensure Node.js is installed.{RESET}")
        sys.exit(1)

    # Check frontend directory
    if not FRONTEND_DIR.exists():
        print(f"{RED}Error: Frontend directory '{FRONTEND_DIR}' does not exist.{RESET}")
        sys.exit(1)

    processes = []
    stop_event = threading.Event()

    def shutdown(signum=None, frame=None):
        print(f"\n\n{YELLOW}Stopping servers and cleaning up...{RESET}")
        stop_event.set()
        for p in processes:
            if p and p.poll() is None:
                kill_process_tree(p.pid)
        print(f"{GREEN}All services stopped successfully. Goodbye!{RESET}\n")
        sys.exit(0)

    # Register signal handlers
    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        # 1. Start Backend (Uvicorn FastAPI)
        backend_cmd = [
            python_exe,
            "-m", "uvicorn",
            "api.main:app",
            "--host", "127.0.0.1",
            "--port", "8000",
            "--reload"
        ]
        backend_proc = subprocess.Popen(
            backend_cmd,
            cwd=str(ROOT_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        processes.append(backend_proc)

        backend_thread = threading.Thread(
            target=stream_logs,
            args=(backend_proc, "BACKEND ", CYAN),
            daemon=True
        )
        backend_thread.start()

        # 2. Start Frontend (Next.js)
        frontend_cmd = [npm_cmd, "run", "dev"]
        frontend_proc = subprocess.Popen(
            frontend_cmd,
            cwd=str(FRONTEND_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        processes.append(frontend_proc)

        frontend_thread = threading.Thread(
            target=stream_logs,
            args=(frontend_proc, "FRONTEND", GREEN),
            daemon=True
        )
        frontend_thread.start()

        # 3. Browser launcher thread
        browser_thread = threading.Thread(
            target=wait_and_open_browser,
            args=("http://localhost:3000", stop_event, no_browser),
            daemon=True
        )
        browser_thread.start()

        # Wait on processes
        while True:
            time.sleep(0.5)
            # If backend or frontend exited unexpectedly, alert user
            if backend_proc.poll() is not None:
                print(f"\n{RED}Backend process exited unexpectedly with code {backend_proc.returncode}.{RESET}")
                shutdown()
            if frontend_proc.poll() is not None:
                print(f"\n{RED}Frontend process exited unexpectedly with code {frontend_proc.returncode}.{RESET}")
                shutdown()

    except KeyboardInterrupt:
        shutdown()


if __name__ == "__main__":
    main()
