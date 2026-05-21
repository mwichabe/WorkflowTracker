# WorkflowTracker

A full-stack application workflow management platform built with **Django + Django Ninja** (backend) and **React 18** (frontend).

**GitHub Repository:** https://github.com/mwichabe/WorkflowTracker

**Live Demo:**
- Frontend: https://rococo-cupcake-0483e2.netlify.app
- Backend API / Swagger docs: https://workflowtracker-38ww.onrender.com/api/docs

---

## Overview

WorkflowTracker allows users to submit applications through a structured, admin-gated review process. Users create and submit applications; admins review them and record decisions. Every status change triggers an in-app notification to the relevant party. A Gemini-powered AI assistant is available on the home page to answer questions about the platform.

### Application Lifecycle

```
Draft → Submitted → Under Review → Approved
                                 → Rejected
                                 → Need More Information → (edit) → Submitted → …
```

### Role Hierarchy

| Role | How granted | Capabilities |
|------|-------------|--------------|
| Guest | No account | Read-only view of the application list |
| User | Self-register | Create, edit, and submit own applications |
| Admin | Approved by Super Admin | Review all applications, record decisions, view user list |
| Super Admin | Django `createsuperuser` | All above + manage admin role requests |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 4.2, Django Ninja 1.1, PyJWT, WhiteNoise |
| Database | SQLite (dev) · PostgreSQL via `dj-database-url` (prod) |
| Frontend | React 18, React Router v6, lucide-react, react-hot-toast |
| Auth | JWT (HS256), 7-day expiry, role claims embedded in token |
| AI | Gemini 2.0 Flash Lite (free tier) via REST API |
| Deploy | Render (backend) · Netlify (frontend) |

---

## Local Development

### Prerequisites

- Python 3.12+
- Node.js 18+
- Git

---

### 1. Clone the repository

```bash
git clone https://github.com/mwichabe/WorkflowTracker.git
cd WorkflowTracker
```

---

### 2. Run the Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a local environment file:

```bash
cp .env.example .env
```

The `.env.example` defaults are fine for local development (SQLite, DEBUG=True). You can leave them as-is or set your own `SECRET_KEY`.

#### Run migrations

```bash
python manage.py migrate
```

This applies all database migrations in order:
- Django auth, contenttypes
- `accounts` — AdminRequest, Notification models
- `applications` — Application model with tracking number, status, and reviewer fields

#### Create a local super admin

```bash
python manage.py createsuperuser
```

#### Start the development server

```bash
python manage.py runserver        # → http://localhost:8000
```

Interactive Swagger docs: **http://localhost:8000/api/docs**

---

