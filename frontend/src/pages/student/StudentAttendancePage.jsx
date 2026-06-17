import { useEffect, useMemo, useState } from "react"

import api from "../../api/axios"

import DashboardLayout from "../../components/layout/DashboardLayout"
import Loader from "../../components/common/Loader"
import StatCard from "../../components/dashboard/StatCard"

function StudentAttendancePage() {
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

  const attendanceByCourse = useMemo(
    () => dashboard?.attendance_by_course ?? [],
    [dashboard?.attendance_by_course]
  )

  const overallPercentage = useMemo(() => {
    if (!attendanceByCourse.length) {
      return dashboard?.attendance_percentage ?? 0
    }

    const totalClasses = attendanceByCourse.reduce(
      (sum, course) => sum + course.total_classes,
      0
    )

    const presentClasses = attendanceByCourse.reduce(
      (sum, course) => sum + course.present_count,
      0
    )

    if (totalClasses === 0) {
      return 0
    }

    return Math.round(
      (presentClasses / totalClasses) * 10000
    ) / 100
  }, [attendanceByCourse, dashboard])

  const totalRecords = useMemo(
    () =>
      attendanceByCourse.reduce(
        (sum, course) => sum + course.total_classes,
        0
      ),
    [attendanceByCourse]
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
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        My Attendance
      </h1>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Overall Attendance"
          value={`${overallPercentage}%`}
        />

        <StatCard
          title="Subjects Tracked"
          value={attendanceByCourse.length}
        />

        <StatCard
          title="Total Records"
          value={totalRecords}
        />
      </div>

      <div className="space-y-6">
        {attendanceByCourse.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 text-center text-gray-500">
            No attendance records yet for your enrolled courses.
          </div>
        ) : (
          attendanceByCourse.map((course) => (
            <section
              key={course.course_id}
              className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
            >
              <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {course.course_code} — {course.course_title}
                  </h2>
                  {course.professor_name && (
                    <p className="text-sm text-gray-600 mt-1">
                      Professor: {course.professor_name}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Present {course.present_count} · Absent{" "}
                    {course.absent_count} · Total{" "}
                    {course.total_classes}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    Subject Attendance
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {course.attendance_percentage}%
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {course.records?.length ? (
                      course.records.map((record) => (
                        <tr
                          key={record.attendance_id}
                          className="border-t"
                        >
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
                    ) : (
                      <tr>
                        <td
                          colSpan={2}
                          className="p-4 text-center text-gray-500"
                        >
                          No records for this subject yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        )}
      </div>
    </DashboardLayout>
  )
}

export default StudentAttendancePage
