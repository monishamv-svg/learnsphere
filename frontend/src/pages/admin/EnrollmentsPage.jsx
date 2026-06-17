import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react"

import api from "../../api/axios"

import DashboardLayout from "../../components/layout/DashboardLayout"
import Button from "../../components/common/Button"
import Input from "../../components/common/Input"
import Select from "../../components/common/Select"
import FormField from "../../components/common/FormField"
import SearchableSelect from "../../components/common/SearchableSelect"
import Loader from "../../components/common/Loader"
import EmptyState from "../../components/common/EmptyState"
import ConfirmDialog from "../../components/common/ConfirmDialog"
import Modal from "../../components/common/Modal"
import CourseTypeBadge from "../../components/courses/CourseTypeBadge"
import { DEPARTMENT_FILTER_OPTIONS } from "../../constants/departments"
import { filterEligibleCourses, studentHasElectiveEnrollment } from "../../utils/courseEligibility"
import {
  buildEnrolledSlots,
  findStudentScheduleConflict
} from "../../utils/studentSchedule"

import { toast } from "react-toastify"

const STUDENT_PAGE_SIZE = 10
const ENROLLMENT_FETCH_LIMIT = 500
const STUDENT_FETCH_LIMIT = 100
const COURSE_FETCH_LIMIT = 100

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

function groupEnrollmentsByStudent(enrollments, students = []) {
  const departmentByStudentId = new Map(
    students.map((student) => [
      student.id,
      student.department
    ])
  )

  const groups = new Map()

  for (const enrollment of enrollments) {
    if (!groups.has(enrollment.student_id)) {
      groups.set(enrollment.student_id, {
        student_id: enrollment.student_id,
        student_code: enrollment.student_code,
        student_name: enrollment.student_name,
        semester: enrollment.semester,
        department: departmentByStudentId.get(
          enrollment.student_id
        ) || "",
        enrollments: [],
        totalCredits: 0
      })
    }

    const group = groups.get(enrollment.student_id)

    group.enrollments.push(enrollment)
    group.totalCredits += enrollment.credits
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.student_code.localeCompare(b.student_code)
  )
}

function filterStudentGroups(
  groups,
  {
    search,
    department,
    semester
  }
) {
  const query = search.trim().toLowerCase()

  return groups.filter((group) => {
    if (department && group.department !== department) {
      return false
    }

    if (semester && group.semester !== Number(semester)) {
      return false
    }

    if (!query) {
      return true
    }

    return (
      group.student_code.toLowerCase().includes(query) ||
      group.student_name.toLowerCase().includes(query)
    )
  })
}

