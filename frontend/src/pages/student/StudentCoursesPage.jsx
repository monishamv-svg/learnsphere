import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react"

import { toast } from "react-toastify"

import api from "../../api/axios"

import DashboardLayout from "../../components/layout/DashboardLayout"
import Button from "../../components/common/Button"
import Loader from "../../components/common/Loader"
import EmptyState from "../../components/common/EmptyState"
import CourseTypeBadge from "../../components/courses/CourseTypeBadge"
import {
  filterEligibleCourses,
  studentHasElectiveEnrollment
} from "../../utils/courseEligibility"
import {
  buildEnrolledSlots,
  findStudentScheduleConflict
} from "../../utils/studentSchedule"

const ENROLLMENT_FETCH_LIMIT = 100
const COURSE_PAGE_LIMIT = 100
const TIMETABLE_FETCH_LIMIT = 500
const CREDIT_LIMIT = 24

async function fetchSemesterCourses(semester) {
  const courseItems = []
  let skip = 0
  let totalCourses

  do {
    const response = await api.get("/courses", {
      params: {
        semester,
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

async function fetchAllTimetables() {
  const items = []
  let skip = 0
  let totalCount

  do {
    const response = await api.get("/timetables", {
      params: {
        skip,
        limit: TIMETABLE_FETCH_LIMIT
      }
    })

    items.push(...response.data.items)
    totalCount = response.data.total_count
    skip += TIMETABLE_FETCH_LIMIT
  } while (items.length < totalCount)

  return items
}

function sumEnrollmentCredits(enrollments) {
  return enrollments.reduce(
    (total, enrollment) => total + enrollment.credits,
    0
  )
}

function formatSectionLabel(section) {
  return (
    `${section.instructor_name} · ${section.day_of_week} ` +
    `${section.start_time}–${section.end_time} · ` +
    `Room ${section.room_number} · ` +
    `${section.enrollment_count}/${section.section_capacity} seats`
  )
}

function StudentCoursesPage() {
  const [student, setStudent] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [semesterCourses, setSemesterCourses] = useState([])
  const [timetables, setTimetables] = useState([])
  const [loading, setLoading] = useState(true)
  const [enrollingKey, setEnrollingKey] = useState(null)

  const loadData = useCallback(async () => {
    const dashboardRes = await api.get("/dashboard/me")
    const studentProfile = dashboardRes.data.student

    const [enrollmentsRes, courses, timetableItems] =
      await Promise.all([
        api.get("/enrollments", {
          params: {
            skip: 0,
            limit: ENROLLMENT_FETCH_LIMIT
          }
        }),
        fetchSemesterCourses(studentProfile.semester),
        fetchAllTimetables()
      ])

    setStudent(studentProfile)
    setEnrollments(enrollmentsRes.data ?? [])
    setSemesterCourses(courses)
    setTimetables(timetableItems)
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        await loadData()
      } catch (error) {
        console.error(error)

        if (!cancelled) {
          toast.error(
            error.response?.data?.detail ||
            "Failed to load courses"
          )
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
  }, [loadData])

  const enrolledCourseIds = useMemo(
    () => new Set(enrollments.map((item) => item.course_id)),
    [enrollments]
  )

  const totalCredits = useMemo(
    () => sumEnrollmentCredits(enrollments),
    [enrollments]
  )

  const enrolledSlots = useMemo(
    () => buildEnrolledSlots(enrollments),
    [enrollments]
  )

  const hasElectiveEnrollment = useMemo(
    () =>
      studentHasElectiveEnrollment(
        enrollments,
        student?.id
      ),
    [enrollments, student?.id]
  )

  const availableCourses = useMemo(() => {
    if (!student) {
      return []
    }

    return filterEligibleCourses(
      semesterCourses,
      student,
      enrolledCourseIds,
      hasElectiveEnrollment
    )
  }, [
    semesterCourses,
    student,
    enrolledCourseIds,
    hasElectiveEnrollment
  ])

  const sectionsByCourseId = useMemo(() => {
    const grouped = new Map()

    for (const section of timetables) {
      if (!grouped.has(section.course_id)) {
        grouped.set(section.course_id, [])
      }

      grouped.get(section.course_id).push(section)
    }

    return grouped
  }, [timetables])

  const handleEnroll = async (course, section) => {
    if (!student) {
      return
    }

    if (totalCredits + course.credits > CREDIT_LIMIT) {
      toast.error("Credit limit exceeded (max 24 credits)")
      return
    }

    const conflict = findStudentScheduleConflict(
      enrolledSlots,
      section
    )

    if (conflict) {
      toast.error(conflict)
      return
    }

    const enrollKey = `${course.id}-${section.id}`
    setEnrollingKey(enrollKey)

    try {
      await api.post("/enrollments", {
        student_id: student.id,
        course_id: course.id,
        timetable_id: section.id
      })

      toast.success(
        `Enrolled in ${course.course_code} with ` +
        `${section.instructor_name}`
      )

      await loadData()
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
        "Enrollment failed"
      )
    } finally {
      setEnrollingKey(null)
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
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            My Courses
          </h1>

          {student && (
            <p className="text-gray-500 mt-2">
              {student.department} · Semester {student.semester}
            </p>
          )}

          
        </div>

        <div
          className={
            totalCredits > CREDIT_LIMIT
              ? "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700"
              : "rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800"
          }
        >
          <p className="text-sm font-medium">
            Total Credits
          </p>
          <p className="text-2xl font-bold">
            {totalCredits} / {CREDIT_LIMIT}
          </p>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Enrolled Courses
        </h2>

        {enrollments.length === 0 ? (
          <EmptyState message="You are not enrolled in any courses yet" />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="
                  bg-white
                  p-5
                  rounded-xl
                  shadow-md
                  border
                  border-gray-100
                "
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-blue-600">
                    {enrollment.course_code}
                  </p>
                  <CourseTypeBadge
                    isElective={enrollment.is_elective}
                  />
                </div>

                <h3 className="text-lg font-bold text-gray-900 mt-1">
                  {enrollment.course_name}
                </h3>

                <p className="text-sm text-gray-600 mt-2">
                  {enrollment.credits} credit
                  {enrollment.credits === 1 ? "" : "s"}
                </p>

                {enrollment.instructor_name && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
                    <p className="font-medium text-gray-800">
                      {enrollment.instructor_name}
                    </p>
                    <p>
                      {enrollment.day_of_week}{" "}
                      {enrollment.start_time}–{enrollment.end_time}
                    </p>
                    <p>Room {enrollment.room_number}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Available Courses
          </h2>

          <p className="text-sm text-gray-500">
            Core courses from your department and electives
            for your semester
          </p>
        </div>

        {hasElectiveEnrollment && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
            You already have an elective enrolled. Only core
            courses can be added.
          </p>
        )}

        {availableCourses.length === 0 ? (
          <EmptyState message="No additional courses available to enroll" />
        ) : (
          <div className="space-y-6">
            {availableCourses.map((course) => {
              const sections =
                sectionsByCourseId.get(course.id) || []
              const wouldExceedLimit =
                totalCredits + course.credits > CREDIT_LIMIT

              return (
                <div
                  key={course.id}
                  className="
                    bg-white
                    p-5
                    rounded-xl
                    shadow-md
                    border
                    border-gray-100
                  "
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-blue-600">
                      {course.course_code}
                    </p>
                    <CourseTypeBadge
                      isElective={course.is_elective}
                    />
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mt-1">
                    {course.title}
                  </h3>

                  <p className="text-sm text-gray-600 mt-2">
                    {course.is_elective
                      ? course.department
                      : student.department}
                    {" · "}
                    {course.credits} credit
                    {course.credits === 1 ? "" : "s"}
                  </p>

                  {sections.length === 0 ? (
                    <p className="text-sm text-amber-700 mt-4">
                      No class sections scheduled yet. Ask admin
                      to add timetable entries for this course.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm font-medium text-gray-700">
                        Choose an instructor section:
                      </p>

                      {sections.map((section) => {
                        const scheduleConflict =
                          findStudentScheduleConflict(
                            enrolledSlots,
                            section
                          )
                        const sectionFull =
                          section.enrollment_count >=
                          section.section_capacity
                        const disabled =
                          enrollingKey ===
                            `${course.id}-${section.id}` ||
                          wouldExceedLimit ||
                          !!scheduleConflict ||
                          sectionFull

                        return (
                          <div
                            key={section.id}
                            className="
                              flex flex-col
                              sm:flex-row
                              sm:items-center
                              sm:justify-between
                              gap-3
                              rounded-lg
                              border
                              border-gray-200
                              px-4
                              py-3
                            "
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {formatSectionLabel(section)}
                              </p>

                              {scheduleConflict && (
                                <p className="text-xs text-red-600 mt-1">
                                  {scheduleConflict}
                                </p>
                              )}

                              {sectionFull && (
                                <p className="text-xs text-amber-700 mt-1">
                                  Section is full
                                </p>
                              )}
                            </div>

                            <Button
                              onClick={() =>
                                handleEnroll(course, section)
                              }
                              disabled={disabled}
                              className="bg-emerald-600 shrink-0"
                            >
                              {enrollingKey ===
                                `${course.id}-${section.id}`
                                ? "Enrolling..."
                                : wouldExceedLimit
                                  ? "Exceeds credit limit"
                                  : scheduleConflict
                                    ? "Schedule conflict"
                                    : sectionFull
                                      ? "Section full"
                                      : "Enroll in this section"}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </DashboardLayout>
  )
}

export default StudentCoursesPage
