# LearnSphere

A cloud-native Student Management System for colleges and training institutes. LearnSphere replaces spreadsheet-based workflows with a secure web platform for managing students, courses, enrollments, attendance, and timetables.

## Features

- **JWT authentication** with role-based access (Admin, Student)
- **Student management** — CRUD, filtering, and department/semester tracking
- **Course management** — core and elective courses with instructor metadata
- **Enrollment management** — assign students to courses
- **Attendance tracking** — daily records with status validation and reporting
- **Smart timetable scheduling** — weekly grids, conflict detection, and auto-generation
- **Dashboards** — admin analytics and student self-service views
- **API documentation** — interactive Swagger UI at `/docs`

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Backend | FastAPI, SQLAlchemy, Alembic, Pydantic, JWT (python-jose) |
| Frontend | React 19, Vite, Tailwind CSS, React Router, Axios |
| Database | PostgreSQL 16 (SQLite supported for local/testing) |
| DevOps | Podman/Docker Compose, GitHub Actions, Google Cloud Run (target) |

## Project Structure

```
learnsphere/
├── backend/
│   ├── app/
│   │   ├── api/          # REST route handlers
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   ├── services/     # Business logic
│   │   └── tests/        # Pytest suite
│   ├── alembic/          # Database migrations
│   └── scripts/          # Seed data and setup helpers
├── frontend/
│   └── src/
│       ├── pages/        # Admin and student views
│       ├── components/   # Reusable UI components
│       └── context/      # Auth state
├── docs/                 # Schema diagrams and architecture references
└── .github/workflows/    # CI pipelines
```

## Prerequisites

- Python 3.11+
- Node.js 20+
- Podman or Docker (for PostgreSQL)
- `psql` (optional — only if setting up PostgreSQL without Compose)

## Local Development

### 1. Start the database

```bash
podman compose up -d
# or: docker compose up -d
```

This starts PostgreSQL on port `5432` with default credentials (`learnsphere` / `learnsphere`).

### 2. Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env
alembic upgrade head
python scripts/seed_data.py
uvicorn app.main:app --reload --port 8000
```

API available at [http://localhost:8000](http://localhost:8000). Swagger docs at [http://localhost:8000/docs](http://localhost:8000/docs).

### 3. Frontend setup

In a separate terminal:

```bash
cd frontend
npm install
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

App available at [http://localhost:5173](http://localhost:5173).

### 4. Full stack in containers (production-like, optional)

Runs PostgreSQL + API + nginx-served React. Useful before cloud deploy.

```bash
podman compose --profile stack up --build -d
# or: docker compose --profile stack up --build -d

# First run only — seed demo data
podman-compose --profile stack exec backend env PYTHONPATH=/app python scripts/seed_data.py
```

| Service | URL |
|---------|-----|
| API | http://localhost:8000 |
| Web app | http://localhost:8081 |

See [docs/DEPLOYMENT_RUNBOOK.md](docs/DEPLOYMENT_RUNBOOK.md) for verification, troubleshooting, and GCP steps.

### Demo credentials

After running the seed script:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@learnsphere.com` | `Admin123` |
| Student | `{dept}.sem{N}@learnsphere.com` (e.g. `CSE.sem1@learnsphere.com`) | `student123` |

## Environment Variables

### Backend (`backend/.env`)

Copy from `backend/.env.example`. Key variables:

- `SECRET_KEY` — JWT signing key (change in production; min 32 chars when `APP_ENV=production`)
- `CORS_ORIGINS` — comma-separated frontend URLs allowed by the API
- `ALLOW_PUBLIC_REGISTRATION` — set `true` to allow `/auth/register` (defaults off in production)
- `POSTGRES_*` — database connection (defaults match `docker-compose.yml`)
- `DATABASE_URL` — optional full connection string (overrides `POSTGRES_*`)

### Frontend (`frontend/.env.example`)

Copy to `frontend/.env` for local development, or export when starting Vite:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend API URL (required at build/runtime) |

## Testing

Both backend and frontend enforce a **70% coverage gate** in CI.

```bash
# Backend (from backend/)
pytest

# Frontend (from frontend/)
npm test
npm run test:coverage
```

See [TEST_COVERAGE_MATRIX.md](TEST_COVERAGE_MATRIX.md) for module-level coverage details.


## CI/CD

GitHub Actions runs on pushes and PRs to `main` and `develop`:

- **Backend** — Pytest with coverage gate (in-memory SQLite)
- **Frontend** — ESLint, Jest with coverage gate
- **Containers** — Docker build validation for backend and frontend `Containerfile`s

On merge to `main`, **Deploy to Cloud Run** (`.github/workflows/deploy.yml`) runs automatically once GCP GitHub Secrets are configured. Until sandbox access is provisioned, that job is skipped.

Deployment guide: [docs/DEPLOYMENT_RUNBOOK.md](docs/DEPLOYMENT_RUNBOOK.md)

## Project Status

**Phase 1 — MVP complete**

Core modules (auth, students, courses, enrollments, attendance, timetables, dashboards) are implemented with backend API tests, frontend component tests, and CI quality gates.
