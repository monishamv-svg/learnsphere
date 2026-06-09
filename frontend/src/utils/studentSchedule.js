import { timesOverlap } from "./timetableConflicts"

export function findStudentScheduleConflict(
  enrolledSlots,
  candidateSlot
) {
  if (
    !candidateSlot?.day_of_week ||
    !candidateSlot?.start_time ||
    !candidateSlot?.end_time
  ) {
    return null
  }

  for (const slot of enrolledSlots) {
    if (
      !slot?.day_of_week ||
      !slot?.start_time ||
      !slot?.end_time
    ) {
      continue
    }

    if (slot.day_of_week !== candidateSlot.day_of_week) {
      continue
    }

    if (
      !timesOverlap(
        slot.start_time,
        slot.end_time,
        candidateSlot.start_time,
        candidateSlot.end_time
      )
    ) {
      continue
    }

    return (
      `Conflicts with ${slot.course_code || "a class"} ` +
      `(${slot.instructor_name}) on ${slot.day_of_week} ` +
      `${slot.start_time}–${slot.end_time}`
    )
  }

  return null
}

export function buildEnrolledSlots(enrollments) {
  return enrollments
    .filter(
      (enrollment) =>
        enrollment.day_of_week &&
        enrollment.start_time &&
        enrollment.end_time
    )
    .map((enrollment) => ({
      course_code: enrollment.course_code,
      instructor_name: enrollment.instructor_name,
      day_of_week: enrollment.day_of_week,
      start_time: enrollment.start_time,
      end_time: enrollment.end_time
    }))
}
