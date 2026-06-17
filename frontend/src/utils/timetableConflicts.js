import { validateClassSchedule } from "../constants/timetableSchedule"

function toMinutes(value) {
  const [hour, minute] = value.split(":").map(Number)
  return hour * 60 + minute
}

export function timesOverlap(startA, endA, startB, endB) {
  const startMinutesA = toMinutes(startA)
  const endMinutesA = toMinutes(endA)
  const startMinutesB = toMinutes(startB)
  const endMinutesB = toMinutes(endB)

  return (
    startMinutesA < endMinutesB &&
    startMinutesB < endMinutesA
  )
}

export function getOccupiedRooms({
  entries,
  dayOfWeek,
  startTime,
  endTime,
  excludeId = null
}) {
  if (!dayOfWeek || !startTime || !endTime) {
    return new Set()
  }

  if (toMinutes(endTime) <= toMinutes(startTime)) {
    return new Set()
  }

  const occupied = new Set()

  for (const entry of entries) {
    if (excludeId && entry.id === excludeId) {
      continue
    }

    if (entry.day_of_week !== dayOfWeek) {
      continue
    }

    if (
      !timesOverlap(
        entry.start_time,
        entry.end_time,
        startTime,
        endTime
      )
    ) {
      continue
    }

    occupied.add(entry.room_number)
  }

  return occupied
}

export function getAvailableRooms({
  allRooms,
  entries,
  dayOfWeek,
  startTime,
  endTime,
  excludeId = null
}) {
  const occupied = getOccupiedRooms({
    entries,
    dayOfWeek,
    startTime,
    endTime,
    excludeId
  })

  return allRooms.filter((room) => !occupied.has(room))
}

export function findInstructorConflict({
  entries,
  dayOfWeek,
  startTime,
  endTime,
  instructorName,
  excludeId = null
}) {
  if (
    !dayOfWeek ||
    !startTime ||
    !endTime ||
    !instructorName
  ) {
    return null
  }

  if (toMinutes(endTime) <= toMinutes(startTime)) {
    return null
  }

  for (const entry of entries) {
    if (excludeId && entry.id === excludeId) {
      continue
    }

    if (entry.day_of_week !== dayOfWeek) {
      continue
    }

    if (
      !timesOverlap(
        entry.start_time,
        entry.end_time,
        startTime,
        endTime
      )
    ) {
      continue
    }

    if (entry.instructor_name === instructorName) {
      return (
        `${instructorName} is not available ` +
        `on ${dayOfWeek} during this time`
      )
    }
  }

  return null
}

export function findTimetableConflict({
  entries,
  dayOfWeek,
  startTime,
  endTime,
  roomNumber,
  instructorName,
  courseId,
  excludeId = null
}) {
  if (!dayOfWeek || !startTime || !endTime) {
    return null
  }

  if (toMinutes(endTime) <= toMinutes(startTime)) {
    return "End time must be after start time"
  }

  const policyError = validateClassSchedule(
    dayOfWeek,
    startTime,
    endTime
  )

  if (policyError) {
    return policyError
  }

  for (const entry of entries) {
    if (excludeId && entry.id === excludeId) {
      continue
    }

    if (entry.day_of_week !== dayOfWeek) {
      continue
    }

    if (
      !timesOverlap(
        entry.start_time,
        entry.end_time,
        startTime,
        endTime
      )
    ) {
      continue
    }

    if (entry.room_number === roomNumber) {
      return (
        `Room ${roomNumber} is already booked ` +
        `on ${dayOfWeek} during this time`
      )
    }

    if (entry.instructor_name === instructorName) {
      return (
        `${instructorName} is not available ` +
        `on ${dayOfWeek} during this time`
      )
    }

    if (entry.course_id === Number(courseId)) {
      return (
        "This course is already scheduled " +
        "on this day during this time"
      )
    }
  }

  if (Number(courseId) && instructorName) {
    for (const entry of entries) {
      if (excludeId && entry.id === excludeId) {
        continue
      }

      if (
        entry.course_id === Number(courseId) &&
        entry.instructor_name === instructorName
      ) {
        return (
          `${instructorName} already has a class section ` +
          "for this course"
        )
      }
    }
  }

  return null
}
