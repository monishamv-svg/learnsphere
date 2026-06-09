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

function buildDepartmentData(students) {
  const counts = {}

  students.forEach((student) => {
    const dept = student.department || "Unknown"
    counts[dept] = (counts[dept] || 0) + 1
  })

  return Object.entries(counts).map(([name, count]) => ({
    name,
    count
  }))
}

function buildSemesterData(students) {
  const counts = {}

  students.forEach((student) => {
    const semester = student.semester ?? 0
    counts[semester] = (counts[semester] || 0) + 1
  })

  return Object.entries(counts)
    .sort(
      ([left], [right]) => Number(left) - Number(right)
    )
    .map(([semester, count]) => ({
      name: `Sem ${semester}`,
      count
    }))
}

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState({
    departments: [],
    semesters: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, studentsRes] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/students", {
            params: { skip: 0, limit: 100 }
          })
        ])

        const students = studentsRes.data.items ?? []

        setStats(statsRes.data)
        setChartData({
          departments: buildDepartmentData(students),
          semesters: buildSemesterData(students)
        })
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DepartmentChart
          data={
            chartData.departments.length
              ? chartData.departments
              : [{ name: "No data", count: 0 }]
          }
        />

        <SemesterChart
          data={
            chartData.semesters.length
              ? chartData.semesters
              : [{ name: "No data", count: 0 }]
          }
        />
      </div>
    </DashboardLayout>
  )
}

export default AdminDashboard
