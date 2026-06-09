export function getCourseInstructors(course) {
  if (!course) {
    return ["TBD"]
  }

  if (Array.isArray(course.instructors) && course.instructors.length) {
    return course.instructors
  }

  const instructors = []

  if (course.instructor_name?.trim()) {
    instructors.push(course.instructor_name.trim())
  }

  if (course.additional_instructors) {
    for (const name of course.additional_instructors.split(",")) {
      const cleaned = name.trim()

      if (cleaned && !instructors.includes(cleaned)) {
        instructors.push(cleaned)
      }
    }
  }

  return instructors.length ? instructors : ["TBD"]
}
