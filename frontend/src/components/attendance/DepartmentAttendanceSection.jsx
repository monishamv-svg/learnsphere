import { useMemo, useState } from "react"

import { FiChevronDown, FiChevronRight } from "react-icons/fi"

import Button from "../common/Button"
import Input from "../common/Input"
import Select from "../common/Select"
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

const SEMESTER_OPTIONS = [
  "All",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8"
]

const PAGE_SIZE = 12

function formatClassSlot(record) {
  if (!record.courseCode) {
    return "—"
  }

  const time =
    record.startTime && record.endTime
      ? `${record.startTime}–${record.endTime}`
      : ""

  return `${record.courseCode} · ${record.dayOfWeek}${time ? ` · ${time}` : ""}`
}

function filterRecords(
  records,
  {
    day,
    semester,
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
      semester !== "All" &&
      String(record.semester) !== String(semester)
    ) {
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

function StatusBadge({ status }) {
  const isPresent = status === "Present"

  return (
    <span
      className={`
        inline-flex
        px-2
        py-0.5
        rounded-full
        text-xs
        font-medium
        ${isPresent
          ? "bg-green-50 text-green-700"
          : "bg-red-50 text-red-700"
        }
      `}
    >
      {status}
    </span>
  )
}

function AttendanceRows({
  records,
  onEdit,
  onDelete
}) {
  return records.map((record) => (
    <tr
      key={record.id}
      className="border-t border-gray-100 text-sm"
    >
      <td className="px-3 py-2 font-mono text-xs text-gray-700">
        {record.studentCode || "—"}
      </td>

      <td className="px-3 py-2 text-gray-900">
        {record.studentName || "—"}
      </td>

      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
        Sem {record.semester ?? "—"}
      </td>

      <td className="px-3 py-2 text-gray-600">
        {formatClassSlot(record)}
      </td>

      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
        {record.attendance_date}
      </td>

      <td className="px-3 py-2">
        <StatusBadge status={record.status} />
      </td>

      <td className="px-3 py-2">
        <div className="flex gap-1.5">
          <Button
            onClick={() => onEdit(record)}
            className="bg-amber-500 px-2 py-1 text-xs"
          >
            Edit
          </Button>

          <Button
            onClick={() => onDelete(record.id)}
            className="bg-red-600 px-2 py-1 text-xs"
          >
            Del
          </Button>
        </div>
      </td>
    </tr>
  ))
}

function AttendanceTable({
  records,
  onEdit,
  onDelete
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100">
      <table className="w-full min-w-[720px]">
        <thead className="bg-slate-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-3 py-2 text-left">Code</th>
            <th className="px-3 py-2 text-left">Student</th>
            <th className="px-3 py-2 text-left">Sem</th>
            <th className="px-3 py-2 text-left">Class</th>
            <th className="px-3 py-2 text-left">Date</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">Actions</th>
          </tr>
        </thead>

        <tbody>
          <AttendanceRows
            records={records}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </tbody>
      </table>
    </div>
  )
}

function DepartmentAttendanceSection({
  department,
  records,
  statusFilter,
  onEdit,
  onDelete
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [dayFilter, setDayFilter] = useState("All")
  const [semesterFilter, setSemesterFilter] = useState("All")
  const [courseFilter, setCourseFilter] = useState("All")
  const [studentSearch, setStudentSearch] = useState("")
  const [appliedStudentSearch, setAppliedStudentSearch] =
    useState("")
  const [page, setPage] = useState(0)

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
        semester: semesterFilter,
        studentName: appliedStudentSearch,
        courseId: courseFilter,
        status: statusFilter
      }),
    [
      records,
      dayFilter,
      semesterFilter,
      courseFilter,
      appliedStudentSearch,
      statusFilter
    ]
  )

  const recordsBySemester = useMemo(() => {
    const groups = new Map()

    for (const record of filteredRecords) {
      const semester = record.semester ?? "—"

      if (!groups.has(semester)) {
        groups.set(semester, [])
      }

      groups.get(semester).push(record)
    }

    return [...groups.entries()].sort(([left], [right]) => {
      if (left === "—") {
        return 1
      }

      if (right === "—") {
        return -1
      }

      return Number(left) - Number(right)
    })
  }, [filteredRecords])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / PAGE_SIZE)
  )

  const safePage = Math.min(page, totalPages - 1)

  const paginatedRecords = useMemo(() => {
    const start = safePage * PAGE_SIZE

    return filteredRecords.slice(start, start + PAGE_SIZE)
  }, [filteredRecords, safePage])

  const handleSearch = () => {
    setPage(0)
    setAppliedStudentSearch(studentSearch.trim())
  }

  const showSemesterGroups =
    semesterFilter === "All" && recordsBySemester.length > 1

  return (
    <section className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsExpanded((open) => !open)}
        className="
          w-full
          flex
          items-center
          justify-between
          gap-3
          px-4
          py-3
          text-left
          hover:bg-slate-50
        "
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {department}
          </h2>
          <p className="text-sm text-gray-500">
            {filteredRecords.length} record
            {filteredRecords.length === 1 ? "" : "s"}
            {records.length !== filteredRecords.length
              ? ` (of ${records.length} total)`
              : ""}
          </p>
        </div>

        {isExpanded ? (
          <FiChevronDown className="text-gray-500 shrink-0" />
        ) : (
          <FiChevronRight className="text-gray-500 shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          <div className="flex flex-wrap gap-2 mb-4">
            <Select
              value={semesterFilter}
              onChange={(e) => {
                setPage(0)
                setSemesterFilter(e.target.value)
              }}
              className="max-w-[130px] text-sm"
            >
              {SEMESTER_OPTIONS.map((semester) => (
                <option key={semester} value={semester}>
                  {semester === "All"
                    ? "All Semesters"
                    : `Semester ${semester}`}
                </option>
              ))}
            </Select>

            <Select
              value={dayFilter}
              onChange={(e) => {
                setPage(0)
                setDayFilter(e.target.value)
              }}
              className="max-w-[130px] text-sm"
            >
              {DAY_OPTIONS.map((day) => (
                <option key={day} value={day}>
                  {day === "All" ? "All Days" : day}
                </option>
              ))}
            </Select>

            <Select
              value={courseFilter}
              onChange={(e) => {
                setPage(0)
                setCourseFilter(e.target.value)
              }}
              className="max-w-[220px] text-sm"
            >
              <option value="All">All Courses</option>
              {courseOptions.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.label}
                </option>
              ))}
            </Select>

            <Input
              type="text"
              placeholder="Search student"
              value={studentSearch}
              onChange={(e) => {
                const value = e.target.value
                setStudentSearch(value)

                if (!value.trim()) {
                  setPage(0)
                  setAppliedStudentSearch("")
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch()
                }
              }}
              className="max-w-[180px] text-sm"
            />

            <Button
              onClick={handleSearch}
              className="bg-slate-600 text-sm px-3 py-2"
            >
              Search
            </Button>
          </div>

          {filteredRecords.length === 0 ? (
            <EmptyState
              message="No attendance records match these filters"
            />
          ) : showSemesterGroups ? (
            <div className="space-y-4">
              {recordsBySemester.map(([semester, semesterRecords]) => (
                <div key={semester}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Semester {semester}
                    <span className="ml-2 font-normal text-gray-500">
                      ({semesterRecords.length})
                    </span>
                  </h3>

                  <div className="max-h-64 overflow-y-auto">
                    <AttendanceTable
                      records={semesterRecords}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="max-h-80 overflow-y-auto">
                <AttendanceTable
                  records={paginatedRecords}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>

              {filteredRecords.length > PAGE_SIZE && (
                <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                  <span>
                    Page {safePage + 1} of {totalPages}
                  </span>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setPage((p) => p - 1)}
                      disabled={safePage === 0}
                      className="bg-slate-500 text-sm px-3 py-1.5"
                    >
                      Previous
                    </Button>

                    <Button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={safePage >= totalPages - 1}
                      className="bg-slate-500 text-sm px-3 py-1.5"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}

export default DepartmentAttendanceSection
