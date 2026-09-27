# Basic Pools App

Aplicación para realizar encuestas entre usuarios.

- **Backend:** FastAPI + SQLite (SQLAlchemy 2.0)
- **Frontend:** React + TypeScript (Vite)

## Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # o: cp .env.example .env
uvicorn app.main:app --reload
```

API disponible en http://localhost:8000 (documentación en http://localhost:8000/docs).

## Frontend

```bash
cd frontend
pnpm install
copy .env.example .env   # o: cp .env.example .env
pnpm dev
```

App disponible en http://localhost:5173.
