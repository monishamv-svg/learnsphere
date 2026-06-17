export const TIMETABLE_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
]

export const MORNING_BREAK = {
  start: "10:30",
  end: "11:00",
  label: "10:30 AM – 11:00 AM"
}

export const LUNCH_BREAK = {
  start: "13:00",
  end: "14:00",
  label: "1:00 PM – 2:00 PM"
}

export const SCHEDULE_RULES_SUMMARY = [
  "No classes on Sunday.",
  "Weekdays: 8:00 AM start, must end by 5:00 PM.",
  "Saturday: must end by 1:00 PM.",
  `Morning break: ${MORNING_BREAK.label}.`,
  `Lunch break: ${LUNCH_BREAK.label}.`
]

function toMinutes(value) {
  const [hour, minute] = value.split(":").map(Number)
  return hour * 60 + minute
}

function timesOverlap(startA, endA, startB, endB) {
  return (
    toMinutes(startA) < toMinutes(endB) &&
    toMinutes(startB) < toMinutes(endA)
  )
}

export function validateClassSchedule(
  dayOfWeek,
  startTime,
  endTime
) {
  if (!dayOfWeek || !startTime || !endTime) {
    return null
  }

  if (dayOfWeek === "Sunday") {
    return "Classes cannot be scheduled on Sunday"
  }

  if (!TIMETABLE_DAYS.includes(dayOfWeek)) {
    return `${dayOfWeek} is not a valid teaching day`
  }

  if (toMinutes(endTime) <= toMinutes(startTime)) {
    return "End time must be after start time"
  }

  if (toMinutes(startTime) < toMinutes("08:00")) {
    return "Classes cannot start before 8:00 AM"
  }

  if (dayOfWeek === "Saturday") {
    if (toMinutes(endTime) > toMinutes("13:00")) {
      return "Classes cannot run after 1:00 PM on Saturday"
    }
  } else if (toMinutes(endTime) > toMinutes("17:00")) {
    return "Classes cannot run after 5:00 PM on weekdays"
  }

  if (
    timesOverlap(
      startTime,
      endTime,
      MORNING_BREAK.start,
      MORNING_BREAK.end
    )
  ) {
    return (
      "Classes cannot be scheduled during the morning " +
      `break (${MORNING_BREAK.label})`
    )
  }

  if (
    timesOverlap(
      startTime,
      endTime,
      LUNCH_BREAK.start,
      LUNCH_BREAK.end
    )
  ) {
    return (
      "Classes cannot be scheduled during the lunch " +
      `break (${LUNCH_BREAK.label})`
    )
  }

  return null
}
