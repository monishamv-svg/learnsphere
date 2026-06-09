import { useCallback, useEffect, useState } from "react"

import api from "../../api/axios"

import DashboardLayout from "../../components/layout/DashboardLayout"
import StudentModal from "../../components/students/StudentModal"
import Button from "../../components/common/Button"
import Input from "../../components/common/Input"
import Select from "../../components/common/Select"
import Table from "../../components/common/Table"
import Loader from "../../components/common/Loader"
import EmptyState from "../../components/common/EmptyState"
import ConfirmDialog from "../../components/common/ConfirmDialog"

import { toast } from "react-toastify"

import { DEPARTMENT_FILTER_OPTIONS } from "../../constants/departments"

const SEMESTERS = [
  "All",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8"
]

const PHONE_PATTERN = /^[6789]\d{9}$/

const PHONE_ERROR =
  "Phone number must be exactly 10 digits and start with 6, 7, 8, or 9"

function StudentsPage() {

  const [students, setStudents] = useState([])

  const [isModalOpen, setIsModalOpen] = useState(false)

  const [editingStudentId, setEditingStudentId] = useState(null)

  const [search, setSearch] = useState("")

  const [appliedSearch, setAppliedSearch] =
    useState("")

  const [appliedDepartment, setAppliedDepartment] =
    useState("")

  const [appliedSemester, setAppliedSemester] =
    useState("")

  const [departmentFilter, setDepartmentFilter] =
    useState("All")

  const [semesterFilter, setSemesterFilter] =
    useState("All")

  const [page, setPage] = useState(0)

  const [submitting, setSubmitting] = useState(false)

  const [totalCount, setTotalCount] = useState(0)

  const [loading, setLoading] = useState(true)

  const [confirmDelete, setConfirmDelete] = useState(null)

  const limit = 10

  const [semesterError, setSemesterError] = useState("")

  const [phoneError, setPhoneError] = useState("")

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    student_code: "",
    department: "",
    semester: "",
    phone_number: ""
  })

  const parseSemester = (value) => {
    const trimmed = String(value).trim()

    if (!trimmed) {
      return {
        valid: false,
        message: "Semester is required"
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

  const parsePhone = (value, required = true) => {
    const trimmed = String(value).trim()

    if (!trimmed) {
      if (!required) {
        return { valid: true, value: "" }
      }

      return {
        valid: false,
        message: "Phone number is required"
      }
    }

    if (!/^\d+$/.test(trimmed)) {
      return {
        valid: false,
        message: PHONE_ERROR
      }
    }

    if (!PHONE_PATTERN.test(trimmed)) {
      return {
        valid: false,
        message: PHONE_ERROR
      }
    }

    return { valid: true, value: trimmed }
  }

  const fetchStudents = useCallback(async () => {
    setLoading(true)

    try {
      const response = await api.get(
        "/students",
        {
          params: {
            skip: page * limit,
            limit,
            ...(appliedSearch && {
              search: appliedSearch
            }),
            ...(appliedDepartment && {
              department: appliedDepartment
            }),
            ...(appliedSemester && {
              semester: Number(appliedSemester)
            })
          }
        }
      )

      setStudents(
        response.data.items
      )

      setTotalCount(
        response.data.total_count
      )
    } finally {
      setLoading(false)
    }
  }, [
    limit,
    page,
    appliedSearch,
    appliedDepartment,
    appliedSemester
  ])

  useEffect(() => {
    ;(async () => {
      await fetchStudents()
    })()
  }, [fetchStudents])

  const handleSubmit = async (e) => {

    e.preventDefault()

    const semesterResult = parseSemester(form.semester)
    const phoneResult = parsePhone(form.phone_number, true)

    if (!semesterResult.valid) {
      setSemesterError(semesterResult.message)
      return
    }

    if (!phoneResult.valid) {
      setPhoneError(phoneResult.message)
      return
    }

    setSemesterError("")
    setPhoneError("")
    setSubmitting(true)

    try {

      if (editingStudentId) {

        await api.patch(
          `/students/${editingStudentId}`,
          {
            full_name: form.full_name,
            department: form.department,
            semester: semesterResult.value,
            phone_number: phoneResult.value
          }
        )

        toast.success(
          "Student updated successfully"
        )

      } else {

        await api.post(
          "/students",
          {
            ...form,
            semester: semesterResult.value,
            phone_number: phoneResult.value
          }
        )

        toast.success(
          "Student created successfully"
        )
      }

      setEditingStudentId(null)

      setIsModalOpen(false)

      setForm({
        full_name: "",
        email: "",
        password: "",
        student_code: "",
        department: "",
        semester: "",
        phone_number: ""
      })

      fetchStudents()

    } catch (error) {

      toast.error(
        error.response?.data?.detail ||
        "Operation failed"
      )

    } finally {

      setSubmitting(false)

    }
  }

  const handleDelete = async (id) => {

    try {

      await api.delete(
        `/students/${id}`
      )

      toast.success(
        "Student deleted successfully"
      )

      fetchStudents()

    } catch {

      toast.error(
        "Failed to delete student"
      )

    } finally {
      setConfirmDelete(null)
    }
  }

  const handleEdit = (student) => {

    setEditingStudentId(student.id)

    setForm({
      full_name: student.full_name,
      email: student.email,
      password: "",
      student_code: student.student_code,
      department: student.department,
      semester: String(student.semester),
      phone_number: student.phone_number || ""
    })

    setSemesterError("")

    setPhoneError("")

    setIsModalOpen(true)
  }

  const handleSearch = () => {
    setAppliedSearch(search.trim())
    setAppliedDepartment(
      departmentFilter === "All"
        ? ""
        : departmentFilter
    )
    setAppliedSemester(
      semesterFilter === "All"
        ? ""
        : semesterFilter
    )
    setPage(0)
  }

  const handleDepartmentChange = (value) => {
    setDepartmentFilter(value)
    setAppliedDepartment(
      value === "All" ? "" : value
    )
    setPage(0)
  }

  const handleSemesterChange = (value) => {
    setSemesterFilter(value)
    setAppliedSemester(
      value === "All" ? "" : value
    )
    setPage(0)
  }

  const isInitialLoad =
    loading && students.length === 0

  if (isInitialLoad) {
    return (
      <DashboardLayout>
        <Loader />
      </DashboardLayout>
    )
  }

  const resetForm = () => ({
    full_name: "",
    email: "",
    password: "",
    student_code: "",
    department: "",
    semester: "",
    phone_number: ""
  })

  return (
    <DashboardLayout>

      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Students Management
        </h1>

        <Button
          onClick={() => {
            setEditingStudentId(null)
            setForm(resetForm())
            setSemesterError("")
            setPhoneError("")
            setIsModalOpen(true)
          }}
          className="bg-emerald-600"
        >
          Add Student
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Input
          type="text"
          placeholder="Search Students"
          value={search}
          onChange={(e) => {
            const value = e.target.value
            setSearch(value)

            if (value.trim() === "") {
              setAppliedSearch("")
              setPage(0)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch()
            }
          }}
          className="max-w-xs"
        />

        <Select
          value={departmentFilter}
          onChange={(e) =>
            handleDepartmentChange(e.target.value)
          }
          className="max-w-xs"
        >
          {DEPARTMENT_FILTER_OPTIONS.map((dept) => (
            <option key={dept} value={dept}>
              {dept === "All"
                ? "All Departments"
                : dept}
            </option>
          ))}
        </Select>

        <Select
          value={semesterFilter}
          onChange={(e) =>
            handleSemesterChange(e.target.value)
          }
          className="max-w-[140px]"
        >
          {SEMESTERS.map((sem) => (
            <option key={sem} value={sem}>
              {sem === "All"
                ? "All Semesters"
                : `Semester ${sem}`}
            </option>
          ))}
        </Select>

        <Button
          onClick={handleSearch}
          className="bg-blue-600"
        >
          Search
        </Button>
      </div>

      {students.length === 0 && !loading ? (
        <EmptyState message="No students found" />
      ) : students.length === 0 && loading ? (
        <Loader />
      ) : (
        <Table
          columns={[
            "Student Code",
            "Name",
            "Email",
            "Phone",
            "Department",
            "Semester",
            "Actions"
          ]}
        >
          {students.map((student) => (

            <tr key={student.id} className="border-t">

              <td className="p-3">
                {student.student_code}
              </td>

              <td className="p-3">
                {student.full_name}
              </td>

              <td className="p-3">
                {student.email}
              </td>

              <td className="p-3">
                {student.phone_number ?? "—"}
              </td>

              <td className="p-3">
                {student.department}
              </td>

              <td className="p-3">
                {student.semester}
              </td>

              <td className="p-3">
                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      handleEdit(student)
                    }
                    className="bg-amber-500 px-3 py-1 text-sm"
                  >
                    Edit
                  </Button>

                  <Button
                    onClick={() =>
                      setConfirmDelete(student.id)
                    }
                    className="bg-red-600 px-3 py-1 text-sm"
                  >
                    Delete
                  </Button>
                </div>
              </td>

            </tr>

          ))}
        </Table>
      )}

      <div className="mt-6 flex gap-4 items-center">
        <Button
          disabled={page === 0}
          onClick={() =>
            setPage(page - 1)
          }
          className="bg-slate-600"
        >
          Previous
        </Button>

        <span className="text-gray-600">
          Page {page + 1}
        </span>

        <Button
          disabled={
            (page + 1) * limit >= totalCount
          }
          onClick={() =>
            setPage(page + 1)
          }
          className="bg-slate-600"
        >
          Next
        </Button>
      </div>

      <StudentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingStudentId(null)
          setSemesterError("")
          setPhoneError("")
          setForm(resetForm())
        }}
        onSubmit={handleSubmit}
        form={form}
        setForm={setForm}
        editingStudentId={editingStudentId}
        semesterError={semesterError}
        setSemesterError={setSemesterError}
        phoneError={phoneError}
        setPhoneError={setPhoneError}
        parsePhone={parsePhone}
        submitting={submitting}
      />

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Student"
        message="Delete this student? This action cannot be undone."
        onConfirm={() =>
          handleDelete(confirmDelete)
        }
        onCancel={() =>
          setConfirmDelete(null)
        }
      />

    </DashboardLayout>
  )
}

export default StudentsPage
