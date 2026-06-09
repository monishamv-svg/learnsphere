import { useState } from "react"

import Modal from "../common/Modal"
import Button from "../common/Button"
import Select from "../common/Select"
import { DEPARTMENT_FILTER_OPTIONS } from "../../constants/departments"

function AutoGenerateTimetableModal({
  isOpen,
  onClose,
  semester,
  department,
  onSubmit,
  submitting
}) {
  const [mode, setMode] = useState("missing_only")
  const [scopeDepartment, setScopeDepartment] =
    useState(department || "All")

  if (!isOpen) {
    return null
  }

  const handleSubmit = () => {
    onSubmit({
      mode,
      department:
        scopeDepartment === "All"
          ? null
          : scopeDepartment
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Auto-generate Timetable"
    >
      <p className="text-sm text-gray-600 mb-4">
        Create weekly class slots automatically for
        {" "}
        <span className="font-semibold">
          Semester {semester}
        </span>
        . Each slot repeats every week. You can still
        edit or delete results afterward.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department scope
          </label>

          <Select
            value={scopeDepartment}
            onChange={(event) => {
              setScopeDepartment(event.target.value)
            }}
          >
            {DEPARTMENT_FILTER_OPTIONS.map((dept) => (
              <option key={dept} value={dept}>
                {dept === "All"
                  ? "All Departments"
                  : dept}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Generation mode
          </label>

          <label className="flex items-start gap-2 mb-2">
            <input
              type="radio"
              name="generate-mode"
              value="missing_only"
              checked={mode === "missing_only"}
              onChange={() => setMode("missing_only")}
              className="mt-1"
            />
            <span className="text-sm text-gray-700">
              Schedule courses without slots only
              <span className="block text-gray-500">
                Safe option. Skips courses that already
                have a timetable entry.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2">
            <input
              type="radio"
              name="generate-mode"
              value="replace"
              checked={mode === "replace"}
              onChange={() => setMode("replace")}
              className="mt-1"
            />
            <span className="text-sm text-gray-700">
              Replace and regenerate
              <span className="block text-gray-500">
                Deletes existing slots first, then
                rebuilds. Fails if any section has
                enrolled students.
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button
          onClick={onClose}
          className="bg-slate-500"
          disabled={submitting}
        >
          Cancel
        </Button>

        <Button
          onClick={handleSubmit}
          className="bg-violet-600"
          disabled={submitting}
        >
          {submitting
            ? "Generating..."
            : "Generate Timetable"}
        </Button>
      </div>
    </Modal>
  )
}

export default AutoGenerateTimetableModal
