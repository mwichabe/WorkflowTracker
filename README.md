# WorkflowTracker

A mini application workflow tracker built with **Django + Django Ninja** (backend) and **React** (frontend), using **MongoDB** via djongo.

## Workflow

```
Draft → Submitted → Under Review → Approved
                                 → Rejected
                                 → Need More Information → (edit) → Submitted → ...
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB running locally on port `27017` (or provide a URI via `.env`)

---

## Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env if needed (MONGO_URI, MONGO_DB_NAME, SECRET_KEY)

# Run migrations
python manage.py migrate

# Start the development server
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`.

Interactive API docs (Swagger UI): `http://localhost:8000/api/docs`

---

## Frontend Setup

```bash
cd frontend

npm install
npm start
```

The React app will open at `http://localhost:3000` and proxies `/api` calls to the Django backend.

---

## API Endpoints

| Method | Endpoint                              | Description                           |
| ------ | ------------------------------------- | ------------------------------------- |
| POST   | `/api/applications/`                  | Create draft                          |
| GET    | `/api/applications/`                  | List all (optional `?status=` filter) |
| GET    | `/api/applications/{id}`              | Get details                           |
| PUT    | `/api/applications/{id}`              | Update draft                          |
| POST   | `/api/applications/{id}/submit`       | Submit for review                     |
| POST   | `/api/applications/{id}/start-review` | Move to Under Review                  |
| POST   | `/api/applications/{id}/decision`     | Record reviewer decision              |

---

## Assumptions

- Authentication is out of scope; any user can perform any action.
- MongoDB is used as the database via djongo for ORM compatibility.
- The `Need More Information` status re-enables editing and resubmission (treated as a new `Draft`-like state for the applicant).
- Tracking numbers are auto-generated in `APP-XXXXXXXX` format.

---

## What I Would Improve With More Time

- **Authentication & roles**: Separate applicant vs. reviewer roles with JWT auth.
- **Pagination**: Add cursor or page-based pagination to the list endpoint.
- **Email notifications**: Notify applicants when status changes.
- **File attachments**: Allow supporting documents to be uploaded with applications.
- **Audit log**: Track every status transition with timestamps and actor.
- **Tests**: Unit tests for workflow rules; integration tests for API endpoints.
- **Filtering & search**: Full-text search on applicant name / company.
- **Better error handling**: Field-level validation errors on the frontend form.

pass=FohEiRmYbsh5UQIW
username=mwichabecollins
# WorkflowTracker
