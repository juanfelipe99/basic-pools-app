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

Las tablas se crean automáticamente al arrancar. Al crear una encuesta (`POST /pools`) la respuesta incluye un `admin_token` que solo se muestra una vez: se envía en la cabecera `X-Admin-Token` para editar o borrar la encuesta y sus opciones.

### Tests

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

## Frontend

```bash
cd frontend
pnpm install
copy .env.example .env   # o: cp .env.example .env
pnpm dev
```

App disponible en http://localhost:5173. El frontend llama a la API por `/api`, que Vite reenvía al backend en el puerto 8000.

### Compartir fuera de tu computador

Con el backend y el frontend corriendo, abre un túnel de Cloudflare (no requiere cuenta):

```bash
winget install --id Cloudflare.cloudflared
cloudflared tunnel --url http://127.0.0.1:5173
```

Abre la URL `https://….trycloudflare.com` que muestra la consola y comparte los links desde ahí. La URL cambia cada vez que inicias el túnel.
