import {
  useEffect,
  useState
} from "react"

import api from "../../api/axios"

import DashboardLayout from "../../components/layout/DashboardLayout"
import StatCard from "../../components/dashboard/StatCard"
import Loader from "../../components/common/Loader"
import DepartmentChart from "../../components/charts/DepartmentChart"
import SemesterChart from "../../components/charts/SemesterChart"
import DashboardAnalyticsPanel from "../../components/dashboard/DashboardAnalyticsPanel"

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsRes = await api.get("/dashboard/stats")

        setStats(statsRes.data)
      } catch (error) {
        console.error(error)
        setError(
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to load dashboard stats"
        )
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <Loader />
      </DashboardLayout>
    )
  }

  if (error || !stats) {
    return (
      <DashboardLayout>
        <h1 className="text-3xl font-bold mb-6">
          Admin Dashboard
        </h1>
        <p className="text-red-600">
          {error || "No stats available"}
        </p>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-2 text-gray-900">
        Admin Dashboard
      </h1>

      <p className="text-gray-500 mb-8">
        Overview of your academic platform
      </p>

      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          lg:grid-cols-5
          gap-6
          mb-8
        "
      >
        <StatCard
          title="Students"
          value={stats.students}
          accent="blue"
        />

        <StatCard
          title="Courses"
          value={stats.courses}
          accent="violet"
        />

        <StatCard
          title="Enrollments"
          value={stats.enrollments}
          accent="indigo"
        />

        <StatCard
          title="Attendance Records"
          value={stats.attendance_records}
          accent="green"
        />

        <StatCard
          title="Timetable Entries"
          value={stats.timetable_entries}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <DepartmentChart
          data={
            stats.students_by_department?.length
              ? stats.students_by_department
              : [{ name: "No data", count: 0 }]
          }
        />

        <SemesterChart
          data={
            stats.students_by_semester?.length
              ? stats.students_by_semester
              : [{ name: "No data", count: 0 }]
          }
        />
      </div>

      <DashboardAnalyticsPanel stats={stats} />
    </DashboardLayout>
  )
}

export default AdminDashboard
