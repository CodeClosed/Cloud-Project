import os
import sys
import subprocess
import signal
import threading
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"

# Virtual environment python / uvicorn
if sys.platform == "win32":
    UVICORN_BIN = PROJECT_ROOT / ".venv" / "Scripts" / "uvicorn.exe"
    NPM_CMD = "npm.cmd"
else:
    UVICORN_BIN = PROJECT_ROOT / ".venv" / "bin" / "uvicorn"
    NPM_CMD = "npm"

def stream_output(pipe, prefix, color_code):
    try:
        for line in iter(pipe.readline, ''):
            if not line:
                break
            sys.stdout.write(f"\033[{color_code}m{prefix}\033[0m {line}")
            sys.stdout.flush()
    except Exception:
        pass
    finally:
        try:
            pipe.close()
        except Exception:
            pass

def main():
    print("=" * 60)
    print("Starting Chest X-Ray AI Full-Stack Platform")
    print("Backend:  http://127.0.0.1:8000 (FastAPI API)")
    print("Docs:     http://127.0.0.1:8000/docs (Swagger UI)")
    print("Frontend: http://localhost:3000 (Next.js)")
    print("Press Ctrl+C to stop both servers")
    print("=" * 60)

    # 1. Backend command
    backend_cmd = [
        str(UVICORN_BIN) if UVICORN_BIN.exists() else "uvicorn",
        "api.main:app",
        "--reload",
        "--host", "127.0.0.1",
        "--port", "8000"
    ]

    # 2. Frontend command
    frontend_cmd = [NPM_CMD, "run", "dev"]

    env = os.environ.copy()

    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=str(PROJECT_ROOT),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        env=env
    )

    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=str(FRONTEND_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        env=env,
        shell=(sys.platform == "win32")
    )

    t1 = threading.Thread(target=stream_output, args=(backend_proc.stdout, "[Backend] ", "36"), daemon=True)
    t2 = threading.Thread(target=stream_output, args=(frontend_proc.stdout, "[Frontend]", "35"), daemon=True)
    t1.start()
    t2.start()

    def shutdown(signum=None, frame=None):
        print("\nStopping all servers...")
        try:
            if sys.platform == "win32":
                subprocess.call(["taskkill", "/F", "/T", "/PID", str(backend_proc.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                subprocess.call(["taskkill", "/F", "/T", "/PID", str(frontend_proc.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                backend_proc.terminate()
                frontend_proc.terminate()
        except Exception:
            pass
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        backend_proc.wait()
    except KeyboardInterrupt:
        shutdown()

if __name__ == "__main__":
    main()
