# LearnSphere Test Coverage Matrix

This matrix maps every major module to the tests that cover it. Use it as a checklist when adding new features.

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Covered by automated tests |
| 🔶 | Partially covered |
| ⬜ | Not yet covered (future work) |

---

## Module Coverage

| Module | Unit Tests | API Tests | Validation | Negative Cases | Frontend Tests |
|--------|------------|-----------|------------|----------------|----------------|
| **Authentication** | ✅ JWT utils | ✅ `/auth/register`, `/auth/token`, `/auth/me` | ✅ Password/email rules | ✅ Invalid credentials, duplicate email, missing token | ✅ LoginPage |
| **User Management** | ⬜ Service layer | ✅ `/users/` CRUD | 🔶 Via Pydantic on create | ✅ 403 for student, 404 not found | ⬜ |
| **Student Management** | ⬜ Service layer | ✅ `/students/` CRUD + filters | ✅ Phone, semester | ✅ 403 for student create | ⬜ |
| **Course Management** | ⬜ Service layer | ✅ `/courses/` CRUD | ✅ Invalid credits | ✅ 403, 404 | ⬜ |
| **Enrollment Management** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| **Attendance Management** | ⬜ Service layer | ✅ Mark, list, %, update, delete | ✅ Status enum | ✅ 403 for student | ⬜ |
| **Timetable Scheduling** | ⬜ Auto-schedule | ✅ CRUD, `/me`, schedules | ✅ Time parsing | ✅ 401/403 | ✅ StudentTimetablePage |
| **Dashboard APIs** | ⬜ Service layer | ✅ Admin stats, student `/me` | N/A | ✅ Role-based 403 | ✅ AdminDashboard |
| **Health / Root** | N/A | ✅ `/`, `/health` | N/A | N/A | N/A |

---

## Backend Test Files

| File | What it tests |
|------|---------------|
| `app/tests/conftest.py` | In-memory DB, HTTP client, admin/student fixtures |
| `app/tests/test_auth.py` | Register, login, `/auth/me` |
| `app/tests/test_jwt.py` | Token creation, expiry, wrong secret |
| `app/tests/test_users.py` | Admin-only user CRUD |
| `app/tests/test_students.py` | Student CRUD and filters |
| `app/tests/test_courses.py` | Course CRUD |
| `app/tests/test_attendance.py` | Attendance lifecycle |
| `app/tests/test_timetables.py` | Timetable CRUD + student view |
| `app/tests/test_dashboard.py` | Role-based dashboard access |
| `app/tests/test_validation.py` | Pydantic + API 422 errors |
| `app/tests/test_health.py` | Root and health endpoints |

---

## Frontend Test Files

| File | What it tests |
|------|---------------|
| `src/pages/auth/LoginPage.test.jsx` | Form render, login success/failure, redirects |
| `src/pages/admin/AdminDashboard.test.jsx` | Loading, stats display, API errors, mocking |
| `src/pages/student/StudentTimetablePage.test.jsx` | Timetable load, empty state, export buttons |

---

## Coverage Targets

| Layer | Tool | Minimum Threshold | Report Formats |
|-------|------|-------------------|----------------|
| Backend | pytest-cov | **70%** | terminal, HTML (`htmlcov/`), XML (`coverage.xml`) |
| Frontend | Jest | **70%** | terminal, HTML (`coverage/`), LCOV |

CI fails automatically if either layer drops below 70% or any test fails.

---

## Recommended Next Steps (Optional)

1. Add enrollment API tests (`test_enrollments.py`)
2. Add service-layer unit tests with mocked DB sessions
3. Add frontend tests for `StudentDashboard`, `TimetablePage` (admin CRUD)
4. Add E2E tests with Playwright or Cypress for full user journeys
