import AdminDashboard from "./AdminDashboard"
import { render, screen, waitFor } from "@testing-library/react"

jest.mock("../../components/layout/DashboardLayout", () => {
  return function MockDashboardLayout({ children }) {
    return <div data-testid="dashboard-layout">{children}</div>
  }
})

jest.mock("../../components/charts/DepartmentChart", () => {
  return function MockDepartmentChart() {
    return <div data-testid="department-chart" />
  }
})

jest.mock("../../components/charts/SemesterChart", () => {
  return function MockSemesterChart() {
    return <div data-testid="semester-chart" />
  }
})

const mockGet = jest.fn()

jest.mock("../../api/axios", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    post: jest.fn(),
    defaults: { headers: { common: {} } },
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}))

describe("AdminDashboard", () => {
  beforeEach(() => {
    mockGet.mockReset()
  })

  it("shows a loading state initially", () => {
    mockGet.mockReturnValue(new Promise(() => {}))

    render(<AdminDashboard />)

    expect(screen.getByTestId("dashboard-layout")).toBeInTheDocument()
  })

  it("renders dashboard stats after a successful fetch", async () => {
    mockGet.mockImplementation((url) => {
      if (url === "/dashboard/stats") {
        return Promise.resolve({
          data: {
            students: 10,
            courses: 5,
            enrollments: 20,
            attendance_records: 50,
            timetable_entries: 8,
          },
        })
      }

      if (url === "/students") {
        return Promise.resolve({
          data: {
            items: [
              {
                department: "Computer Science",
                semester: 3,
              },
            ],
          },
        })
      }

      return Promise.reject(new Error("Unexpected URL"))
    })

    render(<AdminDashboard />)

    expect(
      await screen.findByText("Admin Dashboard")
    ).toBeInTheDocument()
    expect(screen.getByText("Students")).toBeInTheDocument()
    expect(screen.getByText("10")).toBeInTheDocument()
    expect(screen.getByText("Courses")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
    expect(screen.getByTestId("department-chart")).toBeInTheDocument()
    expect(screen.getByTestId("semester-chart")).toBeInTheDocument()
  })

  it("shows an error message when the API fails", async () => {
    mockGet.mockRejectedValue({
      response: { data: { detail: "Server unavailable" } },
    })

    render(<AdminDashboard />)

    expect(
      await screen.findByText("Server unavailable")
    ).toBeInTheDocument()
  })

  it("calls dashboard and student list endpoints", async () => {
    mockGet.mockImplementation((url) => {
      if (url === "/dashboard/stats") {
        return Promise.resolve({
          data: {
            students: 0,
            courses: 0,
            enrollments: 0,
            attendance_records: 0,
            timetable_entries: 0,
          },
        })
      }

      return Promise.resolve({ data: { items: [] } })
    })

    render(<AdminDashboard />)

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith("/dashboard/stats")
      expect(mockGet).toHaveBeenCalledWith("/students", {
        params: { skip: 0, limit: 100 },
      })
    })
  })
})
