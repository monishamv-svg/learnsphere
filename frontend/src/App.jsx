import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom"

import { AuthProvider } from "./context/AuthProvider"

import LoginPage from "./pages/auth/LoginPage"

import AdminDashboard from "./pages/admin/AdminDashboard"

import StudentDashboard from "./pages/student/StudentDashboard"

import ProtectedRoute from "./routes/ProtectedRoute"

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
            path="/student"
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

        </Routes>

      </BrowserRouter>

    </AuthProvider>
  )
}

export default App
