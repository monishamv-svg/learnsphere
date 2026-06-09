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

export const WEEKDAY_CLASS_SLOTS = [
  ["08:00", "09:00"],
  ["09:00", "10:00"],
  ["11:00", "12:00"],
  ["12:00", "13:00"],
  ["14:00", "15:00"],
  ["15:00", "16:00"],
  ["16:00", "17:00"]
]

export const SATURDAY_CLASS_SLOTS = [
  ["08:00", "09:00"],
  ["09:00", "10:00"],
  ["11:00", "12:00"],
  ["12:00", "13:00"]
]

export const WEEK_GRID_ROWS = [
  {
    kind: "class",
    start: "08:00",
    end: "09:00",
    label: "8:00 – 9:00"
  },
  {
    kind: "class",
    start: "09:00",
    end: "10:00",
    label: "9:00 – 10:00"
  },
  {
    kind: "break",
    start: "10:30",
    end: "11:00",
    label: "Morning break"
  },
  {
    kind: "class",
    start: "11:00",
    end: "12:00",
    label: "11:00 – 12:00"
  },
  {
    kind: "class",
    start: "12:00",
    end: "13:00",
    label: "12:00 – 1:00",
    weekdayOnly: true
  },
  {
    kind: "class",
    start: "12:00",
    end: "13:00",
    label: "12:00 – 1:00",
    saturdayOnly: true
  },
  {
    kind: "break",
    start: "13:00",
    end: "14:00",
    label: "Lunch break"
  },
  {
    kind: "class",
    start: "14:00",
    end: "15:00",
    label: "2:00 – 3:00",
    weekdayOnly: true
  },
  {
    kind: "class",
    start: "15:00",
    end: "16:00",
    label: "3:00 – 4:00",
    weekdayOnly: true
  },
  {
    kind: "class",
    start: "16:00",
    end: "17:00",
    label: "4:00 – 5:00",
    weekdayOnly: true
  }
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
