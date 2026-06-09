import {
  useEffect,
  useMemo,
  useState
} from "react"

import { toast } from "react-toastify"

import api from "../../api/axios"

import DashboardLayout from "../../components/layout/DashboardLayout"
import WeekTimetableGrid from "../../components/timetables/WeekTimetableGrid"
import Button from "../../components/common/Button"
import Loader from "../../components/common/Loader"
import EmptyState from "../../components/common/EmptyState"
import { getCourseColorClass } from "../../utils/weekTimetable"
import { downloadFromApi } from "../../utils/downloadFile"

function StudentTimetablePage() {
  const [timetable, setTimetable] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [exporting, setExporting] = useState(null)

  useEffect(() => {
    api.get("/timetables/me")
      .then((response) => {
        setTimetable(response.data)
      })
      .catch(() => {
        setError("Could not load your timetable")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const handleExport = async (format) => {
    if (!timetable?.entries?.length) {
      return
    }

    setExporting(format)

    try {
      const code = timetable.student.student_code
      await downloadFromApi(
        `/timetables/me/export/${format}`,
        `learnsphere-timetable-${code}.${format}`
      )
      toast.success(
        format === "ics"
          ? "Calendar file downloaded"
          : "PDF downloaded"
      )
    } catch {
      toast.error("Could not export timetable")
    } finally {
      setExporting(null)
    }
  }

  const uniqueCourses = useMemo(() => {
    if (!timetable?.entries?.length) {
      return []
    }

    const seen = new Map()

    timetable.entries.forEach((entry) => {
      if (!seen.has(entry.course_id)) {
        seen.set(entry.course_id, entry)
      }
    })

    return Array.from(seen.values())
  }, [timetable])

  if (loading) {
    return (
      <DashboardLayout>
        <Loader />
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <EmptyState message={error} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-violet-600 mb-1">
            {timetable.schedule_group?.label ||
              `Semester ${timetable.student.semester} Schedule`}
          </p>

          <h1 className="text-3xl font-bold text-gray-900">
            My Timetable
          </h1>

          <p className="text-gray-500 mt-1">
            {timetable.student.full_name}
            {" · "}
            {timetable.student.department}
            {" · Semester "}
            {timetable.student.semester}
            {" · "}
            {timetable.total_credits} credits enrolled
          </p>
        </div>

        {timetable.entries.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleExport("ics")}
              disabled={exporting !== null}
              className="bg-emerald-600"
            >
              {exporting === "ics"
                ? "Exporting..."
                : "Add to Calendar (.ics)"}
            </Button>

            <Button
              onClick={() => handleExport("pdf")}
              disabled={exporting !== null}
              className="bg-violet-600"
            >
              {exporting === "pdf"
                ? "Exporting..."
                : "Download PDF"}
            </Button>
          </div>
        )}
      </div>

      {timetable.entries.length === 0 ? (
        <EmptyState message="No classes scheduled for your enrolled courses" />
      ) : (
        <>
          <WeekTimetableGrid entries={timetable.entries} />

          {uniqueCourses.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                Course legend
              </h2>

              <div className="flex flex-wrap gap-2">
                {uniqueCourses.map((entry) => (
                  <span
                    key={entry.course_id}
                    className={`
                      inline-flex
                      items-center
                      rounded-full
                      border
                      px-3
                      py-1
                      text-xs
                      font-medium
                      ${getCourseColorClass(entry.course_id)}
                    `}
                  >
                    {entry.course_code}
                    {" · "}
                    {entry.course_title}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Class list
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {timetable.entries.map((slot) => (
                <div
                  key={slot.timetable_id}
                  className="
                    bg-white
                    p-5
                    rounded-xl
                    shadow-md
                    border
                    border-gray-100
                  "
                >
                  <p className="text-sm font-semibold text-violet-600">
                    {slot.course_code}
                  </p>

                  <p className="text-xs text-gray-500 mt-0.5">
                    {slot.course_title}
                  </p>

                  <p className="text-xs text-gray-500 mt-2">
                    {slot.day_of_week}
                  </p>

                  <h3 className="text-lg font-bold text-gray-900 mt-1">
                    {slot.start_time} – {slot.end_time}
                  </h3>

                  <p className="text-gray-600 mt-2">
                    Room {slot.room_number}
                  </p>

                  <p className="text-gray-500 text-sm mt-1">
                    {slot.instructor_name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}

export default StudentTimetablePage
