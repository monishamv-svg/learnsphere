import { useMemo, useState } from "react"

import Button from "../common/Button"
import Input from "../common/Input"
import Select from "../common/Select"
import FormField from "../common/FormField"
import SearchableSelect from "../common/SearchableSelect"
import { ROOM_OPTIONS } from "../../constants/rooms"
import {
  SCHEDULE_RULES_SUMMARY,
  TIMETABLE_DAYS,
  validateClassSchedule
} from "../../constants/timetableSchedule"
import { getCourseInstructors } from "../../utils/courseInstructors"
import {
  findInstructorConflict,
  findTimetableConflict,
  getAvailableRooms
} from "../../utils/timetableConflicts"

const DAYS = TIMETABLE_DAYS

const emptyForm = {
  course_id: "",
  day_of_week: "",
  start_time: "",
  end_time: "",
  room_number: "",
  instructor_name: ""
}

function toFormData(data) {
  return {
    course_id: String(data.course_id),
    day_of_week: data.day_of_week,
    start_time: data.start_time,
    end_time: data.end_time,
    room_number: data.room_number,
    instructor_name: data.instructor_name
  }
}

function TimetableModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  courses = [],
  existingEntries = [],
  submitting = false
}) {

  const [form, setForm] = useState(() =>
    initialData
      ? toFormData(initialData)
      : emptyForm
  )

  const selectedCourse = useMemo(
    () =>
      courses.find(
        (course) =>
          String(course.id) === String(form.course_id)
      ) || null,
    [courses, form.course_id]
  )

  const courseOptions = useMemo(
    () =>
      courses.map((course) => ({
        value: course.id,
        label: (
          `${course.course_code} — ${course.title} ` +
          `(Sem ${course.semester})`
        ),
        searchText: (
          `${course.course_code} ${course.title} ` +
          `${course.department} semester ${course.semester} ` +
          `sem ${course.semester} ${course.semester}`
        )
      })),
    [courses]
  )

  const courseInstructors = useMemo(
    () => getCourseInstructors(selectedCourse),
    [selectedCourse]
  )

  const availableRooms = useMemo(
    () =>
      getAvailableRooms({
        allRooms: ROOM_OPTIONS,
        entries: existingEntries,
        dayOfWeek: form.day_of_week,
        startTime: form.start_time,
        endTime: form.end_time,
        excludeId: initialData?.id ?? null
      }),
    [
      existingEntries,
      form.day_of_week,
      form.start_time,
      form.end_time,
      initialData?.id
    ]
  )

  const effectiveRoomNumber = useMemo(() => {
    if (!form.room_number) {
      return ""
    }

    if (
      form.day_of_week &&
      form.start_time &&
      form.end_time &&
      !availableRooms.includes(form.room_number)
    ) {
      return ""
    }

    return form.room_number
  }, [
    form.room_number,
    form.day_of_week,
    form.start_time,
    form.end_time,
    availableRooms
  ])

  const defaultInstructor = courseInstructors[0] || "TBD"
  const hasMultipleInstructors = courseInstructors.length > 1
  const selectedInstructor =
    form.instructor_name || defaultInstructor

  const instructorSlotSelected =
    !!form.day_of_week &&
    !!form.start_time &&
    !!form.end_time

  const getInstructorConflict = (instructorName) => {
    if (!instructorSlotSelected || !instructorName) {
      return null
    }

    return findInstructorConflict({
      entries: existingEntries,
      dayOfWeek: form.day_of_week,
      startTime: form.start_time,
      endTime: form.end_time,
      instructorName,
      excludeId: initialData?.id ?? null
    })
  }

  const instructorAvailabilityError = useMemo(() => {
    if (
      !instructorSlotSelected ||
      !selectedCourse ||
      !selectedInstructor
    ) {
      return ""
    }

    return (
      findInstructorConflict({
        entries: existingEntries,
        dayOfWeek: form.day_of_week,
        startTime: form.start_time,
        endTime: form.end_time,
        instructorName: selectedInstructor,
        excludeId: initialData?.id ?? null
      }) || ""
    )
  }, [
    existingEntries,
    form.day_of_week,
    form.start_time,
    form.end_time,
    selectedCourse,
    selectedInstructor,
    initialData?.id,
    instructorSlotSelected
  ])

  const scheduleConflict = useMemo(() => {
    if (
      !form.day_of_week ||
      !form.start_time ||
      !form.end_time
    ) {
      return ""
    }

    return (
      findTimetableConflict({
        entries: existingEntries,
        dayOfWeek: form.day_of_week,
        startTime: form.start_time,
        endTime: form.end_time,
        roomNumber: form.room_number,
        instructorName: selectedInstructor,
        courseId: form.course_id,
        excludeId: initialData?.id ?? null
      }) || ""
    )
  }, [
    existingEntries,
    form,
    selectedInstructor,
    initialData?.id
  ])

  const policyError = useMemo(() => {
    if (
      !form.day_of_week ||
      !form.start_time ||
      !form.end_time
    ) {
      return ""
    }

    return (
      validateClassSchedule(
        form.day_of_week,
        form.start_time,
        form.end_time
      ) || ""
    )
  }, [
    form.day_of_week,
    form.start_time,
    form.end_time
  ])

  const conflictError = policyError || scheduleConflict

  const instructorSelectDisabled = !selectedCourse

  if (!isOpen) return null

  const handleClose = () => {
    setForm(emptyForm)
    onClose()
  }

  const handleCourseChange = (courseId) => {
    const course = courses.find(
      (item) => String(item.id) === String(courseId)
    )
    const instructors = getCourseInstructors(course)

    setForm({
      ...form,
      course_id: courseId,
      instructor_name: instructors[0] || "TBD"
    })
  }

  const validateSchedule = () => {
    return (
      !policyError &&
      !instructorAvailabilityError &&
      !scheduleConflict
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const instructor = form.instructor_name || defaultInstructor

    if (!validateSchedule()) {
      return
    }

    await onSubmit({
      course_id: Number(form.course_id),
      day_of_week: form.day_of_week,
      start_time: form.start_time,
      end_time: form.end_time,
      room_number: effectiveRoomNumber,
      instructor_name: instructor
    })

    if (!initialData) {
      setForm(emptyForm)
    }
  }

  const roomSelectDisabled =
    !form.day_of_week ||
    !form.start_time ||
    !form.end_time

  return (
    <div
      className="
        fixed
        inset-0
        bg-black/50
        z-50
        overflow-y-auto
        p-4
      "
    >
      <div className="flex min-h-full items-center justify-center">
        <div
          className="
            bg-white
            p-6
            rounded-xl
            w-full
            max-w-lg
            max-h-[calc(100vh-2rem)]
            overflow-y-auto
            shadow-xl
          "
        >
          <h2 className="text-xl font-bold mb-4 text-gray-900">
            {initialData
              ? "Edit Timetable"
              : "Create Timetable"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3"
          >
            <SearchableSelect
              id="timetable-course"
              label={
                initialData
                  ? "Course (read-only)"
                  : "Course"
              }
              placeholder="Search by course code, title, or semester"
              options={courseOptions}
              value={form.course_id}
              onChange={handleCourseChange}
              disabled={!!initialData}
              required
              emptyMessage="No courses match your search"
            />

            <FormField label="Day" htmlFor="timetable-day">
              <Select
                id="timetable-day"
                value={form.day_of_week}
                onChange={(e) => {
                  setForm({
                    ...form,
                    day_of_week: e.target.value
                  })
                }}
                required
              >
                <option value="">Select Day</option>
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Start Time"
                htmlFor="timetable-start-time"
              >
                <Input
                  id="timetable-start-time"
                  type="time"
                  value={form.start_time}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      start_time: e.target.value
                    })
                  }}
                  required
                />
              </FormField>

              <FormField
                label="End Time"
                htmlFor="timetable-end-time"
              >
                <Input
                  id="timetable-end-time"
                  type="time"
                  value={form.end_time}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      end_time: e.target.value
                    })
                  }}
                  required
                />
              </FormField>
            </div>

            <ul className="text-xs text-gray-500 list-disc pl-4 space-y-1">
              {SCHEDULE_RULES_SUMMARY.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>

            <FormField
              label="Room Number"
              htmlFor="timetable-room"
            >
              <Select
                id="timetable-room"
                value={effectiveRoomNumber}
                onChange={(e) => {
                  setForm({
                    ...form,
                    room_number: e.target.value
                  })
                }}
                disabled={roomSelectDisabled}
                required
              >
                <option value="">
                  {roomSelectDisabled
                    ? "Select day and time first"
                    : availableRooms.length
                      ? "Select Room"
                      : "No rooms available for this slot"}
                </option>
                {availableRooms.map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="Instructor Name"
              htmlFor="timetable-instructor"
              error={instructorAvailabilityError}
            >
              {hasMultipleInstructors ? (
                <Select
                  id="timetable-instructor"
                  value={form.instructor_name || defaultInstructor}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      instructor_name: e.target.value
                    })
                  }
                  disabled={instructorSelectDisabled}
                  required
                >
                  <option value="">
                    {selectedCourse
                      ? "Select Instructor"
                      : "Select a course first"}
                  </option>
                  {courseInstructors.map((name) => {
                    const unavailable = !!getInstructorConflict(name)

                    return (
                      <option key={name} value={name}>
                        {unavailable
                          ? `${name} (unavailable)`
                          : name}
                      </option>
                    )
                  })}
                </Select>
              ) : (
                <Input
                  id="timetable-instructor"
                  value={form.instructor_name || defaultInstructor}
                  disabled
                  readOnly
                />
              )}
            </FormField>

            {conflictError &&
              conflictError !== instructorAvailabilityError && (
              <p className="text-sm text-red-600">
                {conflictError}
              </p>
            )}

            <div className="flex gap-3 mt-2">
              <Button
                type="submit"
                disabled={
                  submitting ||
                  !!policyError ||
                  !!instructorAvailabilityError ||
                  !!scheduleConflict
                }
                className="bg-emerald-600"
              >
                {submitting
                  ? "Saving..."
                  : initialData
                    ? "Update"
                    : "Create"}
              </Button>

              <Button
                type="button"
                disabled={submitting}
                onClick={handleClose}
                className="bg-gray-500"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TimetableModal
