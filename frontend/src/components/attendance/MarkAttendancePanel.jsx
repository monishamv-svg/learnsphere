import { useEffect, useMemo, useState } from "react"

import api from "../../api/axios"

import Button from "../common/Button"
import Input from "../common/Input"
import FormField from "../common/FormField"
import SearchableSelect from "../common/SearchableSelect"
import Loader from "../common/Loader"
import Modal from "../common/Modal"

const ATTENDANCE_OPTIONS = ["Present", "Absent"]

function getTodayDateString() {
  const today = new Date()

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-")
}

function MarkAttendancePanel({
  professorNames = [],
  onSaved
}) {
  const [professorName, setProfessorName] = useState("")
  const [attendanceDate, setAttendanceDate] = useState(
    getTodayDateString()
  )
  const [sessions, setSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [roster, setRoster] = useState([])
  const [statusByStudent, setStatusByStudent] = useState({})
  const [loadingRoster, setLoadingRoster] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const professorOptions = useMemo(
    () =>
      professorNames.map((name) => ({
        value: name,
        label: name,
        searchText: name
      })),
    [professorNames]
  )

  const unmarkedCount = useMemo(
    () =>
      roster.filter(
        (student) => !statusByStudent[student.student_id]
      ).length,
    [roster, statusByStudent]
  )

  const canSave =
    roster.length > 0 && unmarkedCount === 0 && !saving

  const shouldLoadSessions = Boolean(
    professorName && attendanceDate
  )

  const displaySessions = useMemo(
    () => (shouldLoadSessions ? sessions : []),
    [shouldLoadSessions, sessions]
  )

  const handleProfessorChange = (name) => {
    setProfessorName(name)
    setSessions([])
  }

  const handleDateChange = (value) => {
    setAttendanceDate(value)
    setSessions([])
  }

  useEffect(() => {
    if (!shouldLoadSessions) {
      return
    }

    let cancelled = false

    const loadSessions = async () => {
      setLoadingSessions(true)
      setError("")

      try {
        const response = await api.get(
          "/attendance/professor-sessions",
          {
            params: {
              professor_name: professorName,
              attendance_date: attendanceDate
            }
          }
        )

        if (!cancelled) {
          setSessions(response.data ?? [])
        }
      } catch (requestError) {
        if (!cancelled) {
          setSessions([])
          setError(
            requestError?.response?.data?.detail ||
            "Failed to load classes for this professor"
          )
        }
      } finally {
        if (!cancelled) {
          setLoadingSessions(false)
        }
      }
    }

    loadSessions()

    return () => {
      cancelled = true
    }
  }, [professorName, attendanceDate, shouldLoadSessions])

  const openSession = async (session) => {
    setSelectedSession(session)
    setLoadingRoster(true)
    setError("")

    try {
      const response = await api.get(
        "/attendance/session-roster",
        {
          params: {
            timetable_id: session.timetable_id,
            attendance_date: attendanceDate
          }
        }
      )

      const students = response.data ?? []
      setRoster(students)

      const initialStatus = {}

      students.forEach((student) => {
        initialStatus[student.student_id] =
          student.status || ""
      })

      setStatusByStudent(initialStatus)
    } catch (requestError) {
      setRoster([])
      setError(
        requestError?.response?.data?.detail ||
        "Failed to load students for this class"
      )
    } finally {
      setLoadingRoster(false)
    }
  }

  const closeSession = () => {
    setSelectedSession(null)
    setRoster([])
    setStatusByStudent({})
    setError("")
  }

  const setStatusForAll = (status) => {
    const next = {}

    roster.forEach((student) => {
      next[student.student_id] = status
    })

    setStatusByStudent(next)
  }

  const handleSaveRoster = async () => {
    if (!canSave || !selectedSession) {
      return
    }

    setSaving(true)
    setError("")

    try {
      const response = await api.post("/attendance/bulk", {
        entries: roster.map((student) => ({
          student_id: student.student_id,
          timetable_id: selectedSession.timetable_id,
          attendance_date: attendanceDate,
          status: statusByStudent[student.student_id]
        }))
      })

      const { created, updated, errors } = response.data

      if (errors?.length) {
        setError(errors.join(" "))
        return
      }

      closeSession()

      if (onSaved) {
        onSaved(
          `Attendance saved (${created} created, ${updated} updated)`
        )
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail ||
        "Failed to save attendance"
      )
    } finally {
      setSaving(false)
    }
  }

  const renderSessionList = () => {
    if (loadingSessions && shouldLoadSessions) {
      return <Loader />
    }

    if (!shouldLoadSessions) {
      return null
    }

    if (displaySessions.length === 0) {
      return (
        <p className="text-sm text-gray-500">
          No classes scheduled for this professor on the
          selected date.
        </p>
      )
    }

    return (
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {displaySessions.map((session) => (
          <button
            key={session.timetable_id}
            type="button"
            onClick={() => openSession(session)}
            className="
              text-left
              p-4
              rounded-xl
              border
              border-gray-200
              hover:border-blue-400
              hover:bg-blue-50
              transition
            "
          >
            <p className="font-semibold text-gray-900">
              {session.course_code} — {session.course_title}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {session.start_time}–{session.end_time} · Room{" "}
              {session.room_number}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {session.enrolled_count} student
              {session.enrolled_count === 1 ? "" : "s"} enrolled
              · Tap to mark attendance
            </p>
          </button>
        ))}
      </div>
    )
  }

  return (
    <section className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">
        Quick Mark Attendance
      </h2>

      <p className="text-sm text-gray-500 mb-5">
        Select a professor and date to see their classes,
        then mark present or absent for each student.
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <SearchableSelect
          id="mark-attendance-professor"
          label="Professor Name"
          placeholder="Search professor name"
          options={professorOptions}
          value={professorName}
          onChange={handleProfessorChange}
          emptyMessage="No professors found"
        />

        <FormField
          label="Date"
          htmlFor="mark-attendance-date"
        >
          <Input
            id="mark-attendance-date"
            type="date"
            value={attendanceDate}
            max={getTodayDateString()}
            onChange={(e) =>
              handleDateChange(e.target.value)
            }
          />
        </FormField>
      </div>

      {error && !selectedSession && (
        <p className="text-sm text-red-600 mb-4">
          {error}
        </p>
      )}

      {renderSessionList()}

      <Modal
        isOpen={!!selectedSession}
        onClose={closeSession}
        title={
          selectedSession
            ? (
              `${selectedSession.course_code} — ` +
              `${selectedSession.course_title}`
            )
            : ""
        }
        maxWidth="max-w-3xl"
      >
        {loadingRoster ? (
          <Loader />
        ) : roster.length === 0 ? (
          <p className="text-gray-500">
            No students enrolled in this class section.
          </p>
        ) : (
          <div className="flex flex-col max-h-[70vh]">
            <div className="shrink-0">
              <p className="text-sm text-gray-600 mb-1">
                Professor:{" "}
                <span className="font-medium text-gray-900">
                  {professorName}
                </span>
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {attendanceDate} · {selectedSession?.start_time}
                –{selectedSession?.end_time} · Room{" "}
                {selectedSession?.room_number}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  type="button"
                  onClick={() => setStatusForAll("Present")}
                  className="bg-green-600 text-sm"
                >
                  Mark all Present
                </Button>
                <Button
                  type="button"
                  onClick={() => setStatusForAll("Absent")}
                  className="bg-red-600 text-sm"
                >
                  Mark all Absent
                </Button>
              </div>

              {unmarkedCount > 0 && (
                <p className="text-sm text-amber-600 mb-3">
                  {unmarkedCount} student
                  {unmarkedCount === 1 ? "" : "s"} still need
                  an attendance status before you can submit.
                </p>
              )}

              {error && (
                <p className="text-sm text-red-600 mb-3">
                  {error}
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              <table className="w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="bg-slate-50">
                    <th className="p-3 text-left text-sm">
                      Student
                    </th>
                    <th className="p-3 text-left text-sm">
                      Attendance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((student) => {
                    const selected =
                      statusByStudent[student.student_id]

                    return (
                      <tr
                        key={student.student_id}
                        className="border-t"
                      >
                        <td className="p-3">
                          <p className="font-medium text-gray-900">
                            {student.student_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {student.student_code}
                          </p>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-2">
                            {ATTENDANCE_OPTIONS.map(
                              (status) => (
                                <label
                                  key={status}
                                  className={`
                                    px-3
                                    py-1.5
                                    rounded-full
                                    text-xs
                                    font-semibold
                                    cursor-pointer
                                    border
                                    ${selected === status
                                      ? status === "Present"
                                        ? "bg-green-100 text-green-700 border-green-300"
                                        : "bg-red-100 text-red-700 border-red-300"
                                      : "bg-white text-gray-600 border-gray-200"
                                    }
                                  `}
                                >
                                  <input
                                    type="radio"
                                    name={`attendance-${student.student_id}`}
                                    value={status}
                                    checked={selected === status}
                                    onChange={() =>
                                      setStatusByStudent({
                                        ...statusByStudent,
                                        [student.student_id]: status
                                      })
                                    }
                                    className="sr-only"
                                  />
                                  {status}
                                </label>
                              )
                            )}
                          </div>
                          {!selected && (
                            <p className="text-xs text-amber-600 mt-1">
                              Not marked yet
                            </p>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div
              className="
                shrink-0
                flex
                flex-wrap
                justify-end
                gap-3
                mt-6
                pt-4
                border-t
                border-gray-100
              "
            >
              <Button
                type="button"
                onClick={closeSession}
                className="bg-gray-500"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleSaveRoster}
                disabled={!canSave}
                className="bg-blue-600"
              >
                {saving ? "Submitting..." : "Submit Attendance"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}

export default MarkAttendancePanel