### 3. Run the Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm start                         # → http://localhost:3000
```

The Create React App dev server automatically proxies all `/api/*` requests to `http://localhost:8000`, so no CORS configuration is needed locally.

---

### 4. Running Migrations (reference)

```bash
# Apply all pending migrations
python manage.py migrate

# Check migration status
python manage.py showmigrations

# Create new migrations after model changes
python manage.py makemigrations
```

Migrations are committed to the repository. You should never need to run `makemigrations` unless you modify a model.

---

## Production Deployment

### Backend — Render

1. Go to [render.com](https://render.com) → **New → Web Service** → connect the GitHub repo
2. Set **Root Directory** to `backend`
3. Set **Runtime** to `Python 3`
4. Set **Build Command** to:
   ```
   pip install -r requirements.txt
   ```
5. Set **Start Command** to:
   ```
   python manage.py collectstatic --noinput && python manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
   ```
6. Add a **PostgreSQL** database (New → PostgreSQL), copy the **Internal Database URL**
7. Set **Environment Variables**:

   | Variable | Value |
   |---|---|
   | `SECRET_KEY` | A random 50+ character string |
   | `DEBUG` | `False` |
   | `DATABASE_URL` | Internal PostgreSQL URL from step 6 |
   | `CORS_ALLOWED_ORIGINS` | Your Netlify URL (e.g. `https://your-site.netlify.app`) |

8. Deploy — migrations and static file collection run automatically on startup

#### Create Super Admin on Render (no shell access on free tier)

Add these temporary environment variables, then remove them after the first deploy:

| Variable | Value |
|---|---|
| `DJANGO_SUPERUSER_USERNAME` | `your-username` |
| `DJANGO_SUPERUSER_PASSWORD` | `your-password` |
| `DJANGO_SUPERUSER_EMAIL` | `admin@example.com` |

And update the **Start Command** to include:
```
... && python manage.py createsuperuser --noinput || true && gunicorn ...
```

The `|| true` prevents a crash if the account already exists.

---

### Frontend — Netlify

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import from GitHub** → select the repo
2. Netlify auto-detects `netlify.toml` — base directory `frontend`, publish directory `build`
3. Add one environment variable:

   | Variable | Value |
   |---|---|
   | `BACKEND_URL` | Your Render URL, e.g. `https://your-app.onrender.com` (no trailing slash) |

4. Deploy — Netlify builds React and generates a `_redirects` file that proxies all `/api/*` requests to the Render backend, avoiding CORS entirely

---

## Environment Variables Reference

### Backend

| Variable | Required | Default | Description |
|---|---|---|---|
| `SECRET_KEY` | ✅ | insecure dev key | Django secret key — must be changed in production |
| `DEBUG` | ✅ | `True` | Set to `False` in production |
| `ALLOWED_HOSTS` | ✅ | `*` | Comma-separated allowed hostnames |
| `DATABASE_URL` | prod only | SQLite | Full PostgreSQL connection string |
| `CORS_ALLOWED_ORIGINS` | prod only | allow all | Comma-separated frontend origin URLs |

### Frontend

| Variable | Required | Description |
|---|---|---|
| `BACKEND_URL` | prod only | Render backend URL used to generate the `_redirects` proxy |

---

## API Reference

Full interactive documentation: **https://workflowtracker-38ww.onrender.com/api/docs**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register a new account |
| POST | `/api/auth/login` | — | Sign in, returns JWT |
| GET | `/api/auth/me` | JWT | Current user profile |
| GET | `/api/auth/notifications` | JWT | List in-app notifications |
| POST | `/api/auth/notifications/read-all` | JWT | Mark all notifications read |
| POST | `/api/auth/request-admin` | JWT | Request admin role |
| GET | `/api/auth/admin-request-status` | JWT | Check own admin request status |
| GET | `/api/applications/` | optional JWT | List applications (scoped by role) |
| POST | `/api/applications/` | JWT | Create a Draft application |
| GET | `/api/applications/{id}` | — | Get a single application |
| PUT | `/api/applications/{id}` | JWT (owner/admin) | Update a Draft or NMI application |
| POST | `/api/applications/{id}/submit` | JWT (owner) | Submit for review |
| POST | `/api/applications/{id}/start-review` | JWT (admin) | Begin review |
| POST | `/api/applications/{id}/decision` | JWT (admin) | Record decision |
| DELETE | `/api/applications/{id}` | JWT (owner/admin) | Delete an application |
| GET | `/api/admin/stats` | JWT (admin) | Dashboard statistics |
| GET | `/api/admin/users` | JWT (admin) | List all users |
| GET | `/api/admin/requests` | JWT (superuser) | List admin role requests |
| PATCH | `/api/admin/requests/{id}` | JWT (superuser) | Approve or reject a request |

---

## Assumptions Made

- **Single-tenant:** The platform is designed for one organisation. There is no multi-tenancy, workspace separation, or per-organisation data isolation.
- **One admin request per user:** A user can have at most one admin role request at a time. Rejected users can re-apply, which resets the same record rather than creating a new one.
- **Admins cannot submit on behalf of others:** Only the application owner can submit their own draft. Admins can edit (on Need More Information) but the submission action remains with the owner.
- **No email notifications:** All notifications are in-app only. No SMTP or email service is configured.
- **JWT tokens are not revoked on logout:** Tokens are removed from `localStorage` on the client side, but there is no server-side token blacklist. A leaked token remains valid until its 7-day TTL expires.
- **Guest access is read-only:** Unauthenticated users can see the full application list but cannot interact with any application.
- **SQLite for local development:** The project uses SQLite locally and PostgreSQL in production. No Docker or local Postgres setup is required to get started.
- **Application types are fixed:** The five application types (Recordation, Renewal, Change of Ownership, Change of Name, Discontinuation) are hardcoded as model choices and not configurable from the UI.

---

## What I Would Improve With More Time

### Security
- **Token blacklisting on logout** — store issued JTIs in a Redis set and reject them after logout
- **Rate limiting** — throttle login and register endpoints to prevent brute-force attacks
- **HTTPS enforcement** — add `SecurityMiddleware` and `SECURE_SSL_REDIRECT` for production

### Features
- **Email notifications** — send transactional emails (submission confirmation, decision notification) via SendGrid or Mailgun
- **File attachments** — allow applicants to upload supporting documents (PDF, images) stored in S3 or Cloudflare R2
- **Audit log** — immutable log of every status change with timestamp, actor, and previous state
- **Pagination** — the application list currently returns all records; large datasets need cursor-based or page-based pagination
- **Advanced search and filters** — filter by date range, applicant name, type, and reviewer in addition to status
- **Dashboard charts** — visualise status distribution and submission trends over time with a proper charting library

### Code Quality
- **Test suite** — add unit tests for all API endpoints using `pytest-django` and `pytest-ninja`, and integration tests for the full workflow lifecycle
- **Type safety** — move `List[dict]` return types in `admin_users` to a proper `UserOut` Pydantic schema so the OpenAPI spec is fully typed
- **Frontend state management** — replace scattered `useState` + `useEffect` fetch patterns with React Query or SWR for caching, background refetch, and optimistic updates
- **Environment-based API config** — centralise the Gemini API key and other frontend config in a single `.env` file rather than hardcoded values

### Infrastructure
- **CI/CD pipeline** — GitHub Actions to run tests and linting on every pull request before merge
- **Database backups** — scheduled PostgreSQL dumps, especially important before migrations
- **Sentry integration** — capture and alert on backend exceptions in production
