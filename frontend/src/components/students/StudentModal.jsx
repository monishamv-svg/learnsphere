import Select from "../common/Select"
import FormField from "../common/FormField"
import { DEPARTMENTS } from "../../constants/departments"

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

const fieldClass = "border border-gray-300 p-2.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

function StudentModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  editingStudentId,
  semesterError,
  setSemesterError,
  phoneError,
  setPhoneError,
  parsePhone,
  submitting
}) {

  if (!isOpen) return null

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
          rounded-xl
          p-6
          w-full
          max-w-2xl
          max-h-[calc(100vh-2rem)]
          overflow-y-auto
          shadow-xl
        "
      >

        <h2
          className="
            text-2xl
            font-bold
            mb-4
          "
        >
          {
            editingStudentId
              ? "Edit Student"
              : "Create Student"
          }
        </h2>

        <form
          onSubmit={onSubmit}
          className="
            grid
            md:grid-cols-2
            gap-3
          "
        >

          <FormField label="Full Name" htmlFor="student-full-name">
            <input
              id="student-full-name"
              placeholder="Enter full name"
              value={form.full_name}
              onChange={(e) =>
                setForm({
                  ...form,
                  full_name: e.target.value
                })
              }
              className={fieldClass}
              required
            />
          </FormField>

          <FormField
            label={
              editingStudentId
                ? "Email"
                : "Email"
            }
            htmlFor="student-email"
          >
            <input
              id="student-email"
              disabled={editingStudentId}
              placeholder="Enter email address"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value
                })
              }
              className={`
                ${fieldClass}
                disabled:bg-gray-100
                disabled:text-gray-500
              `}
            />
          </FormField>

          <FormField
            label={
              editingStudentId
                ? "Password"
                : "Password"
            }
            htmlFor="student-password"
          >
            <input
              id="student-password"
              disabled={editingStudentId}
              placeholder={
                editingStudentId
                  ? "Not editable"
                  : "Enter password"
              }
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value
                })
              }
              className={`
                ${fieldClass}
                disabled:bg-gray-100
                disabled:text-gray-500
              `}
            />
          </FormField>

          <FormField
            label={
              editingStudentId
                ? "Student Code"
                : "Student Code"
            }
            htmlFor="student-code"
          >
            <input
              id="student-code"
              disabled={editingStudentId}
              placeholder="Enter student code"
              value={form.student_code}
              onChange={(e) =>
                setForm({
                  ...form,
                  student_code: e.target.value
                })
              }
              className={`
                ${fieldClass}
                disabled:bg-gray-100
                disabled:text-gray-500
              `}
            />
          </FormField>

          <FormField label="Department" htmlFor="student-department">
            <Select
              id="student-department"
              value={form.department}
              onChange={(e) =>
                setForm({
                  ...form,
                  department: e.target.value
                })
              }
              required
            >
              <option value="">
                Select Department
              </option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Semester"
            htmlFor="student-semester"
            error={semesterError}
          >
            <Select
              id="student-semester"
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

          <FormField
            label="Phone Number"
            htmlFor="student-phone"
            error={phoneError}
          >
            <input
              id="student-phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit mobile number"
              value={form.phone_number}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/\D/g, "")
                setForm({
                  ...form,
                  phone_number: digitsOnly
                })
                setPhoneError("")
              }}
              onBlur={() => {
                if (!form.phone_number) return

                const result = parsePhone(form.phone_number, true)

                if (!result.valid) {
                  setPhoneError(result.message)
                }
              }}
              className={`
                ${fieldClass}
                ${phoneError ? "border-red-500" : ""}
              `}
              required
            />
          </FormField>

          <div className="col-span-2 flex gap-3">

          <button
            type="submit"
            disabled={submitting}
            className="
            bg-blue-600
            text-white
              px-4
              py-2
              rounded
              disabled:opacity-50
            "
          >
            {submitting
              ? "Saving..."
              : editingStudentId
                ? "Update"
                : "Create"}
          </button>

            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="
                bg-gray-300
                px-4
                py-2
                rounded
                disabled:opacity-50
              "
            >
              Cancel
            </button>

          </div>

        </form>

      </div>
      </div>

    </div>
  )
}

export default StudentModal
