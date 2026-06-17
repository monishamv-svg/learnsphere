import { useEffect, useMemo, useState } from "react"

import api from "../../api/axios"

import DashboardLayout from "../../components/layout/DashboardLayout"
import StatCard from "../../components/dashboard/StatCard"
import Loader from "../../components/common/Loader"
import AttendanceChart from "../../components/charts/AttendanceChart"

function buildAttendanceChartData(summary) {
  if (!summary) {
    return []
  }

  return [
    { name: "Present", value: summary.present ?? 0 },
    { name: "Absent", value: summary.absent ?? 0 },
  ].filter((item) => item.value > 0)
}

function StudentDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/dashboard/me")
      .then((response) => {
        setDashboard(response.data)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const attendanceChartData = useMemo(
    () => buildAttendanceChartData(
      dashboard?.attendance_summary
    ),
    [dashboard?.attendance_summary]
  )

  if (loading) {
    return (
      <DashboardLayout>
        <Loader />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-2 text-gray-900">
        Student Dashboard
      </h1>

      <p className="text-gray-500 mb-8">
        Welcome, {dashboard.student.full_name}
      </p>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Department"
          value={dashboard.student.department}
          accent="blue"
        />

        <StatCard
          title="Semester"
          value={dashboard.student.semester}
          accent="violet"
        />

        <StatCard
          title="Attendance"
          value={`${dashboard.attendance_percentage}%`}
          accent="green"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-stretch min-h-[360px]">
        <AttendanceChart
          data={
            attendanceChartData.length
              ? attendanceChartData
              : [
                  { name: "Present", value: 0 },
                  { name: "Absent", value: 0 }
                ]
          }
        />

        <div
          className="
            bg-white
            p-5
            rounded-xl
            shadow-md
            border
            border-gray-100
            h-full
            flex
            flex-col
          "
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Upcoming Classes
          </h2>

          <ul className="space-y-2 flex-1">
            {dashboard.timetable.length === 0 ? (
              <li className="p-3 rounded-lg bg-gray-50 text-gray-500 text-sm">
                No upcoming classes scheduled
              </li>
            ) : (
              dashboard.timetable.slice(0, 5).map(
                (slot, index) => (
                  <li
                    key={`${slot.day_of_week}-${index}`}
                    className="
                      p-3
                      rounded-lg
                      bg-gray-50
                      text-gray-800
                      text-sm
                    "
                  >
                    <span className="font-semibold">
                      {slot.day_of_week}
                    </span>
                    {" · "}
                    {slot.start_time}–{slot.end_time}
                    {" · Room "}
                    {slot.room_number}
                  </li>
                )
              )
            )}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default StudentDashboard
