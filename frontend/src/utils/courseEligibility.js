export function isCourseEligibleForStudent(course, student) {
  if (!course || !student) {
    return false
  }

  if (course.semester !== student.semester) {
    return false
  }

  if (course.is_elective) {
    return true
  }

  return course.department === student.department
}

export function studentHasElectiveEnrollment(
  enrollments,
  studentId
) {
  return enrollments.some(
    (enrollment) =>
      enrollment.student_id === studentId &&
      enrollment.is_elective
  )
}

export function filterEligibleCourses(
  courses,
  student,
  enrolledCourseIds = new Set(),
  hasElectiveEnrollment = false
) {
  if (!student) {
    return []
  }

  return courses.filter((course) => {
    if (!isCourseEligibleForStudent(course, student)) {
      return false
    }

    if (enrolledCourseIds.has(course.id)) {
      return false
    }

    if (hasElectiveEnrollment && course.is_elective) {
      return false
    }

    return true
  })
}
