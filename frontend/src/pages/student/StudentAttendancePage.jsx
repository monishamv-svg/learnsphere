import {
  useEffect,
  useMemo,
  useState
} from "react"

import api from "../../api/axios"

import DashboardLayout from "../../components/layout/DashboardLayout"
import Loader from "../../components/common/Loader"
import StatCard from "../../components/dashboard/StatCard"

function StudentAttendancePage() {
  const [dashboard, setDashboard] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get("/dashboard/me"),
      api.get("/attendance", {
        params: { skip: 0, limit: 100 }
      })
    ])
      .then(([dashboardRes, attendanceRes]) => {
        setDashboard(dashboardRes.data)
        setRecords(attendanceRes.data ?? [])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const studentId = dashboard?.student?.id

  const myRecords = useMemo(() => {
    if (!studentId) {
      return []
    }

    return records
      .filter(
        (record) => record.student_id === studentId
      )
      .sort((a, b) =>
        b.attendance_date.localeCompare(a.attendance_date)
      )
  }, [records, studentId])

  if (loading) {
    return (
      <DashboardLayout>
        <Loader />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        My Attendance
      </h1>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Overall Attendance"
          value={`${dashboard.attendance_percentage}%`}
        />

        <StatCard
          title="Total Records"
          value={myRecords.length}
        />

        <StatCard
          title="Present"
          value={
            myRecords.filter(
              (r) => r.status === "Present"
            ).length
          }
        />
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {myRecords.length === 0 ? (
              <tr>
                <td colSpan={2} className="p-6 text-center text-gray-500">
                  No attendance records yet
                </td>
              </tr>
            ) : (
              myRecords.map((record) => (
                <tr key={record.id} className="border-t">
                  <td className="p-3">
                    {record.attendance_date}
                  </td>
                  <td className="p-3">
                    <span
                      className={`
                        px-2
                        py-1
                        rounded-full
                        text-xs
                        font-semibold
                        ${record.status === "Present"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                        }
                      `}
                    >
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}

export default StudentAttendancePage
