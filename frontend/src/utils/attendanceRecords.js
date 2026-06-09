export function filterAttendanceRecords(
  records,
  {
    status = "All",
    studentSearch = ""
  } = {}
) {
  const query = studentSearch.trim().toLowerCase()

  return records.filter((record) => {
    if (status !== "All" && record.status !== status) {
      return false
    }

    if (!query) {
      return true
    }

    return (
      record.studentName.toLowerCase().includes(query) ||
      record.studentCode.toLowerCase().includes(query)
    )
  })
}

export function enrichAttendanceRecords(
  records,
  students,
  timetables,
  courses
) {
  const studentById = new Map(
    students.map((student) => [student.id, student])
  )
  const timetableById = new Map(
    timetables.map((timetable) => [timetable.id, timetable])
  )
  const courseById = new Map(
    courses.map((course) => [course.id, course])
  )

  return records.map((record) => {
    const student = studentById.get(record.student_id)
    const timetable = timetableById.get(record.timetable_id)
    const course = timetable
      ? courseById.get(timetable.course_id)
      : null

    return {
      ...record,
      studentName: student?.full_name ?? "",
      studentCode: student?.student_code ?? "",
      department: student?.department ?? "",
      dayOfWeek: timetable?.day_of_week ?? "",
      startTime: timetable?.start_time ?? "",
      endTime: timetable?.end_time ?? "",
      courseId: course?.id ?? null,
      courseCode: course?.course_code ?? "",
      courseTitle: course?.title ?? "",
      courseLabel: course
        ? `${course.course_code} — ${course.title}`
        : ""
    }
  })
}

export function groupRecordsByDepartment(
  records,
  departments
) {
  const grouped = Object.fromEntries(
    departments.map((department) => [department, []])
  )

  for (const record of records) {
    if (!record.department || !grouped[record.department]) {
      continue
    }

    grouped[record.department].push(record)
  }

  for (const department of departments) {
    grouped[department].sort((a, b) => {
      const dateCompare = b.attendance_date.localeCompare(
        a.attendance_date
      )

      if (dateCompare !== 0) {
        return dateCompare
      }

      return a.studentName.localeCompare(b.studentName)
    })
  }

  return grouped
}
