import { useMemo, useState } from "react"

import Button from "../common/Button"
import Input from "../common/Input"
import Select from "../common/Select"
import Table from "../common/Table"
import EmptyState from "../common/EmptyState"

const DAY_OPTIONS = [
  "All",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
]

function formatTimetableLabel(record) {
  if (!record.courseLabel) {
    return "—"
  }

  return (
    `${record.courseLabel} · ${record.dayOfWeek} ` +
    `(${record.startTime}–${record.endTime})`
  )
}

function filterRecords(
  records,
  {
    day,
    studentName,
    courseId,
    status
  }
) {
  const nameQuery = studentName.trim().toLowerCase()

  return records.filter((record) => {
    if (day !== "All" && record.dayOfWeek !== day) {
      return false
    }

    if (
      courseId !== "All" &&
      String(record.courseId) !== String(courseId)
    ) {
      return false
    }

    if (status !== "All" && record.status !== status) {
      return false
    }

    if (!nameQuery) {
      return true
    }

    return (
      record.studentName.toLowerCase().includes(nameQuery) ||
      record.studentCode.toLowerCase().includes(nameQuery)
    )
  })
}

function DepartmentAttendanceSection({
  department,
  records,
  statusFilter,
  onEdit,
  onDelete
}) {
  const [dayFilter, setDayFilter] = useState("All")
  const [courseFilter, setCourseFilter] = useState("All")
  const [studentSearch, setStudentSearch] = useState("")
  const [appliedStudentSearch, setAppliedStudentSearch] =
    useState("")

  const courseOptions = useMemo(() => {
    const byCourseId = new Map()

    for (const record of records) {
      if (!record.courseId) {
        continue
      }

      byCourseId.set(record.courseId, {
        id: record.courseId,
        label: record.courseLabel
      })
    }

    return Array.from(byCourseId.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    )
  }, [records])

  const filteredRecords = useMemo(
    () =>
      filterRecords(records, {
        day: dayFilter,
        studentName: appliedStudentSearch,
        courseId: courseFilter,
        status: statusFilter
      }),
    [
      records,
      dayFilter,
      courseFilter,
      appliedStudentSearch,
      statusFilter
    ]
  )

  const handleSearch = () => {
    setAppliedStudentSearch(studentSearch.trim())
  }

  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {department}
      </h2>

      <div className="flex flex-wrap gap-3 mb-4">
        <Select
          value={dayFilter}
          onChange={(e) => setDayFilter(e.target.value)}
          className="max-w-[160px]"
        >
          {DAY_OPTIONS.map((day) => (
            <option key={day} value={day}>
              {day === "All" ? "All Days" : day}
            </option>
          ))}
        </Select>

        <Input
          type="text"
          placeholder="Search student name or code"
          value={studentSearch}
          onChange={(e) => {
            const value = e.target.value
            setStudentSearch(value)

            if (!value.trim()) {
              setAppliedStudentSearch("")
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch()
            }
          }}
          className="max-w-xs"
        />

        <Button
          onClick={handleSearch}
          className="bg-slate-600"
        >
          Search
        </Button>

        <Select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="max-w-[280px]"
        >
          <option value="All">All Courses</option>
          {courseOptions.map((course) => (
            <option key={course.id} value={course.id}>
              {course.label}
            </option>
          ))}
        </Select>
      </div>

      {filteredRecords.length === 0 ? (
        <EmptyState
          message="No attendance records match these filters"
        />
      ) : (
        <Table
          columns={[
            "Student Code",
            "Student",
            "Class Slot",
            "Date",
            "Status",
            "Actions"
          ]}
        >
          {filteredRecords.map((record) => (
            <tr key={record.id} className="border-t">
              <td className="p-3">
                {record.studentCode || "—"}
              </td>

              <td className="p-3">
                {record.studentName || "—"}
              </td>

              <td className="p-3 text-sm">
                {formatTimetableLabel(record)}
              </td>

              <td className="p-3">
                {record.attendance_date}
              </td>

              <td className="p-3">
                {record.status}
              </td>

              <td className="p-3">
                <div className="flex gap-2">
                  <Button
                    onClick={() => onEdit(record)}
                    className="bg-amber-500 px-3 py-1 text-sm"
                  >
                    Edit
                  </Button>

                  <Button
                    onClick={() => onDelete(record.id)}
                    className="bg-red-600 px-3 py-1 text-sm"
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </section>
  )
}

export default DepartmentAttendanceSection