function EnrollmentsPage() {

  const [enrollments, setEnrollments] = useState([])

  const [students, setStudents] = useState([])

  const [semesterCourses, setSemesterCourses] = useState([])

  const [loadingSemesterCourses, setLoadingSemesterCourses] =
    useState(false)

  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(null)

  const [expandedStudents, setExpandedStudents] = useState(
    new Set()
  )

  const [form, setForm] = useState({
    student_id: "",
    course_id: "",
    timetable_id: ""
  })

  const [courseSections, setCourseSections] = useState([])
  const [loadingCourseSections, setLoadingCourseSections] =
    useState(false)

  const [page, setPage] = useState(0)

  const [search, setSearch] = useState("")

  const [appliedSearch, setAppliedSearch] =
    useState("")

  const [departmentFilter, setDepartmentFilter] =
    useState("All")

  const [appliedDepartment, setAppliedDepartment] =
    useState("")

  const [semesterFilter, setSemesterFilter] =
    useState("All")

  const [appliedSemester, setAppliedSemester] =
    useState("")

  const studentGroups = useMemo(
    () => groupEnrollmentsByStudent(enrollments, students),
    [enrollments, students]
  )

  const filteredGroups = useMemo(
    () =>
      filterStudentGroups(studentGroups, {
        search: appliedSearch,
        department: appliedDepartment,
        semester: appliedSemester
      }),
    [
      studentGroups,
      appliedSearch,
      appliedDepartment,
      appliedSemester
    ]
  )

  const paginatedGroups = useMemo(() => {
    const start = page * STUDENT_PAGE_SIZE

    return filteredGroups.slice(
      start,
      start + STUDENT_PAGE_SIZE
    )
  }, [filteredGroups, page])

  const selectedStudent = useMemo(
    () =>
      students.find(
        (student) =>
          String(student.id) === String(form.student_id)
      ) || null,
    [students, form.student_id]
  )

  const enrolledCourseIds = useMemo(() => {
    if (!selectedStudent) {
      return new Set()
    }

    return new Set(
      enrollments
        .filter(
          (enrollment) =>
            enrollment.student_id === selectedStudent.id
        )
        .map((enrollment) => enrollment.course_id)
    )
  }, [enrollments, selectedStudent])

  const hasElectiveEnrollment = useMemo(() => {
    if (!selectedStudent) {
      return false
    }

    return studentHasElectiveEnrollment(
      enrollments,
      selectedStudent.id
    )
  }, [enrollments, selectedStudent])

  const eligibleCourses = useMemo(
    () =>
      filterEligibleCourses(
        selectedStudent ? semesterCourses : [],
        selectedStudent,
        enrolledCourseIds,
        hasElectiveEnrollment
      ),
    [
      semesterCourses,
      selectedStudent,
      enrolledCourseIds,
      hasElectiveEnrollment
    ]
  )

  const availableCourseSections = useMemo(
    () => (form.course_id ? courseSections : []),
    [courseSections, form.course_id]
  )

  const currentEnrolledCredits = useMemo(() => {
    if (!selectedStudent) {
      return 0
    }

    return enrollments
      .filter(
        (enrollment) =>
          enrollment.student_id === selectedStudent.id
      )
      .reduce(
        (total, enrollment) => total + enrollment.credits,
        0
      )
  }, [enrollments, selectedStudent])

  const selectedCourse = useMemo(
    () =>
      eligibleCourses.find(
        (course) =>
          String(course.id) === String(form.course_id)
      ) || null,
    [eligibleCourses, form.course_id]
  )

  const selectedStudentEnrollments = useMemo(() => {
    if (!selectedStudent) {
      return []
    }

    return enrollments.filter(
      (enrollment) =>
        enrollment.student_id === selectedStudent.id
    )
  }, [enrollments, selectedStudent])

  const enrolledSlots = useMemo(
    () => buildEnrolledSlots(selectedStudentEnrollments),
    [selectedStudentEnrollments]
  )

  const selectedSection = useMemo(
    () =>
      availableCourseSections.find(
        (section) =>
          String(section.id) === String(form.timetable_id)
      ) || null,
    [availableCourseSections, form.timetable_id]
  )

  const scheduleConflict = useMemo(() => {
    if (!selectedSection) {
      return null
    }

    return findStudentScheduleConflict(
      enrolledSlots,
      selectedSection
    )
  }, [enrolledSlots, selectedSection])

  const projectedTotalCredits = currentEnrolledCredits + (
    selectedCourse?.credits ?? 0
  )

  const creditsOverLimit = projectedTotalCredits > 24

  const studentOptions = useMemo(
    () =>
      students.map((student) => ({
        value: student.id,
        label: (
          `${student.student_code} — ${student.full_name} ` +
          `(Sem ${student.semester})`
        ),
        searchText: (
          `${student.student_code} ${student.full_name} ` +
          `${student.department} ${student.semester}`
        )
      })),
    [students]
  )

  const fetchData = useCallback(async () => {
    setLoading(true)

    try {
      const [
        enrollmentsResponse,
        studentsResponse
      ] = await Promise.all([
        api.get("/enrollments", {
          params: {
            skip: 0,
            limit: ENROLLMENT_FETCH_LIMIT
          }
        }),
        api.get("/students", {
          params: {
            skip: 0,
            limit: STUDENT_FETCH_LIMIT
          }
        })
      ])

      setEnrollments(
        enrollmentsResponse.data
      )

      setStudents(
        studentsResponse.data.items
      )
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      await fetchData()
    })()
  }, [fetchData])

  useEffect(() => {
    if (!selectedStudent) {
      return
    }

    let cancelled = false

    const loadSemesterCourses = async () => {
      setLoadingSemesterCourses(true)

      try {
        const response = await api.get("/courses", {
          params: {
            semester: selectedStudent.semester,
            limit: COURSE_FETCH_LIMIT
          }
        })

        if (!cancelled) {
          setSemesterCourses(response.data.items)
        }
      } catch (error) {
        console.error(error)

        if (!cancelled) {
          setSemesterCourses([])
        }
      } finally {
        if (!cancelled) {
          setLoadingSemesterCourses(false)
        }
      }
    }

    loadSemesterCourses()

    return () => {
      cancelled = true
    }
  }, [selectedStudent])

  useEffect(() => {
    if (!form.course_id) {
      return
    }

    let cancelled = false

    const loadCourseSections = async () => {
      setLoadingCourseSections(true)

      try {
        const response = await api.get("/timetables", {
          params: {
            course_id: Number(form.course_id),
            skip: 0,
            limit: 100
          }
        })

        if (!cancelled) {
          setCourseSections(response.data.items ?? [])
        }
      } catch (error) {
        console.error(error)

        if (!cancelled) {
          setCourseSections([])
        }
      } finally {
        if (!cancelled) {
          setLoadingCourseSections(false)
        }
      }
    }

    loadCourseSections()

    return () => {
      cancelled = true
    }
  }, [form.course_id])

  const openCreateModal = () => {
    setForm({
      student_id: "",
      course_id: "",
      timetable_id: ""
    })
    setSemesterCourses([])
    setShowModal(true)
  }

  const closeCreateModal = () => {
    setShowModal(false)
    setForm({
      student_id: "",
      course_id: "",
      timetable_id: ""
    })
    setSemesterCourses([])
    setCourseSections([])
  }

  const handleStudentChange = (studentId) => {
    setForm({
      student_id: studentId,
      course_id: "",
      timetable_id: ""
    })
    setSemesterCourses([])
    setCourseSections([])
  }

  const handleSearch = () => {
    setAppliedSearch(search.trim())
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

  const toggleStudent = (studentId) => {
    setExpandedStudents((current) => {
      const next = new Set(current)

      if (next.has(studentId)) {
        next.delete(studentId)
      } else {
        next.add(studentId)
      }

      return next
    })
  }

  const handleCreate = async (e) => {
    e.preventDefault()

    try {
      await api.post(
        "/enrollments",
        {
          student_id: Number(form.student_id),
          course_id: Number(form.course_id),
          timetable_id: Number(form.timetable_id)
        }
      )

      toast.success("Enrollment created")

      closeCreateModal()

      fetchData()
    } catch (error) {
      const detail = error.response?.data?.detail
      const message = error.response?.data?.message

      toast.error(
        detail ||
        message ||
        "Enrollment failed"
      )
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(
        `/enrollments/${id}`
      )

      toast.success("Enrollment deleted")

      fetchData()
    } catch {
      toast.error("Delete failed")
    } finally {
      setConfirmDelete(null)
    }
  }

  if (loading) {
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
          Enrollments
        </h1>

        <Button
          onClick={openCreateModal}
          className="bg-blue-600"
        >
          + Enrollment
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Input
          type="text"
          placeholder="Search by student code or name"
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

      {studentGroups.length === 0 ? (
        <EmptyState message="No enrollments found" />
      ) : filteredGroups.length === 0 ? (
        <EmptyState message="No enrollments match your filters" />
      ) : (
        <div
          className="
            w-full
            bg-white
            shadow-md
            rounded-xl
            overflow-hidden
            border
            border-gray-100
          "
        >
          <table className="w-full">
            <thead>
              <tr className="bg-linear-to-r from-slate-50 to-gray-100">
                <th className="p-3 w-10" />
                <th className="p-3 text-left text-sm font-semibold text-gray-700">
                  Student Code
                </th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">
                  Student Name
                </th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">
                  Semester
                </th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">
                  Courses
                </th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">
                  Total Credits
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedGroups.map((group) => {
                const isExpanded = expandedStudents.has(
                  group.student_id
                )

                return (
                  <StudentEnrollmentGroup
                    key={group.student_id}
                    group={group}
                    isExpanded={isExpanded}
                    onToggle={() =>
                      toggleStudent(group.student_id)
                    }
                    onDelete={(id) =>
                      setConfirmDelete(id)
                    }
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {filteredGroups.length > 0 && (
        <div className="mt-6 flex justify-center gap-4 items-center">
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
              Math.ceil(
                filteredGroups.length / STUDENT_PAGE_SIZE
              )
            )}
          </span>

          <Button
            disabled={
              (page + 1) * STUDENT_PAGE_SIZE >=
              filteredGroups.length
            }
            onClick={() => setPage(page + 1)}
            className="bg-slate-600"
          >
            Next
          </Button>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={closeCreateModal}
        title="Create Enrollment"
        maxWidth="max-w-lg"
      >
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-4"
        >
          <SearchableSelect
            id="enrollment-student"
            label="Student"
            placeholder="Search by student code or name"
            options={studentOptions}
            value={form.student_id}
            onChange={handleStudentChange}
            required
            emptyMessage="No students match your search"
          />

          {selectedStudent && (
            <p className="text-sm text-gray-600 -mt-2">
              {selectedStudent.department} · Semester{" "}
              {selectedStudent.semester}
            </p>
          )}

          <FormField
            label="Course"
            htmlFor="enrollment-course"
          >
            <Select
              id="enrollment-course"
              value={form.course_id}
              onChange={(e) => {
                setForm({
                  ...form,
                  course_id: e.target.value,
                  timetable_id: ""
                })
                setCourseSections([])
              }}
              disabled={
                !selectedStudent || loadingSemesterCourses
              }
              required
            >
              <option value="">
                {!selectedStudent
                  ? "Select a student first"
                  : loadingSemesterCourses
                    ? "Loading courses..."
                    : eligibleCourses.length === 0
                      ? "No eligible courses available"
                      : "Select Course"}
              </option>

              {eligibleCourses.map((course) => (
                <option
                  key={course.id}
                  value={course.id}
                >
                  {course.course_code} — {course.title}
                  {` · ${course.credits} credit${course.credits === 1 ? "" : "s"}`}
                  {course.is_elective
                    ? ` [Elective · ${course.department}]`
                    : " [Core]"}
                  {` (${course.enrollment_count ?? 0}/${course.max_capacity})`}
                </option>
              ))}
            </Select>

            {selectedStudent && !loadingSemesterCourses && (
              <p className="mt-1 text-xs text-gray-500">
                Showing core courses for{" "}
                {selectedStudent.department} and electives
                for semester {selectedStudent.semester}.
                Already enrolled courses are hidden.
                {hasElectiveEnrollment && (
                  <>
                    {" "}
                    This student already has an elective;
                    only core courses can be added.
                  </>
                )}
              </p>
            )}
          </FormField>

          <FormField
            label="Class Section"
            htmlFor="enrollment-section"
          >
            <Select
              id="enrollment-section"
              value={form.timetable_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  timetable_id: e.target.value
                })
              }
              disabled={
                !form.course_id || loadingCourseSections
              }
              required
            >
              <option value="">
                {!form.course_id
                  ? "Select a course first"
                  : loadingCourseSections
                    ? "Loading sections..."
                    : availableCourseSections.length === 0
                      ? "No sections scheduled"
                      : "Select professor section"}
              </option>

              {availableCourseSections.map((section) => (
                <option
                  key={section.id}
                  value={section.id}
                >
                  {section.instructor_name} ·{" "}
                  {section.day_of_week}{" "}
                  {section.start_time}–{section.end_time} ·{" "}
                  Room {section.room_number} ·{" "}
                  {section.enrollment_count}/
                  {section.section_capacity} seats
                </option>
              ))}
            </Select>

            {selectedSection && scheduleConflict && (
              <p className="mt-1 text-xs text-red-600">
                {scheduleConflict}
              </p>
            )}

            {form.course_id && !loadingCourseSections && (
              <p className="mt-1 text-xs text-gray-500">
                Each professor teaches this course at a
                different time. Pick the section that fits
                the student&apos;s schedule.
              </p>
            )}
          </FormField>

          {selectedStudent && (
            <FormField
              label="Total Credits Enrolled"
              htmlFor="enrollment-total-credits"
            >
              <Input
                id="enrollment-total-credits"
                value={`${projectedTotalCredits} / 24`}
                disabled
                className={
                  creditsOverLimit
                    ? "border-red-500 text-red-600 font-semibold disabled:text-red-600"
                    : "disabled:text-gray-900 disabled:font-semibold"
                }
              />
              <p className="mt-1 text-xs text-gray-500">
                {selectedCourse
                  ? (
                    `Currently ${currentEnrolledCredits} credits ` +
                    `+ ${selectedCourse.credits} from selected course`
                  )
                  : `${currentEnrolledCredits} credits enrolled so far`}
                {creditsOverLimit && (
                  <span className="text-red-600 font-medium">
                    {" "}· Exceeds 24 credit limit
                  </span>
                )}
              </p>
            </FormField>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              onClick={closeCreateModal}
              className="bg-gray-500"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="bg-blue-600"
              disabled={
                !form.student_id ||
                !form.course_id ||
                !form.timetable_id ||
                loadingSemesterCourses ||
                loadingCourseSections ||
                creditsOverLimit ||
                !!scheduleConflict
              }
            >
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Enrollment"
        message="Delete this enrollment?"
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

function StudentEnrollmentGroup({
  group,
  isExpanded,
  onToggle,
  onDelete
}) {
  return (
    <>
      <tr
        className="
          border-t
          cursor-pointer
          hover:bg-blue-50/60
          transition-colors
        "
        onClick={onToggle}
      >
        <td className="p-3 text-gray-500 text-sm">
          {isExpanded ? "▼" : "▶"}
        </td>

        <td className="p-3 font-medium text-blue-600">
          {group.student_code}
        </td>

        <td className="p-3 font-medium text-gray-900">
          {group.student_name}
        </td>

        <td className="p-3">
          {group.semester}
        </td>

        <td className="p-3">
          {group.enrollments.length}
        </td>

        <td className="p-3">
          <span
            className={
              group.totalCredits > 24
                ? "text-red-600 font-semibold"
                : "font-semibold text-gray-900"
            }
          >
            {group.totalCredits}/24
          </span>
        </td>
      </tr>

      {isExpanded && (
        <tr className="border-t bg-gray-50">
          <td
            colSpan={6}
            className="p-0"
          >
            <div className="px-4 py-3">
              <table className="w-full border border-gray-200 rounded-lg overflow-hidden bg-white">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="p-2.5 text-left text-xs font-semibold text-gray-600">
                      Student Code
                    </th>
                    <th className="p-2.5 text-left text-xs font-semibold text-gray-600">
                      Student Name
                    </th>
                    <th className="p-2.5 text-left text-xs font-semibold text-gray-600">
                      Semester
                    </th>
                    <th className="p-2.5 text-left text-xs font-semibold text-gray-600">
                      Course
                    </th>
                    <th className="p-2.5 text-left text-xs font-semibold text-gray-600">
                      Section
                    </th>
                    <th className="p-2.5 text-left text-xs font-semibold text-gray-600">
                      Credits
                    </th>
                    <th className="p-2.5 text-left text-xs font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {group.enrollments.map((enrollment) => (
                    <tr
                      key={enrollment.id}
                      className="border-t border-gray-100"
                    >
                      <td className="p-2.5 text-sm text-blue-600">
                        {enrollment.student_code}
                      </td>

                      <td className="p-2.5 text-sm">
                        {enrollment.student_name}
                      </td>

                      <td className="p-2.5 text-sm">
                        {enrollment.semester}
                      </td>

                      <td className="p-2.5 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {enrollment.course_code}
                          </span>
                          <span className="text-gray-600">
                            {enrollment.course_name}
                          </span>
                          <CourseTypeBadge
                            isElective={enrollment.is_elective}
                          />
                        </div>
                      </td>

                      <td className="p-2.5 text-sm text-gray-600">
                        {enrollment.instructor_name ? (
                          <>
                            {enrollment.instructor_name}
                            <span className="block text-xs text-gray-500">
                              {enrollment.day_of_week}{" "}
                              {enrollment.start_time}–
                              {enrollment.end_time}
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="p-2.5 text-sm font-medium">
                        {enrollment.credits}
                      </td>

                      <td className="p-2.5">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(enrollment.id)
                          }}
                          className="bg-red-600 px-3 py-1 text-sm"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr className="border-t bg-slate-50">
                    <td
                      colSpan={5}
                      className="p-2.5 text-sm font-semibold text-gray-700 text-right"
                    >
                      Total Credits
                    </td>
                    <td
                      colSpan={2}
                      className="p-2.5 text-sm font-bold text-gray-900"
                    >
                      {group.totalCredits} / 24
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default EnrollmentsPage
