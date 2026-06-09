import { TIMETABLE_DAYS } from "../../constants/timetableSchedule"
import {
  getBreakBands,
  getCourseColorClass,
  getEventPosition,
  getGridHeightPx,
  getSaturdayInactiveTopPx,
  getTimeLabels,
  groupEntriesByDay,
  normalizeTime
} from "../../utils/weekTimetable"

function DayColumn({ day, entries, timeLabels }) {
  const isSaturday = day === "Saturday"
  const breakBands = getBreakBands()
  const inactiveTop = getSaturdayInactiveTopPx()

  return (
    <div
      className="
        relative
        border-l
        border-gray-100
        bg-white
      "
      style={{ height: getGridHeightPx() }}
    >
      {timeLabels.map((label) => (
        <div
          key={`${day}-line-${label.minutes}`}
          className="
            absolute
            left-0
            right-0
            border-t
            border-gray-100
            pointer-events-none
          "
          style={{ top: label.topPx }}
        />
      ))}

      {breakBands.map((band) => (
        <div
          key={`${day}-${band.start}`}
          className="
            absolute
            left-0
            right-0
            bg-amber-50/90
            border-y
            border-amber-100
            pointer-events-none
          "
          style={{
            top: band.top,
            height: band.height
          }}
        >
          <span
            className="
              absolute
              inset-0
              flex
              items-center
              justify-center
              text-[10px]
              text-amber-700
              italic
            "
          >
            Break
          </span>
        </div>
      ))}

      {isSaturday && (
        <div
          className="
            absolute
            left-0
            right-0
            bottom-0
            bg-gray-100/90
            border-t
            border-gray-200
            pointer-events-none
          "
          style={{ top: inactiveTop }}
        />
      )}

      {entries.map((entry) => {
        const position = getEventPosition(entry, day)

        if (!position.visible) {
          return null
        }

        const colorClass = getCourseColorClass(
          entry.course_id
        )

        return (
          <div
            key={
              entry.timetable_id ||
              `${entry.course_id}-${entry.start_time}`
            }
            className={`
              absolute
              left-1
              right-1
              rounded-lg
              border
              px-2
              py-1.5
              overflow-hidden
              shadow-sm
              z-10
              ${colorClass}
            `}
            style={{
              top: position.top,
              height: position.height
            }}
            title={
              `${entry.course_code} ` +
              `${normalizeTime(entry.start_time)}–` +
              `${normalizeTime(entry.end_time)}`
            }
          >
            <p className="font-semibold text-xs leading-tight truncate">
              {entry.course_code}
            </p>
            <p className="text-[10px] mt-0.5 opacity-80 truncate">
              {normalizeTime(entry.start_time)}
              {" – "}
              {normalizeTime(entry.end_time)}
            </p>
            <p className="text-[10px] mt-0.5 opacity-80 truncate">
              Room {entry.room_number}
            </p>
            <p className="text-[10px] opacity-80 truncate">
              {entry.instructor_name}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function WeekTimetableGrid({ entries }) {
  const entriesByDay = groupEntriesByDay(entries)
  const timeLabels = getTimeLabels()
  const gridHeight = getGridHeightPx()

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="min-w-[760px]">
        <div
          className="
            grid
            border-b
            border-gray-200
            bg-gray-50
          "
          style={{
            gridTemplateColumns: "88px repeat(6, minmax(110px, 1fr))"
          }}
        >
          <div className="px-3 py-3 text-sm font-semibold text-gray-600 border-r border-gray-200">
            Time
          </div>

          {TIMETABLE_DAYS.map((day) => (
            <div
              key={day}
              className="px-3 py-3 text-center text-sm font-semibold text-gray-700"
            >
              {day.slice(0, 3)}
            </div>
          ))}
        </div>

        <div
          className="grid"
          style={{
            gridTemplateColumns: "88px repeat(6, minmax(110px, 1fr))"
          }}
        >
          <div
            className="relative border-r border-gray-200 bg-gray-50"
            style={{ height: gridHeight }}
          >
            {timeLabels.map((label) => (
              <div
                key={label.minutes}
                className="
                  absolute
                  left-0
                  right-0
                  px-2
                  text-[11px]
                  font-medium
                  text-gray-500
                  -translate-y-1/2
                "
                style={{ top: label.topPx }}
              >
                {label.label}
              </div>
            ))}
          </div>

          {TIMETABLE_DAYS.map((day) => (
            <DayColumn
              key={day}
              day={day}
              entries={entriesByDay[day]}
              timeLabels={timeLabels}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default WeekTimetableGrid
