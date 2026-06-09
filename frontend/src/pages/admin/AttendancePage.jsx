import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react"

import api from "../../api/axios"

import DashboardLayout from "../../components/layout/DashboardLayout"
import DepartmentAttendanceSection from "../../components/attendance/DepartmentAttendanceSection"
import Button from "../../components/common/Button"
import Input from "../../components/common/Input"
import Select from "../../components/common/Select"
import Loader from "../../components/common/Loader"
import EmptyState from "../../components/common/EmptyState"
import ConfirmDialog from "../../components/common/ConfirmDialog"
import Modal from "../../components/common/Modal"
import FormField from "../../components/common/FormField"
import SearchableSelect from "../../components/common/SearchableSelect"
import { DEPARTMENTS, DEPARTMENT_FILTER_OPTIONS } from "../../constants/departments"
import {
  enrichAttendanceRecords,
  filterAttendanceRecords,
  groupRecordsByDepartment
} from "../../utils/attendanceRecords"

const ATTENDANCE_FETCH_LIMIT = 500
const STUDENT_FETCH_LIMIT = 100
const TIMETABLE_FETCH_LIMIT = 500
const ENROLLMENT_FETCH_LIMIT = 500
const COURSE_PAGE_LIMIT = 100

const DISABLED_READONLY_FIELD_CLASS =
  "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"

const emptyForm = {
  student_id: "",
  timetable_id: "",
  attendance_date: "",
  status: "Present"
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
]

function getTodayDateString() {
  const today = new Date()

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-")
}

function getDayNameFromDate(dateStr) {
  if (!dateStr) return null

  return WEEKDAYS[
    new Date(`${dateStr}T12:00:00`).getDay()
  ]
}

function validateAttendanceDateNotFuture(date) {
  if (!date) {
    return { valid: true }
  }

  if (date > getTodayDateString()) {
    return {
      valid: false,
      message:
        "Attendance cannot be marked for a future date"
    }
  }

  return { valid: true }
}

function formatTimetableLabel(timetable, courses = []) {
  if (!timetable) return "—"

  const course = courses.find(
    (c) => c.id === timetable.course_id
  )

  const courseLabel = course
    ? `${course.course_code} — ${course.title}`
    : `Course #${timetable.course_id}`

  return (
    `${courseLabel} · ${timetable.day_of_week} ` +
    `(${timetable.start_time}–${timetable.end_time})`
  )
}

function validateDateMatchesTimetable(
  date,
  timetableId,
  timetables
) {
  const timetable = timetables.find(
    (t) => t.id === Number(timetableId)
  )

  if (!timetable || !date) {
    return { valid: true }
  }

  const dayName = getDayNameFromDate(date)

  if (dayName !== timetable.day_of_week) {
    return {
      valid: false,
      message:
        `This class runs on ${timetable.day_of_week}. ` +
        `You selected ${dayName}.`
    }
  }

  return { valid: true }
}

function validateAttendanceDate(
  date,
  timetableId,
  timetables
) {
  const futureCheck =
    validateAttendanceDateNotFuture(date)

  if (!futureCheck.valid) {
    return futureCheck
  }

  return validateDateMatchesTimetable(
    date,
    timetableId,
    timetables
  )
}

async function fetchAllCourses() {
  const courseItems = []
  let skip = 0
  let totalCourses

  do {
    const response = await api.get("/courses", {
      params: {
        skip,
        limit: COURSE_PAGE_LIMIT
      }
    })

    courseItems.push(...response.data.items)
    totalCourses = response.data.total_count
    skip += COURSE_PAGE_LIMIT
  } while (courseItems.length < totalCourses)

  return courseItems
}

