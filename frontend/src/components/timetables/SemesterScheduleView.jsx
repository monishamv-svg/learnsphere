import { useEffect, useState } from "react"

import { toast } from "react-toastify"

import api from "../../api/axios"

import WeekTimetableGrid from "./WeekTimetableGrid"
import AutoGenerateTimetableModal from "./AutoGenerateTimetableModal"
import Button from "../common/Button"
import Loader from "../common/Loader"
import EmptyState from "../common/EmptyState"
import { DEPARTMENT_FILTER_OPTIONS } from "../../constants/departments"

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]

function SemesterScheduleView({
  refreshKey = 0,
  onEdit,
  onDelete,
  onGenerated
}) {
  const [summaries, setSummaries] = useState([])
  const [selectedSemester, setSelectedSemester] =
    useState(1)
  const [departmentFilter, setDepartmentFilter] =
    useState("All")
  const [schedule, setSchedule] = useState(null)
  const [loadingSummaries, setLoadingSummaries] =
    useState(true)
  const [loadingSchedule, setLoadingSchedule] =
    useState(false)
  const [showGenerateModal, setShowGenerateModal] =
    useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    let active = true

    async function loadSummaries() {
      setLoadingSummaries(true)

      try {
        const response = await api.get("/timetables/schedules")

        if (!active) {
          return
        }

        const items = response.data.schedules ?? []
        setSummaries(items)

        if (refreshKey === 0) {
          const firstWithEntries = items.find(
            (item) => item.entry_count > 0
          )

          if (firstWithEntries) {
            setSelectedSemester(
              firstWithEntries.semester
            )
          }
        }
      } finally {
        if (active) {
          setLoadingSummaries(false)
        }
      }
    }

    loadSummaries()

    return () => {
      active = false
    }
  }, [refreshKey])

  useEffect(() => {
    let active = true

    async function loadSchedule() {
      setLoadingSchedule(true)

      const params = {}

      if (departmentFilter !== "All") {
        params.department = departmentFilter
      }

      try {
        const response = await api.get(
          `/timetables/schedules/${selectedSemester}`,
          { params }
        )

        if (active) {
          setSchedule(response.data)
        }
      } catch {
        if (active) {
          setSchedule(null)
        }
      } finally {
        if (active) {
          setLoadingSchedule(false)
        }
      }
    }

    loadSchedule()

    return () => {
      active = false
    }
  }, [selectedSemester, departmentFilter, refreshKey])

  const handleGenerate = async ({ mode, department }) => {
    setGenerating(true)

    try {
      const response = await api.post(
        `/timetables/schedules/${selectedSemester}/generate`,
        {
          mode,
          department
        }
      )

      const result = response.data
      toast.success(result.message)

      if (result.failed_count > 0) {
        toast.warning(
          `${result.failed_count} course(s) could not be scheduled`
        )
      }

      setShowGenerateModal(false)
      onGenerated?.()
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
        "Could not auto-generate timetable"
      )
    } finally {
      setGenerating(false)
    }
  }

  if (loadingSummaries) {
    return <Loader />
  }

  const summaryBySemester = new Map(
    summaries.map((item) => [
      item.semester,
      item
    ])
  )

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {SEMESTERS.map((semester) => {
          const summary = summaryBySemester.get(
            semester
          )
          const count = summary?.entry_count ?? 0
          const isActive =
            selectedSemester === semester

          return (
            <button
              key={semester}
              type="button"
              onClick={() => {
                setSelectedSemester(semester)
              }}
              className={`
                rounded-lg
                border
                px-4
                py-2
                text-sm
                font-medium
                transition
                ${
                  isActive
                    ? "border-violet-500 bg-violet-600 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              Semester {semester}
              <span
                className={`
                  ml-2
                  rounded-full
                  px-2
                  py-0.5
                  text-xs
                  ${
                    isActive
                      ? "bg-violet-500 text-white"
                      : "bg-gray-100 text-gray-600"
                  }
                `}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button
          onClick={() => setShowGenerateModal(true)}
          className="bg-emerald-600"
        >
          Auto-generate Timetable
        </Button>

        <label
          htmlFor="schedule-department-filter"
          className="text-sm font-medium text-gray-700"
        >
          Department
        </label>

        <select
          id="schedule-department-filter"
          value={departmentFilter}
          onChange={(event) => {
            setDepartmentFilter(event.target.value)
          }}
          className="
            rounded-lg
            border
            border-gray-200
            px-3
            py-2
            text-sm
            bg-white
          "
        >
          {DEPARTMENT_FILTER_OPTIONS.map((dept) => (
            <option key={dept} value={dept}>
              {dept === "All"
                ? "All Departments"
                : dept}
            </option>
          ))}
        </select>

        {schedule && (
          <p className="text-sm text-gray-500">
            {schedule.total_entries} class slots
            {" · "}
            {schedule.total_courses} courses
          </p>
        )}
      </div>

      {loadingSchedule ? (
        <Loader />
      ) : !schedule ? (
        <EmptyState
          message={
            `No timetable entries for Semester ` +
            `${selectedSemester}`
          }
        />
      ) : (
        <div className="space-y-8">
          {schedule.department_groups.map((group) => (
            <section
              key={group.department}
              className="
                rounded-xl
                border
                border-gray-200
                bg-white
                p-5
                shadow-sm
              "
            >
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {group.department}
                </h2>
                <p className="text-sm text-gray-500">
                  Semester {schedule.semester}
                  {" · "}
                  {group.entry_count} class slots
                </p>
              </div>

              <WeekTimetableGrid
                entries={group.entries}
              />

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-2 pr-4">Course</th>
                      <th className="py-2 pr-4">Day</th>
                      <th className="py-2 pr-4">Time</th>
                      <th className="py-2 pr-4">Room</th>
                      <th className="py-2 pr-4">Professor</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.entries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-gray-100"
                      >
                        <td className="py-2 pr-4">
                          {entry.course_code}
                          {" — "}
                          {entry.course_title}
                        </td>
                        <td className="py-2 pr-4">
                          {entry.day_of_week}
                        </td>
                        <td className="py-2 pr-4">
                          {entry.start_time}
                          {" – "}
                          {entry.end_time}
                        </td>
                        <td className="py-2 pr-4">
                          {entry.room_number}
                        </td>
                        <td className="py-2 pr-4">
                          {entry.instructor_name}
                        </td>
                        <td className="py-2">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => onEdit(entry)}
                              className="bg-amber-500 px-3 py-1 text-sm"
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() =>
                                onDelete(entry.id)
                              }
                              className="bg-red-600 px-3 py-1 text-sm"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      <AutoGenerateTimetableModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        semester={selectedSemester}
        department={
          departmentFilter === "All"
            ? null
            : departmentFilter
        }
        onSubmit={handleGenerate}
        submitting={generating}
      />
    </div>
  )
}

export default SemesterScheduleView
