# LearnSphere Deployment Runbook

Operational guide for running LearnSphere locally (containers and dev mode) and on Google Cloud. GCP steps are **ready to execute once your sandbox access is provisioned**.

---

## What is already prepared (no GCP required)

| Item | Location | Status |
|------|----------|--------|
| Backend container image | `backend/Containerfile` | Ready |
| Frontend container image + nginx | `frontend/Containerfile`, `frontend/nginx.conf` | Ready |
| Full local stack | `docker-compose.yml` (`stack` profile) | Ready |
| CI — tests, lint, image build | `.github/workflows/ci.yml` | Active |
| CD — Cloud Run deploy | `.github/workflows/deploy.yml` | **Waiting on GCP secrets** |
| Database migrations on container start | `backend/Containerfile` CMD | Ready |

| Item | Status | Why |
|------|--------|-----|
| GCP project, Cloud SQL, IAM, Secret Manager | **Blocked** | Requires company sandbox access |
| Live Cloud Run deployment | **Blocked** | Requires GCP + secrets |

---

## Production migration strategy

LearnSphere uses **Alembic** for schema changes. Migration files live in `backend/alembic/versions/`.

### Approach used (MVP)

The backend container runs migrations **before** starting the API:

```sh
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
```

**Why:** Simple, no extra infrastructure. Every new Cloud Run revision applies pending migrations automatically.

**Trade-offs:**

- Slightly longer container startup while migrations run
- Multiple simultaneous cold starts could race on migrations (Alembic uses DB locks; usually safe for small schemas)

### When to use a separate migration job (future)

For larger production databases, run migrations as a **one-off Cloud Run Job** before deploying the new service revision:

```bash
gcloud run jobs execute learnsphere-migrate --region=REGION --wait
```

Same image as the backend, command overridden to `alembic upgrade head` only.

### Rules

1. **Never** use `Base.metadata.create_all()` in production (it is commented out in `app/main.py` — keep it that way).
2. Always generate migrations locally after model changes: `alembic revision --autogenerate -m "description"`.
3. Test migrations against PostgreSQL before merging (full stack compose or local Postgres).
4. **Do not** run `scripts/seed_data.py` in production — demo credentials only.

### Manual migration (local or emergency)

```bash
cd backend
source .venv/bin/activate
export POSTGRES_HOST=localhost  # or db inside compose network
alembic upgrade head
```

**Verify:**

```bash
alembic current
# Expected: head revision id (e.g. c7d8e9f0a1b2)
```

**Rollback migration (dev only):**

```bash
alembic downgrade -1
```

---

## Local development (database only + manual apps)

Best for day-to-day coding with hot reload.

### Start database

```bash
podman compose up -d
# or: docker compose up -d
```

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
alembic upgrade head
python scripts/seed_data.py
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

| Service | URL |
|---------|-----|
| API | http://localhost:8000 |
| Swagger | http://localhost:8000/docs |
| React (Vite) | http://localhost:5173 |

---

## Local production-like stack (full containers)

Runs PostgreSQL + FastAPI + nginx-served React without GCP.

### Start full stack

```bash
podman compose --profile stack up --build -d
# or: docker compose --profile stack up --build -d
```

### Seed demo data (first run only)

```bash
podman-compose --profile stack exec backend env PYTHONPATH=/app python scripts/seed_data.py
```

### Verify

```bash
curl -s http://localhost:8000/health | jq .
curl -s http://localhost:8081/health
```

**Expected health response:**

```json
{"status":"healthy","database":"connected"}
```

**Expected frontend health:** `ok`

Open http://localhost:8081 and log in with demo credentials from README.

### Stop and remove

```bash
podman compose --profile stack down
# Remove DB volume too:
podman compose --profile stack down -v
```

### Troubleshooting (local stack)

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Frontend loads, API calls fail (CORS) | Wrong `CORS_ORIGINS` | Stack sets `http://localhost:8081` — rebuild backend if changed |
| `database: disconnected` | DB not ready | Wait for healthcheck; `podman compose ps` |
| Backend keeps restarting | Migration error | `podman compose logs backend` |
| Login fails after first start | No seed data | Run `seed_data.py` in backend container |
| Port 8000 in use | Local uvicorn still running | Stop local backend |

### Rollback (local)

```bash
podman compose --profile stack down
podman compose --profile stack up -d
```

---

## GitHub Actions CI

Runs on every push/PR to `main` and `develop`:

- Backend pytest (70% coverage gate)
- Frontend ESLint + Jest (70% coverage gate)
- Docker build validation for both Containerfiles

No GCP credentials required.

---

## CD pipeline (prepared — activate with sandbox)

Workflow: `.github/workflows/deploy.yml`

Triggers: push to `main`, or manual **Run workflow**.

The job is **skipped** until these GitHub repository secrets exist:

