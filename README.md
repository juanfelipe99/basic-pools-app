# Encuestas

App para armar una encuesta, compartir el link y votar sin cuenta. Un voto por IP. Backend en FastAPI + SQLite, frontend en React.

En local corro las dos partes por separado. En internet las sirvo juntas desde Fly.io, en `https://basic-pools-app.fly.dev` (el nombre de la app se puede cambiar en `fly.toml`).

## Local

Backend:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Frontend (otra terminal):

```bash
cd frontend
pnpm install
pnpm dev
```

El front queda en http://localhost:5173 y le pega al API por `/api`. Vite reenvía eso al puerto 8000.

Los tests del backend:

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

Al crear una encuesta, `POST /pools` devuelve un `admin_token` una sola vez. Para editar o borrar hay que mandarlo en `X-Admin-Token`. En el navegador lo guardo yo, así que el panel de gestión solo aparece donde se creó la encuesta.

## Fly.io

Un contenedor sirve el API y el frontend compilado. La base va a un volumen para que no se pierda al reiniciar. La máquina se duerme si nadie entra (plan gratis); el primer request después de eso tarda un poco.

Hace falta la CLI (`flyctl`) y estar logueado (`fly auth login`). Desde la raíz del repo:

```bash
fly apps create basic-pools-app
fly volumes create data --region mia --size 1
fly secrets set IP_HASH_SECRET=pon-aqui-algo-largo-y-random
fly deploy
```

Si `basic-pools-app` ya está pillado, cambia el `app` en `fly.toml` y el `fly apps create`. Región puse `mia` porque me queda cerca; el volumen tiene que estar en la misma.

Dominio propio: `fly certs add votos.tudominio.com` y un CNAME del DNS hacia `basic-pools-app.fly.dev`.