function AttendancePage() {
  const [attendanceRecords, setAttendanceRecords] =
    useState([])

  const [students, setStudents] = useState([])

  const [timetables, setTimetables] = useState([])

  const [enrollments, setEnrollments] = useState([])

  const [courses, setCourses] = useState([])

  const [fetching, setFetching] = useState(true)

  const [loading, setLoading] = useState(false)

  const [showModal, setShowModal] = useState(false)

  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState(emptyForm)

  const [toast, setToast] = useState(null)

  const [dateError, setDateError] = useState("")

  const [statusFilter, setStatusFilter] =
    useState("All")

  const [departmentFilter, setDepartmentFilter] =
    useState("All")

  const [studentSearch, setStudentSearch] = useState("")

  const [appliedStudentSearch, setAppliedStudentSearch] =
    useState("")

  const [confirmDelete, setConfirmDelete] =
    useState(null)

  const showToast = (type, message) => {
    setToast({ type, message })

    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  const fetchAttendance = useCallback(async () => {
    setFetching(true)

    try {
      const [
        attendanceResult,
        studentsResult,
        timetablesResult,
        enrollmentsResult,
        coursesResult
      ] = await Promise.allSettled([
        api.get("/attendance", {
          params: {
            skip: 0,
            limit: ATTENDANCE_FETCH_LIMIT
          }
        }),
        api.get("/students", {
          params: {
            skip: 0,
            limit: STUDENT_FETCH_LIMIT
          }
        }),
        api.get("/timetables", {
          params: {
            skip: 0,
            limit: TIMETABLE_FETCH_LIMIT
          }
        }),
        api.get("/enrollments", {
          params: {
            skip: 0,
            limit: ENROLLMENT_FETCH_LIMIT
          }
        }),
        fetchAllCourses()
      ])

      if (attendanceResult.status === "fulfilled") {
        setAttendanceRecords(
          attendanceResult.value.data ?? []
        )
      } else {
        setAttendanceRecords([])
        console.error(attendanceResult.reason)
      }

      if (studentsResult.status === "fulfilled") {
        setStudents(
          studentsResult.value.data.items ?? []
        )
      } else {
        setStudents([])
        console.error(studentsResult.reason)
      }

      if (timetablesResult.status === "fulfilled") {
        const timetableData =
          timetablesResult.value.data

        setTimetables(
          Array.isArray(timetableData)
            ? timetableData
            : timetableData?.items ?? []
        )
      } else {
        setTimetables([])
        console.error(timetablesResult.reason)
      }

      if (enrollmentsResult.status === "fulfilled") {
        const enrollmentData =
          enrollmentsResult.value.data

        setEnrollments(
          Array.isArray(enrollmentData)
            ? enrollmentData
            : enrollmentData?.items ?? []
        )
      } else {
        setEnrollments([])
        console.error(enrollmentsResult.reason)
      }

      if (coursesResult.status === "fulfilled") {
        setCourses(coursesResult.value ?? [])
      } else {
        setCourses([])
        console.error(coursesResult.reason)
      }

      if (
        attendanceResult.status === "rejected" ||
        studentsResult.status === "rejected" ||
        timetablesResult.status === "rejected"
      ) {
        showToast(
          "error",
          "Some attendance data failed to load"
        )
      }
    } catch (error) {
      console.error(error)
      showToast("error", "Failed to load attendance")
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      await fetchAttendance()
    })()
  }, [fetchAttendance])

  const enrichedRecords = useMemo(
    () =>
      enrichAttendanceRecords(
        attendanceRecords,
        students,
        timetables,
        courses
      ),
    [attendanceRecords, students, timetables, courses]
  )

  const globallyFilteredRecords = useMemo(
    () =>
      filterAttendanceRecords(enrichedRecords, {
        status: statusFilter,
        studentSearch: appliedStudentSearch
      }),
    [
      enrichedRecords,
      statusFilter,
      appliedStudentSearch
    ]
  )

  const recordsByDepartment = useMemo(
    () =>
      groupRecordsByDepartment(
        globallyFilteredRecords,
        DEPARTMENTS
      ),
    [globallyFilteredRecords]
  )

  const visibleDepartments = useMemo(() => {
    const departments =
      departmentFilter === "All"
        ? DEPARTMENTS
        : [departmentFilter]

    return departments.filter(
      (department) =>
        (recordsByDepartment[department]?.length ?? 0) > 0
    )
  }, [departmentFilter, recordsByDepartment])

  const handleStudentSearch = () => {
    setAppliedStudentSearch(studentSearch.trim())
  }

  const openCreateModal = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDateError("")
    setShowModal(true)
  }

  const openEditModal = (record) => {
    setEditingId(record.id)
    setForm({
      student_id: String(record.student_id),
      timetable_id: String(record.timetable_id),
      attendance_date: record.attendance_date,
      status: record.status
    })
    setDateError("")
    setShowModal(true)
  }

  const selectedTimetable = timetables.find(
    (t) => t.id === Number(form.timetable_id)
  )

  const selectedStudent = students.find(
    (s) => s.id === Number(form.student_id)
  )

  const studentOptions = useMemo(
    () =>
      students.map((student) => ({
        value: student.id,
        label: (
          `${student.student_code} — ${student.full_name}`
        ),
        searchText: (
          `${student.student_code} ${student.full_name} ` +
          `${student.department} ${student.semester}`
        )
      })),
    [students]
  )

  const handleStudentChange = (studentId) => {
    setForm({
      ...form,
      student_id: String(studentId),
      timetable_id: "",
      attendance_date: ""
    })
    setDateError("")
  }

  const enrolledCourseIds = enrollments
    .filter(
      (e) =>
        e.student_id === Number(form.student_id)
    )
    .map((e) => e.course_id)

  const availableTimetables = form.student_id
    ? timetables.filter((t) =>
        enrolledCourseIds.includes(t.course_id)
      )
    : []

  const handleSubmit = async (e) => {
    e.preventDefault()

    const dateCheck = validateAttendanceDate(
      form.attendance_date,
      form.timetable_id,
      timetables
    )

    if (!dateCheck.valid) {
      setDateError(dateCheck.message)
      return
    }

    if (
      !editingId &&
      form.student_id &&
      availableTimetables.length === 0
    ) {
      showToast(
        "error",
        "This student has no enrolled courses with timetable slots"
      )
      return
    }

    setDateError("")
    setLoading(true)

    const payload = {
      student_id: Number(form.student_id),
      timetable_id: Number(form.timetable_id),
      attendance_date: form.attendance_date,
      status: form.status
    }

    try {
      if (editingId) {
        await api.put(
          `/attendance/${editingId}`,
          payload
        )

        showToast(
          "success",
          "Attendance updated successfully"
        )
      } else {
        await api.post(
          "/attendance",
          payload
        )

        showToast(
          "success",
          "Attendance created successfully"
        )
      }

      setShowModal(false)
      setEditingId(null)
      setForm(emptyForm)

      fetchAttendance()
    } catch (error) {
      const detail = error.response?.data?.detail
      const message = error.response?.data?.message

      showToast(
        "error",
        detail ||
        message ||
        "Operation failed"
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(
        `/attendance/${id}`
      )

      showToast(
        "success",
        "Attendance deleted successfully"
      )

      fetchAttendance()
    } catch (error) {
      const detail = error.response?.data?.detail
      const message = error.response?.data?.message

      showToast(
        "error",
        detail ||
        message ||
        "Delete failed"
      )
    } finally {
      setConfirmDelete(null)
    }
  }

  const hasAnyRecords = enrichedRecords.length > 0

  const hasVisibleRecords = visibleDepartments.length > 0

  if (fetching) {
    return (
      <DashboardLayout>
        <Loader />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Attendance
        </h1>

        <Button
          onClick={openCreateModal}
          className="bg-blue-600"
        >
          + Attendance
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
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
              handleStudentSearch()
            }
          }}
          className="max-w-xs"
        />

        <Button
          onClick={handleStudentSearch}
          className="bg-slate-600"
        >
          Search
        </Button>

        <Select
          value={departmentFilter}
          onChange={(e) =>
            setDepartmentFilter(e.target.value)
          }
          className="max-w-[240px]"
        >
          {DEPARTMENT_FILTER_OPTIONS.map((department) => (
            <option key={department} value={department}>
              {department === "All"
                ? "All Departments"
                : department}
            </option>
          ))}
        </Select>

        <Select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
          className="max-w-[160px]"
        >
          <option value="All">All Statuses</option>
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
          <option value="Late">Late</option>
        </Select>
      </div>

      {!hasAnyRecords ? (
        <EmptyState message="No attendance records found" />
      ) : !hasVisibleRecords ? (
        <EmptyState message="No attendance records match your filters" />
      ) : (
        visibleDepartments.map((department) => (
          <DepartmentAttendanceSection
            key={department}
            department={department}
            records={recordsByDepartment[department]}
            statusFilter={statusFilter}
            onEdit={openEditModal}
            onDelete={setConfirmDelete}
          />
        ))
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingId(null)
          setForm(emptyForm)
          setDateError("")
        }}
        title={
          editingId
            ? "Edit Attendance"
            : "Create Attendance"
        }
        maxWidth="max-w-md"
      >
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          {editingId ? (
            <FormField
              label="Student"
              htmlFor="attendance-student"
            >
              <Input
                id="attendance-student"
                value={
                  selectedStudent
                    ? (
                      `${selectedStudent.student_code} — ` +
                      `${selectedStudent.full_name}`
                    )
                    : "—"
                }
                disabled
                readOnly
                className={DISABLED_READONLY_FIELD_CLASS}
              />
            </FormField>
          ) : (
            <SearchableSelect
              id="attendance-student"
              label="Student"
              placeholder="Search by student code or name"
              options={studentOptions}
              value={form.student_id}
              onChange={handleStudentChange}
              required
              emptyMessage="No students match your search"
            />
          )}

          {editingId ? (
            <FormField
              label="Class Slot"
              htmlFor="attendance-class-slot"
            >
              <Input
                id="attendance-class-slot"
                value={formatTimetableLabel(
                  selectedTimetable,
                  courses
                )}
                disabled
                readOnly
                className={DISABLED_READONLY_FIELD_CLASS}
              />
            </FormField>
          ) : (
            <FormField
              label="Class Slot"
              htmlFor="attendance-class-slot"
            >
              <Select
                id="attendance-class-slot"
                value={form.timetable_id}
                onChange={(e) => {
                  setForm({
                    ...form,
                    timetable_id: e.target.value,
                    attendance_date: ""
                  })
                  setDateError("")
                }}
                required
              >
                <option value="">
                  {form.student_id
                    ? availableTimetables.length
                      ? "Select class slot"
                      : "No slots for enrolled courses"
                    : "Select student first"}
                </option>

                {availableTimetables.map((timetable) => (
                  <option
                    key={timetable.id}
                    value={timetable.id}
                  >
                    {formatTimetableLabel(
                      timetable,
                      courses
                    )}
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          {!editingId && form.student_id &&
            availableTimetables.length === 0 && (
            <p className="text-sm text-amber-600">
              Enroll this student in a course that has a
              timetable slot, or add a slot under Timetable.
            </p>
          )}

          <Input
            type="date"
            value={form.attendance_date}
            max={getTodayDateString()}
            onChange={(e) => {
              setForm({
                ...form,
                attendance_date: e.target.value
              })

              const result = validateAttendanceDate(
                e.target.value,
                form.timetable_id,
                timetables
              )

              setDateError(
                result.valid ? "" : result.message
              )
            }}
            className={
              dateError ? "border-red-500" : ""
            }
            required
          />

          <p className="text-sm text-gray-600">
            {selectedTimetable ? (
              <>
                Pick a date on or before today that falls on{" "}
                <strong>
                  {selectedTimetable.day_of_week}
                </strong>
              </>
            ) : (
              "Pick a date on or before today"
            )}
          </p>

          {dateError && (
            <p className="text-sm text-red-600">
              {dateError}
            </p>
          )}

          <Select
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value
              })
            }
          >
            <option value="Present">
              Present
            </option>
            <option value="Absent">
              Absent
            </option>
            <option value="Late">
              Late
            </option>
          </Select>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600"
            >
              {
                loading
                  ? "Saving..."
                  : "Save"
              }
            </Button>

            <Button
              type="button"
              onClick={() => {
                setShowModal(false)
                setEditingId(null)
                setForm(emptyForm)
                setDateError("")
              }}
              className="bg-gray-500"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Attendance"
        message="Delete this attendance record?"
        onConfirm={() =>
          handleDelete(confirmDelete)
        }
        onCancel={() =>
          setConfirmDelete(null)
        }
      />

      {toast && (
        <div
          className={`
            fixed
            top-5
            right-5
            px-4
            py-3
            rounded
            text-white
            z-50
            ${
              toast.type === "success"
                ? "bg-green-600"
                : "bg-red-600"
            }
          `}
        >
          {toast.message}
        </div>
      )}
    </DashboardLayout>
  )
}

export default AttendancePage
