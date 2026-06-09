import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom"

import { AuthProvider } from "./context/AuthProvider"

import LoginPage from "./pages/auth/LoginPage"

import AdminDashboard from "./pages/admin/AdminDashboard"

import StudentDashboard from "./pages/student/StudentDashboard"

import StudentCoursesPage from "./pages/student/StudentCoursesPage"

import StudentAttendancePage from "./pages/student/StudentAttendancePage"

import StudentTimetablePage from "./pages/student/StudentTimetablePage"

import ProtectedRoute from "./routes/ProtectedRoute"

import StudentsPage from "./pages/admin/StudentsPage"

import CoursesPage from "./pages/admin/CoursesPage"

import EnrollmentsPage from "./pages/admin/EnrollmentsPage"

import AttendancePage from "./pages/admin/AttendancePage"

import TimetablePage from "./pages/admin/TimetablePage"

function App() {

  return (
    <AuthProvider>

      <BrowserRouter>

        <Routes>

          <Route
            path="/"
            element={<LoginPage />}
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/students"
            element={
              <ProtectedRoute role="admin">
                <StudentsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student"
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/courses"
            element={
              <ProtectedRoute role="student">
                <StudentCoursesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/attendance"
            element={
              <ProtectedRoute role="student">
                <StudentAttendancePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/timetable"
            element={
              <ProtectedRoute role="student">
                <StudentTimetablePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/courses"
            element={
              <ProtectedRoute role="admin">
                <CoursesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/enrollments"
            element={
              <ProtectedRoute role="admin">
                <EnrollmentsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance"
            element={
              <ProtectedRoute role="admin">
                <AttendancePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/timetable"
            element={
              <ProtectedRoute role="admin">
                <TimetablePage />
              </ProtectedRoute>
            }
          />

        </Routes>

      </BrowserRouter>

    </AuthProvider>
  )
}

export default App
