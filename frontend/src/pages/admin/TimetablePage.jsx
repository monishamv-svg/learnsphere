import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react"

import { toast } from "react-toastify"

import api from "../../api/axios"

import DashboardLayout from "../../components/layout/DashboardLayout"
import TimetableModal from "../../components/timetables/TimetableModal"
import SemesterScheduleView from "../../components/timetables/SemesterScheduleView"
import Button from "../../components/common/Button"
import Input from "../../components/common/Input"
import Select from "../../components/common/Select"
import Table from "../../components/common/Table"
import Loader from "../../components/common/Loader"
import EmptyState from "../../components/common/EmptyState"
import ConfirmDialog from "../../components/common/ConfirmDialog"
import { DEPARTMENT_FILTER_OPTIONS } from "../../constants/departments"

const TIMETABLE_FETCH_LIMIT = 500
const COURSE_PAGE_LIMIT = 100
const PAGE_SIZE = 10

const DAYS = [
  "All",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
]

const SEMESTERS = [
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

function enrichEntries(entries, courses) {
  const courseById = new Map(
    courses.map((course) => [course.id, course])
  )

  return entries.map((entry) => {
    const course = courseById.get(entry.course_id)

    return {
      ...entry,
      courseCode: course?.course_code ?? "",
      courseTitle: course?.title ?? "",
      department: course?.department ?? "",
      semester: course?.semester ?? null
    }
  })
}

function filterEntries(
  entries,
  {
    search,
    day,
    department,
    semester
  }
) {
  const query = search.trim().toLowerCase()

  return entries.filter((entry) => {
    if (day && entry.day_of_week !== day) {
      return false
    }

    if (department && entry.department !== department) {
      return false
    }

    if (semester && entry.semester !== Number(semester)) {
      return false
    }

    if (!query) {
      return true
    }

    return (
      entry.courseCode.toLowerCase().includes(query) ||
      entry.courseTitle.toLowerCase().includes(query) ||
      entry.instructor_name.toLowerCase().includes(query) ||
      entry.room_number.toLowerCase().includes(query) ||
      entry.day_of_week.toLowerCase().includes(query)
    )
  })
}

function TimetablePage() {

  const [entries, setEntries] = useState([])

  const [courses, setCourses] = useState([])

  const [loading, setLoading] = useState(true)

  const [submitting, setSubmitting] = useState(false)

  const [showModal, setShowModal] = useState(false)

  const [editingEntry, setEditingEntry] = useState(null)

  const [confirmDelete, setConfirmDelete] = useState(null)

  const [page, setPage] = useState(0)

  const [search, setSearch] = useState("")

  const [appliedSearch, setAppliedSearch] =
    useState("")

  const [dayFilter, setDayFilter] = useState("All")

  const [appliedDay, setAppliedDay] = useState("")

  const [departmentFilter, setDepartmentFilter] =
    useState("All")

  const [appliedDepartment, setAppliedDepartment] =
    useState("")

  const [semesterFilter, setSemesterFilter] =
    useState("All")

  const [appliedSemester, setAppliedSemester] =
    useState("")

  const [viewMode, setViewMode] = useState("grouped")

  const [scheduleRefreshKey, setScheduleRefreshKey] =
    useState(0)

  const enrichedEntries = useMemo(
    () => enrichEntries(entries, courses),
    [entries, courses]
  )

  const filteredEntries = useMemo(
    () =>
      filterEntries(enrichedEntries, {
        search: appliedSearch,
        day: appliedDay,
        department: appliedDepartment,
        semester: appliedSemester
      }),
    [
      enrichedEntries,
      appliedSearch,
      appliedDay,
      appliedDepartment,
      appliedSemester
    ]
  )

  const paginatedEntries = useMemo(() => {
    const start = page * PAGE_SIZE

    return filteredEntries.slice(
      start,
      start + PAGE_SIZE
    )
  }, [filteredEntries, page])

  const fetchTimetables = useCallback(async () => {
    setLoading(true)

    try {
      const timetableRes = await api.get("/timetables/", {
        params: {
          skip: 0,
          limit: TIMETABLE_FETCH_LIMIT
        }
      })

      const courseItems = []
      let skip = 0
      let totalCourses = 0

      do {
        const coursesRes = await api.get("/courses/", {
          params: {
            skip,
            limit: COURSE_PAGE_LIMIT
          }
        })

        courseItems.push(...coursesRes.data.items)
        totalCourses = coursesRes.data.total_count
        skip += COURSE_PAGE_LIMIT
      } while (courseItems.length < totalCourses)

      setEntries(
        timetableRes.data.items ?? []
      )

      setCourses(courseItems)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load timetable")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)

      try {
        const timetableRes = await api.get("/timetables/", {
          params: {
            skip: 0,
            limit: TIMETABLE_FETCH_LIMIT
          }
        })

        const courseItems = []
        let skip = 0
        let totalCourses = 0

        do {
          const coursesRes = await api.get("/courses/", {
            params: {
              skip,
              limit: COURSE_PAGE_LIMIT
            }
          })

          courseItems.push(...coursesRes.data.items)
          totalCourses = coursesRes.data.total_count
          skip += COURSE_PAGE_LIMIT
        } while (courseItems.length < totalCourses)

        if (cancelled) {
          return
        }

        setEntries(
          timetableRes.data.items ?? []
        )
        setCourses(courseItems)
      } catch (error) {
        console.error(error)

        if (!cancelled) {
          toast.error("Failed to load timetable")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  const handleSearch = () => {
    setAppliedSearch(search.trim())
    setPage(0)
  }

  const handleDayChange = (value) => {
    setDayFilter(value)
    setAppliedDay(value === "All" ? "" : value)
    setPage(0)
  }

  const handleDepartmentChange = (value) => {
    setDepartmentFilter(value)
    setAppliedDepartment(
      value === "All" ? "" : value
    )
    setPage(0)
  }

  const handleSemesterChange = (value) => {
    setSemesterFilter(value)
    setAppliedSemester(
      value === "All" ? "" : value
    )
    setPage(0)
  }

  const courseTitle = (entry) => {
    if (entry.courseCode) {
      return `${entry.courseCode} — ${entry.courseTitle}`
    }

    const course = courses.find(
      (c) => c.id === entry.course_id
    )

    return course
      ? `${course.course_code} — ${course.title}`
      : entry.course_id
  }

  const handleSubmit = async (data) => {
    setSubmitting(true)

    try {
      if (editingEntry) {
        await api.patch(
          `/timetables/${editingEntry.id}`,
          {
            day_of_week: data.day_of_week,
            start_time: data.start_time,
            end_time: data.end_time,
            room_number: data.room_number,
            instructor_name: data.instructor_name
          }
        )

        toast.success(
          "Timetable updated successfully"
        )
      } else {
        await api.post(
          "/timetables",
          data
        )

        toast.success(
          "Timetable created successfully"
        )
      }

      setShowModal(false)
      setEditingEntry(null)
      fetchTimetables()
      setScheduleRefreshKey((key) => key + 1)
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
        "Operation failed"
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(
        `/timetables/${id}`
      )

      toast.success(
        "Timetable deleted successfully"
      )

      fetchTimetables()
      setScheduleRefreshKey((key) => key + 1)
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
        "Delete failed"
      )
    } finally {
      setConfirmDelete(null)
    }
  }

  const isInitialLoad =
    loading && entries.length === 0

  if (isInitialLoad) {
    return (
      <DashboardLayout>
        <Loader />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>

      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Timetable Management
          </h1>
          <p className="text-gray-500 mt-1">
            Browse schedules by semester, or view all entries
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingEntry(null)
            setShowModal(true)
          }}
          className="bg-blue-600"
        >
          + Timetable
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          onClick={() => setViewMode("grouped")}
          className={
            viewMode === "grouped"
              ? "bg-violet-600"
              : "bg-slate-500"
          }
        >
          By Semester
        </Button>

        <Button
          onClick={() => setViewMode("list")}
          className={
            viewMode === "list"
              ? "bg-violet-600"
              : "bg-slate-500"
          }
        >
          All Entries
        </Button>
      </div>

      {viewMode === "grouped" ? (
        <SemesterScheduleView
          refreshKey={scheduleRefreshKey}
          onEdit={(entry) => {
            setEditingEntry(entry)
            setShowModal(true)
          }}
          onDelete={(id) => setConfirmDelete(id)}
          onGenerated={() => {
            fetchTimetables()
            setScheduleRefreshKey((key) => key + 1)
          }}
        />
      ) : (
      <>
      <div className="flex flex-wrap gap-3 mb-6">
        <Input
          type="text"
          placeholder="Search course, room, professor, day"
          value={search}
          onChange={(e) => {
            const value = e.target.value
            setSearch(value)

            if (!value.trim()) {
              setAppliedSearch("")
              setPage(0)
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
          value={dayFilter}
          onChange={(e) =>
            handleDayChange(e.target.value)
          }
          className="max-w-[160px]"
        >
          {DAYS.map((day) => (
            <option key={day} value={day}>
              {day === "All" ? "All Days" : day}
            </option>
          ))}
        </Select>

        <Select
          value={departmentFilter}
          onChange={(e) =>
            handleDepartmentChange(e.target.value)
          }
          className="max-w-xs"
        >
          {DEPARTMENT_FILTER_OPTIONS.map((dept) => (
            <option key={dept} value={dept}>
              {dept === "All"
                ? "All Departments"
                : dept}
            </option>
          ))}
        </Select>

        <Select
          value={semesterFilter}
          onChange={(e) =>
            handleSemesterChange(e.target.value)
          }
          className="max-w-[160px]"
        >
          {SEMESTERS.map((sem) => (
            <option key={sem} value={sem}>
              {sem === "All"
                ? "All Semesters"
                : `Semester ${sem}`}
            </option>
          ))}
        </Select>
      </div>

      {entries.length === 0 ? (
        <EmptyState message="No timetable entries found" />
      ) : filteredEntries.length === 0 ? (
        <EmptyState message="No timetable entries match your filters" />
      ) : (
        <Table
          columns={[
            "Course",
            "Semester",
            "Day",
            "Time",
            "Room",
            "Professor",
            "Actions"
          ]}
        >
          {paginatedEntries.map((entry) => (
            <tr
              key={entry.id}
              className="border-t"
            >
              <td className="p-3">
                {courseTitle(entry)}
              </td>
              <td className="p-3">
                {entry.semester ?? "—"}
              </td>
              <td className="p-3">
                {entry.day_of_week}
              </td>
              <td className="p-3">
                {entry.start_time} – {entry.end_time}
              </td>
              <td className="p-3">
                {entry.room_number}
              </td>
              <td className="p-3">
                {entry.instructor_name}
              </td>
              <td className="p-3">
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setEditingEntry(entry)
                      setShowModal(true)
                    }}
                    className="bg-amber-500 px-3 py-1 text-sm"
                  >
                    Edit
                  </Button>

                  <Button
                    onClick={() =>
                      setConfirmDelete(entry.id)
                    }
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

      {filteredEntries.length > 0 && (
        <div className="mt-6 flex gap-4 items-center">
          <Button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="bg-slate-600"
          >
            Previous
          </Button>

          <span className="text-gray-600">
            Page {page + 1} of{" "}
            {Math.max(
              1,
              Math.ceil(filteredEntries.length / PAGE_SIZE)
            )}
          </span>

          <Button
            disabled={
              (page + 1) * PAGE_SIZE >=
              filteredEntries.length
            }
            onClick={() => setPage(page + 1)}
            className="bg-slate-600"
          >
            Next
          </Button>
        </div>
      )}
      </>
      )}

      <TimetableModal
        key={
          editingEntry
            ? `edit-${editingEntry.id}`
            : "create"
        }
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingEntry(null)
        }}
        onSubmit={handleSubmit}
        initialData={editingEntry}
        courses={courses}
        existingEntries={entries}
        submitting={submitting}
      />

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Timetable"
        message="Delete this timetable entry?"
        onConfirm={() =>
          handleDelete(confirmDelete)
        }
        onCancel={() =>
          setConfirmDelete(null)
        }
      />

    </DashboardLayout>
  )
}

export default TimetablePage
