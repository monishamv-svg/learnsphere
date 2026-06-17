import { useMemo, useState } from "react"

import Button from "../common/Button"
import ChartExpandModal from "../charts/ChartExpandModal"
import DepartmentSemesterChart from "../charts/DepartmentSemesterChart"

const EMPTY_WEEKDAY_DATA = []
const EMPTY_DEPARTMENT_SEMESTER_DATA = []

function DashboardAnalyticsPanel({ stats }) {
  const [openChart, setOpenChart] = useState(false)

  const weekdayData = stats.classes_by_weekday ?? EMPTY_WEEKDAY_DATA
  const departmentSemesterData =
    stats.students_by_department_semester
    ?? EMPTY_DEPARTMENT_SEMESTER_DATA

  const avgCoursesPerStudent = useMemo(() => {
    if (!stats.students) {
      return 0
    }

    return Math.round(
      (stats.enrollments / stats.students) * 10
    ) / 10
  }, [stats.enrollments, stats.students])

  const busiestDay = useMemo(() => {
    if (!weekdayData.length) {
      return null
    }

    return weekdayData.reduce((busiest, day) =>
      day.count > busiest.count ? day : busiest
    )
  }, [weekdayData])

  const coreCourses = stats.course_breakdown?.core ?? 0
  const electiveCourses = stats.course_breakdown?.elective ?? 0

  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          Platform Insights
        </h3>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-4">
              Academic overview
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-2xl font-bold text-gray-900">
                  {avgCoursesPerStudent}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Avg courses per student
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-2xl font-bold text-gray-900">
                  {coreCourses}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Core courses
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-2xl font-bold text-gray-900">
                  {electiveCourses}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Elective courses
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-2xl font-bold text-gray-900">
                  {busiestDay?.count ?? 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Busiest day
                  {busiestDay?.full_name
                    ? ` (${busiestDay.full_name})`
                    : ""}
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-lg font-semibold text-gray-800 mb-1">
              Student distribution
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Students in each department, broken down by
              semester.
            </p>

            <Button
              type="button"
              onClick={() => setOpenChart(true)}
              className="bg-indigo-600 w-full md:w-auto"
            >
              View students by department and semester
            </Button>
          </div>
        </div>
      </div>

      <ChartExpandModal
        isOpen={openChart}
        onClose={() => setOpenChart(false)}
        title="Students by Department and Semester"
      >
        <DepartmentSemesterChart
          data={departmentSemesterData}
          embedded
        />
      </ChartExpandModal>
    </>
  )
}

export default DashboardAnalyticsPanel
