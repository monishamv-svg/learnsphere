import {
  useCallback,
  useEffect,
  useState
} from "react"

import { toast } from "react-toastify"

import api from "../../api/axios"

import DashboardLayout from "../../components/layout/DashboardLayout"
import CourseModal from "../../components/courses/CourseModal"
import CourseTypeBadge from "../../components/courses/CourseTypeBadge"
import Button from "../../components/common/Button"
import Select from "../../components/common/Select"
import Table from "../../components/common/Table"
import Loader from "../../components/common/Loader"
import EmptyState from "../../components/common/EmptyState"
import ConfirmDialog from "../../components/common/ConfirmDialog"
import {
  DEPARTMENT_FILTER_OPTIONS
} from "../../constants/departments"
import { getCourseInstructors } from "../../utils/courseInstructors"

const CREDIT_OPTIONS = [
  "All",
  "1",
  "3",
  "4"
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

const TYPE_OPTIONS = [
  "All",
  "Core",
  "Elective"
]

function CoursesPage() {

  const [courses, setCourses] = useState([])

  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)

  const [editingCourse, setEditingCourse] = useState(null)

  const [creditFilter, setCreditFilter] =
    useState("All")

  const [appliedCredit, setAppliedCredit] =
    useState("")

  const [departmentFilter, setDepartmentFilter] =
    useState("All")

  const [appliedDepartment, setAppliedDepartment] =
    useState("")

  const [semesterFilter, setSemesterFilter] =
    useState("All")

  const [appliedSemester, setAppliedSemester] =
    useState("")

  const [typeFilter, setTypeFilter] =
    useState("All")

  const [appliedType, setAppliedType] =
    useState("")

  const [page, setPage] = useState(0)

  const [totalCount, setTotalCount] = useState(0)

  const [confirmDelete, setConfirmDelete] = useState(null)

  const limit = 10

  const fetchCourses = useCallback(async () => {
    setLoading(true)

    try {
      const response = await api.get("/courses", {
        params: {
          skip: page * limit,
          limit,
          ...(appliedCredit && {
            credits: Number(appliedCredit)
          }),
          ...(appliedDepartment && {
            department: appliedDepartment
          }),
          ...(appliedSemester && {
            semester: Number(appliedSemester)
          }),
          ...(appliedType === "Core" && {
            is_elective: false
          }),
          ...(appliedType === "Elective" && {
            is_elective: true
          })
        }
      })

      setCourses(response.data.items)

      setTotalCount(response.data.total_count)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [
    limit,
    page,
    appliedCredit,
    appliedDepartment,
    appliedSemester,
    appliedType
  ])

  useEffect(() => {
    ;(async () => {
      await fetchCourses()
    })()
  }, [fetchCourses])

  const handleCreditChange = (value) => {
    setCreditFilter(value)
    setAppliedCredit(value === "All" ? "" : value)
    setPage(0)
  }

  const handleDepartmentChange = (value) => {
    setDepartmentFilter(value)
    setAppliedDepartment(value === "All" ? "" : value)
    setPage(0)
  }

  const handleSemesterChange = (value) => {
    setSemesterFilter(value)
    setAppliedSemester(value === "All" ? "" : value)
    setPage(0)
  }

  const handleTypeChange = (value) => {
    setTypeFilter(value)
    setAppliedType(value === "All" ? "" : value)
    setPage(0)
  }

  const handleSubmitCourse = async (courseData) => {
    try {
      if (editingCourse) {
        await api.patch(
          `/courses/${editingCourse.id}`,
          {
            title: courseData.title,
            description: courseData.description,
            credits: courseData.credits,
            semester: courseData.semester,
            department: courseData.department,
            instructor_name: courseData.instructor_name,
            additional_instructors: courseData.additional_instructors,
            max_capacity: courseData.max_capacity,
            is_elective: courseData.is_elective
          }
        )

        toast.success("Course updated successfully")
      } else {
        await api.post(
          "/courses",
          courseData
        )

        toast.success("Course created successfully")
      }

      setShowModal(false)

      setEditingCourse(null)

      fetchCourses()
    } catch (error) {
      console.error(error)

      toast.error(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Operation failed"
      )
    }
  }

  const handleDeleteCourse = async (id) => {
    try {
      await api.delete(
        `/courses/${id}`
      )

      toast.success("Course deleted successfully")

      fetchCourses()
    } catch (error) {
      console.error(error)

      toast.error(
        error.response?.data?.detail ||
        "Operation failed"
      )
    } finally {
      setConfirmDelete(null)
    }
  }

  const isInitialLoad =
    loading && courses.length === 0

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

        <h1 className="text-3xl font-bold text-gray-900">
          Courses Management
        </h1>

        <Button
          onClick={() => {
            setEditingCourse(null)
            setShowModal(true)
          }}
          className="bg-blue-600"
        >
          Add Course
        </Button>

      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Select
          value={creditFilter}
          onChange={(e) =>
            handleCreditChange(e.target.value)
          }
          className="max-w-[160px]"
        >
          {CREDIT_OPTIONS.map((credit) => (
            <option key={credit} value={credit}>
              {credit === "All"
                ? "All Credits"
                : `${credit} Credit${credit === "1" ? "" : "s"}`}
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

        <Select
          value={typeFilter}
          onChange={(e) =>
            handleTypeChange(e.target.value)
          }
          className="max-w-[160px]"
        >
          {TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {type === "All"
                ? "All Types"
                : type}
            </option>
          ))}
        </Select>
      </div>

      {courses.length === 0 && !loading ? (
        <EmptyState message="No courses found" />
      ) : courses.length === 0 && loading ? (
        <Loader />
      ) : (
        <Table
          columns={[
            "Code",
            "Title",
            "Type",
            "Dept",
            "Sem",
            "Credits",
            "Instructor",
            "Enrolled",
            "Actions"
          ]}
        >
          {courses.map((course) => (

            <tr
              key={course.id}
              className="border-t"
            >

              <td className="p-3 font-medium text-blue-600">
                {course.course_code}
              </td>

              <td className="p-3">
                {course.title}
              </td>

              <td className="p-3">
                <CourseTypeBadge
                  isElective={course.is_elective}
                />
              </td>

              <td className="p-3 text-sm">
                {course.department}
              </td>

              <td className="p-3">
                {course.semester}
              </td>

              <td className="p-3">
                {course.credits}
              </td>

              <td className="p-3 text-sm text-gray-600">
                {getCourseInstructors(course).join(", ")}
              </td>

              <td className="p-3">
                <span
                  className={
                    course.enrollment_count >=
                    course.max_capacity
                      ? "text-red-600 font-semibold"
                      : "text-gray-700"
                  }
                >
                  {course.enrollment_count}/
                  {course.max_capacity}
                </span>
              </td>

              <td className="p-3">

                <div className="flex gap-2">

                  <Button
                    onClick={() => {
                      setEditingCourse(course)
                      setShowModal(true)
                    }}
                    className="bg-amber-500 px-3 py-1 text-sm"
                  >
                    Edit
                  </Button>

                  <Button
                    onClick={() =>
                      setConfirmDelete(course.id)
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

      {!loading && (
        <div className="mt-6 flex gap-4 items-center">

          <Button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="bg-slate-600"
          >
            Previous
          </Button>

          <span className="text-gray-600">
            Page {page + 1}
          </span>

          <Button
            disabled={
              (page + 1) * limit >= totalCount
            }
            onClick={() => setPage(page + 1)}
            className="bg-slate-600"
          >
            Next
          </Button>

        </div>
      )}

      <CourseModal
        key={
          editingCourse
            ? `edit-${editingCourse.id}`
            : "create"
        }
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingCourse(null)
        }}
        onSubmit={handleSubmitCourse}
        initialData={editingCourse}
      />

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Course"
        message="Delete this course? This action cannot be undone."
        onConfirm={() =>
          handleDeleteCourse(confirmDelete)
        }
        onCancel={() =>
          setConfirmDelete(null)
        }
      />

    </DashboardLayout>
  )
}

export default CoursesPage