| Secret | Example | Purpose |
|--------|---------|---------|
| `GCP_PROJECT_ID` | `learnsphere-capstone` | Target GCP project |
| `GCP_REGION` | `us-central1` | Region for Run, SQL, Registry |
| `GCP_SA_KEY` | JSON key file contents | GitHub → GCP auth |
| `CLOUD_SQL_CONNECTION_NAME` | `project:region:instance` | Cloud SQL connector |

### Deploy flow (automated once secrets exist)

1. Build & push `backend` image → Artifact Registry
2. Deploy `learnsphere-api` to Cloud Run (+ Cloud SQL socket)
3. Build `frontend` with backend URL baked in → push image
4. Deploy `learnsphere-web` to Cloud Run
5. Update backend `CORS_ORIGINS` to frontend URL
6. Smoke test `/health` on both services

---

## GCP setup (execute when sandbox access arrives)

Replace `PROJECT_ID`, `REGION`, and passwords before running.

### 1. Project and APIs

```bash
gcloud config set project PROJECT_ID

gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  logging.googleapis.com
```

### 2. Artifact Registry

```bash
gcloud artifacts repositories create learnsphere \
  --repository-format=docker \
  --location=REGION \
  --description="LearnSphere images"
```

### 3. Cloud SQL PostgreSQL

```bash
gcloud sql instances create learnsphere-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=REGION \
  --root-password="STRONG_ROOT_PASSWORD"

gcloud sql databases create learnsphere --instance=learnsphere-db

gcloud sql users create learnsphere \
  --instance=learnsphere-db \
  --password="STRONG_APP_PASSWORD"
```

Save connection name:

```bash
gcloud sql instances describe learnsphere-db --format="value(connectionName)"
```

### 4. Service accounts and IAM

```bash
gcloud iam service-accounts create learnsphere-backend \
  --display-name="LearnSphere Backend"

gcloud iam service-accounts create github-deployer \
  --display-name="GitHub Actions Deployer"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:learnsphere-backend@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:learnsphere-backend@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:github-deployer@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:github-deployer@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:github-deployer@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

### 5. Secret Manager

```bash
openssl rand -hex 32   # use output for SECRET_KEY

echo -n "YOUR_JWT_SECRET" | gcloud secrets create learnsphere-secret-key --data-file=-
echo -n "YOUR_DB_PASSWORD" | gcloud secrets create learnsphere-db-password --data-file=-

for SECRET in learnsphere-secret-key learnsphere-db-password; do
  gcloud secrets add-iam-policy-binding "$SECRET" \
    --member="serviceAccount:learnsphere-backend@PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

### 6. GitHub deployer key

```bash
gcloud iam service-accounts keys create github-deployer-key.json \
  --iam-account=github-deployer@PROJECT_ID.iam.gserviceaccount.com
```

Add `github-deployer-key.json` contents to GitHub secret `GCP_SA_KEY`. **Do not commit this file.**

### 7. First deploy

Add GitHub secrets, then either merge to `main` or run **Deploy to Cloud Run** workflow manually.

### Verify (GCP)

```bash
BACKEND_URL=$(gcloud run services describe learnsphere-api --region=REGION --format="value(status.url)")
curl -s "${BACKEND_URL}/health"

FRONTEND_URL=$(gcloud run services describe learnsphere-web --region=REGION --format="value(status.url)")
curl -s "${FRONTEND_URL}/health"
open "${FRONTEND_URL}"
```

### Rollback (GCP)

```bash
gcloud run revisions list --service=learnsphere-api --region=REGION

gcloud run services update-traffic learnsphere-api \
  --region=REGION \
  --to-revisions=REVISION_NAME=100
```

Repeat for `learnsphere-web` if needed.

### Troubleshooting (GCP)

| Symptom | Fix |
|---------|-----|
| Deploy workflow skipped | Add `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_SA_KEY` secrets |
| `database: disconnected` | Check `--add-cloudsql-instances` and `DATABASE_URL` socket path |
| Frontend API errors | Rebuild frontend — `VITE_API_BASE_URL` is build-time only |
| CORS errors in browser | Confirm `CORS_ORIGINS` matches frontend Cloud Run URL |
| 403 on `/auth/register` | Expected in production (`ALLOW_PUBLIC_REGISTRATION=false`) |
| App won't start: SECRET_KEY error | Set strong secret in Secret Manager |

---

## Presentation quick reference

| Question | Answer |
|----------|--------|
| Why containers? | Same artifact locally, in CI, and on Cloud Run |
| Why nginx for frontend? | Serves static React build; handles SPA routing |
| Why migrate on startup? | MVP simplicity; Alembic applies schema before API serves traffic |
| Why CD skipped now? | GCP sandbox not yet provisioned; workflow is ready |
| What runs where? | Frontend = Cloud Run (nginx), Backend = Cloud Run (FastAPI), DB = Cloud SQL |
