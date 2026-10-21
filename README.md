# Dual Branch AI for Chest X-Ray Analysis System

An end-to-end clinical AI application combining deep learning chest X-ray classification (EfficientNetB0), lung lesion segmentation (U-Net), Grad-CAM explainability heatmaps, and a modern Next.js interactive web frontend.

---

## ⚡ Quick Start (Single Command)

You can launch both the **FastAPI Backend** and the **Next.js Frontend** simultaneously using any of the following single commands from the project root:

### Option 1: Windows Batch File (Easiest for Windows / CMD)
```cmd
run
```
*(or double-click `run.bat` in Windows Explorer)*

### Option 2: PowerShell
```powershell
.\run.ps1
```

### Option 3: Python
```bash
python run.py
```

### Option 4: NPM
```bash
npm run dev
```

---

## 🌐 What Happens When You Run It

1. **Automatic Environment Detection:** Detects `.venv` and system Node.js / npm automatically.
2. **Concurrent Launch:**
   - **Backend API:** Spawns FastAPI / Uvicorn on [http://localhost:8000](http://localhost:8000).
   - **Frontend:** Spawns Next.js on [http://localhost:3000](http://localhost:3000).
3. **Unified Streamed Logs:** Merges and prefixes console logs with color labels (`[BACKEND]` and `[FRONTEND]`).
4. **Automatic Browser Open:** Waits until both services are fully healthy and ready, then automatically opens [http://localhost:3000](http://localhost:3000) in your default web browser.
5. **Clean Shutdown:** Press <kbd>Ctrl</kbd> + <kbd>C</kbd> at any time to cleanly terminate both processes without leaving orphaned background services on port 8000 or 3000.

---

## 🛠️ CLI Options

- Skip opening the browser automatically:
  ```bash
  python run.py --no-browser
  ```
  *(or `run.bat --no-browser` / `npm run dev:no-browser`)*

---

## 🔗 Direct Service URLs

| Service | URL | Description |
|---|---|---|
| **Frontend UI** | [http://localhost:3000](http://localhost:3000) | Web interface for uploading X-rays and viewing results |
| **Backend API** | [http://localhost:8000](http://localhost:8000) | FastAPI REST service |
| **Interactive Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger UI for exploring and testing API endpoints |
| **Health Check** | [http://localhost:8000/health](http://localhost:8000/health) | API and model status probe |
