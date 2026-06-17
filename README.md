# LearnSphere

A Student Management System for colleges and training institutes. LearnSphere replaces spreadsheet-based workflows with a secure web platform for managing students, courses, enrollments, attendance, and timetables.

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
| Database | PostgreSQL 16 |
| CI | GitHub Actions (pytest + Jest) |

## Prerequisites

- Python 3.11+
- Node.js 20+
- Podman or Docker (PostgreSQL only)

## Run the app locally

Use **3 terminals**. After the first-time setup below, you only need the commands in **Every day**.

### First-time setup (once)

**Terminal 1 — database**

```bash
podman machine start          # Mac only, skip if already running
podman compose up -d
```

**Terminal 2 — backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
alembic upgrade head
python scripts/seed_data.py
```

**Terminal 3 — frontend**

```bash
cd frontend
npm install
cp .env.example .env
```

### Every day (see your code changes)

**Terminal 1 — database** (skip if already running)

```bash
podman compose up -d
```

**Terminal 2 — backend** (hot reload — restarts when you save Python files)

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 3 — frontend** (hot reload — updates the browser when you save React files)

```bash
cd frontend
npm run dev
```

| What | URL |
|------|-----|
| Web app | http://localhost:5173 |
| API | http://localhost:8000 |
| Swagger docs | http://localhost:8000/docs |

### Demo credentials

After running the seed script:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@learnsphere.com` | `Admin123` |
| Student | `{dept}.sem{N}@learnsphere.com` (e.g. `CSE.sem1@learnsphere.com`) | `student123` |

## Testing

```bash
# Backend (from backend/)
pytest

# Frontend (from frontend/)
npm test
npm run test:coverage
```

CI runs the same tests on pushes and PRs to `main` and `develop`.

## Environment variables

### Backend (`backend/.env`)

Copy from `backend/.env.example`. Defaults work for local development.

### Frontend (`frontend/.env`)

Copy from `frontend/.env.example`:

```
VITE_API_BASE_URL=http://localhost:8000
```

## Project Status

**Phase 1 — MVP complete**

Core modules (auth, students, courses, enrollments, attendance, timetables, dashboards) are implemented with backend API tests, frontend component tests, and CI quality gates.
