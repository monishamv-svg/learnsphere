import {
  TIMETABLE_DAYS,
  MORNING_BREAK,
  LUNCH_BREAK
} from "../constants/timetableSchedule"

const COURSE_COLORS = [
  "bg-violet-100 border-violet-300 text-violet-900",
  "bg-blue-100 border-blue-300 text-blue-900",
  "bg-emerald-100 border-emerald-300 text-emerald-900",
  "bg-amber-100 border-amber-300 text-amber-900",
  "bg-rose-100 border-rose-300 text-rose-900",
  "bg-cyan-100 border-cyan-300 text-cyan-900",
  "bg-indigo-100 border-indigo-300 text-indigo-900"
]

export const GRID_START_MINUTES = 8 * 60
export const GRID_END_MINUTES = 17 * 60
export const SATURDAY_END_MINUTES = 13 * 60
export const MINUTES_PER_SLOT = 30
export const SLOT_HEIGHT_PX = 42

const BREAK_BANDS = [
  {
    start: MORNING_BREAK.start,
    end: MORNING_BREAK.end,
    label: "Morning break"
  },
  {
    start: LUNCH_BREAK.start,
    end: LUNCH_BREAK.end,
    label: "Lunch break"
  }
]

export function normalizeTime(value) {
  if (!value) {
    return ""
  }

  return value.slice(0, 5)
}

export function toMinutes(value) {
  const normalized = normalizeTime(value)
  const [hour, minute] = normalized.split(":").map(Number)
  return hour * 60 + minute
}

export function formatHourLabel(minutes) {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  const period = hour >= 12 ? "PM" : "AM"
  const displayHour =
    hour > 12 ? hour - 12 : hour === 0 ? 12 : hour

  if (minute === 0) {
    return `${displayHour}:00 ${period}`
  }

  return (
    `${displayHour}:` +
    `${String(minute).padStart(2, "0")} ${period}`
  )
}

export function getCourseColorClass(courseId) {
  return COURSE_COLORS[
    Math.abs(Number(courseId)) % COURSE_COLORS.length
  ]
}

export function getGridHeightPx() {
  const slots =
    (GRID_END_MINUTES - GRID_START_MINUTES) /
    MINUTES_PER_SLOT

  return slots * SLOT_HEIGHT_PX
}

export function getTimeLabels() {
  const labels = []

  for (
    let minutes = GRID_START_MINUTES;
    minutes < GRID_END_MINUTES;
    minutes += 60
  ) {
    labels.push({
      minutes,
      label: formatHourLabel(minutes),
      topPx: minutesToPixels(
        minutes - GRID_START_MINUTES
      )
    })
  }

  return labels
}

export function minutesToPixels(minutes) {
  return (minutes / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX
}

export function getDayRange(day) {
  const end =
    day === "Saturday"
      ? SATURDAY_END_MINUTES
      : GRID_END_MINUTES

  return {
    start: GRID_START_MINUTES,
    end
  }
}

export function getEventPosition(entry, day) {
  const { start: rangeStart, end: rangeEnd } =
    getDayRange(day)
  const eventStart = toMinutes(entry.start_time)
  const eventEnd = toMinutes(entry.end_time)
  const gridHeight = getGridHeightPx()
  const totalMinutes = GRID_END_MINUTES - GRID_START_MINUTES

  if (eventStart >= rangeEnd || eventEnd <= rangeStart) {
    return {
      top: 0,
      height: 0,
      visible: false
    }
  }

  const visibleStart = Math.max(eventStart, rangeStart)
  const visibleEnd = Math.min(eventEnd, rangeEnd)
  const top =
    ((visibleStart - GRID_START_MINUTES) / totalMinutes) *
    gridHeight
  const height =
    ((visibleEnd - visibleStart) / totalMinutes) *
    gridHeight

  return {
    top,
    height: Math.max(height, 36),
    visible: true
  }
}

export function getBreakBands() {
  const gridHeight = getGridHeightPx()
  const totalMinutes = GRID_END_MINUTES - GRID_START_MINUTES

  return BREAK_BANDS.map((band) => ({
    ...band,
    top:
      ((toMinutes(band.start) - GRID_START_MINUTES) /
        totalMinutes) *
      gridHeight,
    height:
      ((toMinutes(band.end) - toMinutes(band.start)) /
        totalMinutes) *
      gridHeight
  }))
}

export function getSaturdayInactiveTopPx() {
  const gridHeight = getGridHeightPx()
  const totalMinutes = GRID_END_MINUTES - GRID_START_MINUTES

  return (
    ((SATURDAY_END_MINUTES - GRID_START_MINUTES) /
      totalMinutes) *
    gridHeight
  )
}

export function groupEntriesByDay(entries) {
  const grouped = Object.fromEntries(
    TIMETABLE_DAYS.map((day) => [day, []])
  )

  entries.forEach((entry) => {
    if (grouped[entry.day_of_week]) {
      grouped[entry.day_of_week].push(entry)
    }
  })

  return grouped
}
