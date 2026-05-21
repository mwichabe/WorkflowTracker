# WorkflowTracker

A full-stack application workflow management platform built with **Django + Django Ninja** (backend) and **React 18** (frontend). Features JWT authentication, role-based access control (Super Admin / Admin / User / Guest), in-app notifications, and an AI assistant powered by Gemini.

## Application Workflow

```
Draft → Submitted → Under Review → Approved
                                 → Rejected
                                 → Need More Information → (edit) → Submitted → …
```

---

## Tech Stack

| Layer    | Technology                                    |
|----------|-----------------------------------------------|
| Backend  | Django 4.2, Django Ninja, PyJWT, WhiteNoise   |
| Database | SQLite (dev) · PostgreSQL via `dj-database-url` (prod) |
| Frontend | React 18, React Router v6, lucide-react        |
| Auth     | JWT (HS256), role-based: superuser / staff / user / guest |
| Deploy   | **Railway** (backend) · **Netlify** (frontend) |

---

## Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # edit SECRET_KEY if you like
python manage.py migrate
python manage.py runserver        # → http://localhost:8000
```

Interactive Swagger docs: `http://localhost:8000/api/docs`

### Frontend

```bash
cd frontend
npm install
npm start                         # → http://localhost:3000
```

The CRA dev server proxies `/api/*` to `http://localhost:8000` automatically.

---

## Production Deployment

### Step 1 — Push to GitHub

```bash
git add -A
git commit -m "ready for deployment"
git push origin main
```

---

### Step 2 — Deploy Backend on Railway

1. Go to [railway.app](https://railway.app) and sign in.
2. Click **New Project → Deploy from GitHub repo** → select `WorkflowTracker`.
3. Railway auto-detects Python from `requirements.txt`.  
   In **Settings → General**, set **Root Directory** to `backend`.
4. Add a **PostgreSQL** database plugin: click **+ New** → **Database → Add PostgreSQL**.  
   Railway injects `DATABASE_URL` automatically.
5. Go to **Variables** and add:

   | Variable | Value |
   |---|---|
   | `SECRET_KEY` | a long random string (≥ 50 chars) |
   | `DEBUG` | `False` |
   | `ALLOWED_HOSTS` | `your-app.up.railway.app` |
   | `CORS_ALLOWED_ORIGINS` | `https://your-site.netlify.app` *(fill in after Netlify deploy)* |

6. **Deploy** — Railway runs `Procfile` which runs migrations then starts gunicorn.
7. Copy your Railway public URL (e.g. `https://workflow-tracker.up.railway.app`).

---

### Step 3 — Deploy Frontend on Netlify

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project** → GitHub.
2. Netlify reads `netlify.toml` from the repo root automatically.  
   Confirm the settings it shows:
   - Base directory: `frontend`
   - Build command: *(from netlify.toml — leave as-is)*
   - Publish directory: `build`
3. Add **one environment variable** under **Site configuration → Environment variables**:

   | Variable | Value |
   |---|---|
   | `BACKEND_URL` | `https://workflow-tracker.up.railway.app` *(your Railway URL, no trailing slash)* |

4. Click **Deploy site**.  
   Netlify builds React, then generates a `_redirects` file that proxies  
   `/api/*` → `https://your-backend.up.railway.app/api/:splat`  
   so the frontend never makes cross-origin requests.

5. Once deployed, copy your Netlify URL and paste it into the Railway `CORS_ALLOWED_ORIGINS` variable, then **redeploy the Railway service**.

---

### Step 4 — Create the Super Admin

After Railway deploys, open a Railway shell (or run locally against the prod DB via `DATABASE_URL`):

```bash
python manage.py createsuperuser
# username: mwichabe
# password: (your choice)
```

Or use the shell:

```bash
python manage.py shell -c "
from django.contrib.auth.models import User
User.objects.create_superuser('mwichabe', 'admin@example.com', 'your-password')
"
```

---

## Environment Variables Reference

### Backend (Railway)

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | ✅ | Django secret key — keep it secret |
| `DEBUG` | ✅ | `False` in production |
| `ALLOWED_HOSTS` | ✅ | Comma-separated hostnames, e.g. `app.railway.app` |
| `DATABASE_URL` | ✅ | Auto-provided by Railway PostgreSQL plugin |
| `CORS_ALLOWED_ORIGINS` | ✅ | Your Netlify URL, e.g. `https://app.netlify.app` |

### Frontend (Netlify)

| Variable | Required | Description |
|---|---|---|
| `BACKEND_URL` | ✅ | Your Railway backend URL (no trailing slash) |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Sign in, returns JWT |
| GET | `/api/auth/me` | JWT | Current user profile |
| GET | `/api/auth/notifications` | JWT | User notifications |
| POST | `/api/auth/request-admin` | JWT | Request admin role |
| GET | `/api/applications/` | optional JWT | List applications |
| POST | `/api/applications/` | JWT | Create draft |
| PUT | `/api/applications/{id}` | JWT (owner) | Edit draft |
| POST | `/api/applications/{id}/submit` | JWT (owner) | Submit for review |
| POST | `/api/applications/{id}/start-review` | JWT (admin) | Begin review |
| POST | `/api/applications/{id}/decision` | JWT (admin) | Record decision |
| GET | `/api/admin/stats` | JWT (admin) | Dashboard stats |
| GET | `/api/admin/requests` | JWT (superuser) | List admin requests |
| PATCH | `/api/admin/requests/{id}` | JWT (superuser) | Approve / reject |
