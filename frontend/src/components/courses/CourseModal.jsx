import { useState } from "react"

import Button from "../common/Button"
import Input from "../common/Input"
import Select from "../common/Select"
import FormField from "../common/FormField"
import Modal from "../common/Modal"
import { DEPARTMENTS } from "../../constants/departments"

const CREDIT_OPTIONS = ["1", "3", "4"]

const SEMESTER_OPTIONS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8"
]

const emptyForm = {
  course_code: "",
  title: "",
  description: "",
  credits: "",
  semester: "",
  department: "",
  instructor_name: "",
  additional_instructors: "",
  max_capacity: "",
  is_elective: "false"
}

function toFormData(data) {
  return {
    course_code: data.course_code,
    title: data.title,
    description: data.description || "",
    credits: String(data.credits),
    semester: String(data.semester),
    department: data.department || "",
    instructor_name: data.instructor_name || "",
    additional_instructors: data.additional_instructors || "",
    max_capacity: String(data.max_capacity),
    is_elective: data.is_elective ? "true" : "false"
  }
}

function parseCredits(value) {
  const trimmed = String(value).trim()

  if (!trimmed) {
    return {
      valid: false,
      message: "Credits is required"
    }
  }

  const credits = Number(trimmed)

  if (![1, 3, 4].includes(credits)) {
    return {
      valid: false,
      message: "Credits must be 1, 3, or 4"
    }
  }

  return { valid: true, value: credits }
}

function parseSemester(value) {
  const trimmed = String(value).trim()

  if (!trimmed) {
    return {
      valid: false,
      message: "Semester is required (1–8)"
    }
  }

  const semester = Number(trimmed)

  if (
    !Number.isInteger(semester) ||
    semester < 1 ||
    semester > 8
  ) {
    return {
      valid: false,
      message: "Semester must be a whole number between 1 and 8"
    }
  }

  return { valid: true, value: semester }
}

function parseMaxCapacity(value) {
  const trimmed = String(value).trim()

  if (!trimmed) {
    return {
      valid: false,
      message: "Max capacity is required (1–500)"
    }
  }

  const maxCapacity = Number(trimmed)

  if (
    !Number.isInteger(maxCapacity) ||
    maxCapacity < 1 ||
    maxCapacity > 500
  ) {
    return {
      valid: false,
      message: "Max capacity must be a whole number between 1 and 500"
    }
  }

  return { valid: true, value: maxCapacity }
}

function CourseModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null
}) {

  const [form, setForm] = useState(() =>
    initialData
      ? toFormData(initialData)
      : emptyForm
  )
  const [creditsError, setCreditsError] = useState("")
  const [semesterError, setSemesterError] = useState("")
  const [capacityError, setCapacityError] = useState("")

  const handleClose = () => {
    setForm(emptyForm)
    setCreditsError("")
    setSemesterError("")
    setCapacityError("")
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const creditsResult = parseCredits(form.credits)
    const semesterResult = parseSemester(form.semester)
    const capacityResult = parseMaxCapacity(form.max_capacity)

    if (!creditsResult.valid) {
      setCreditsError(creditsResult.message)
      return
    }

    if (!semesterResult.valid) {
      setSemesterError(semesterResult.message)
      return
    }

    if (!capacityResult.valid) {
      setCapacityError(capacityResult.message)
      return
    }

    if (!form.department) {
      return
    }

    setCreditsError("")
    setSemesterError("")
    setCapacityError("")

    await onSubmit({
      course_code: form.course_code,
      title: form.title,
      description: form.description || null,
      credits: creditsResult.value,
      semester: semesterResult.value,
      department: form.department,
      instructor_name: form.instructor_name || null,
      additional_instructors: form.additional_instructors.trim() || null,
      max_capacity: capacityResult.value,
      is_elective: form.is_elective === "true"
    })

    if (!initialData) {
      setForm(emptyForm)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        initialData
          ? "Edit Course"
          : "Create Course"
      }
      maxWidth="max-w-xl"
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3"
      >
        <FormField
          label={
            initialData
              ? "Course Code"
              : "Course Code"
          }
          htmlFor="course-code"
        >
          <Input
            id="course-code"
            disabled={initialData}
            placeholder="e.g. CS101"
            value={form.course_code}
            onChange={(e) =>
              setForm({
                ...form,
                course_code: e.target.value
              })
            }
            className="disabled:bg-gray-100 disabled:text-gray-500"
          />
        </FormField>

        <FormField label="Title" htmlFor="course-title">
          <Input
            id="course-title"
            placeholder="Enter course title"
            value={form.title}
            onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value
              })
            }
            required
          />
        </FormField>

        <FormField label="Description" htmlFor="course-description">
          <textarea
            id="course-description"
            placeholder="Enter course description"
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value
              })
            }
            className="
              border
              border-gray-300
              p-2.5
              rounded-lg
              w-full
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
            "
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Credits"
            htmlFor="course-credits"
            error={creditsError}
          >
            <Select
              id="course-credits"
              value={form.credits}
              onChange={(e) => {
                setForm({
                  ...form,
                  credits: e.target.value
                })
                setCreditsError("")
              }}
              className={
                creditsError ? "border-red-500" : ""
              }
              required
            >
              <option value="">Select Credits</option>
              {CREDIT_OPTIONS.map((credit) => (
                <option key={credit} value={credit}>
                  {credit} Credit{credit === "1" ? "" : "s"}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Semester"
            htmlFor="course-semester"
            error={semesterError}
          >
            <Select
              id="course-semester"
              value={form.semester}
              onChange={(e) => {
                setForm({
                  ...form,
                  semester: e.target.value
                })
                setSemesterError("")
              }}
              className={
                semesterError ? "border-red-500" : ""
              }
              required
            >
              <option value="">Select Semester</option>
              {SEMESTER_OPTIONS.map((semester) => (
                <option key={semester} value={semester}>
                  Semester {semester}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label="Course Type" htmlFor="course-type">
          <Select
            id="course-type"
            value={form.is_elective}
            onChange={(e) =>
              setForm({
                ...form,
                is_elective: e.target.value
              })
            }
          >
            <option value="false">Core</option>
            <option value="true">Elective</option>
          </Select>
        </FormField>

        <FormField label="Department" htmlFor="course-department">
          <Select
            id="course-department"
            value={form.department}
            onChange={(e) =>
              setForm({
                ...form,
                department: e.target.value
              })
            }
            required
          >
            <option value="">Select Department</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Professor Name" htmlFor="course-instructor">
          <Input
            id="course-instructor"
            placeholder="Enter primary professor name"
            value={form.instructor_name}
            onChange={(e) =>
              setForm({
                ...form,
                instructor_name: e.target.value
              })
            }
          />
        </FormField>

        <FormField
          label="Additional Professors"
          htmlFor="course-additional-instructors"
        >
          <Input
            id="course-additional-instructors"
            placeholder="Comma-separated names, e.g. Jane Doe, John Smith"
            value={form.additional_instructors}
            onChange={(e) =>
              setForm({
                ...form,
                additional_instructors: e.target.value
              })
            }
          />
        </FormField>

        <FormField
          label="Max Capacity"
          htmlFor="course-max-capacity"
          error={capacityError}
        >
          <Input
            id="course-max-capacity"
            type="number"
            min={1}
            max={500}
            placeholder="e.g. 40"
            value={form.max_capacity}
            onChange={(e) => {
              setForm({
                ...form,
                max_capacity: e.target.value
              })
              setCapacityError("")
            }}
            className={
              capacityError ? "border-red-500" : ""
            }
          />
        </FormField>

        <div className="flex gap-3 mt-2">
          <Button
            type="submit"
            className="bg-emerald-600"
          >
            {initialData
              ? "Update"
              : "Create"}
          </Button>

          <Button
            type="button"
            onClick={handleClose}
            className="bg-gray-500"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CourseModal
