import StudentTimetablePage from "./StudentTimetablePage"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

jest.mock("../../components/layout/DashboardLayout", () => {
  return function MockDashboardLayout({ children }) {
    return <div data-testid="dashboard-layout">{children}</div>
  }
})

jest.mock("../../components/timetables/WeekTimetableGrid", () => {
  return function MockWeekTimetableGrid({ entries }) {
    return (
      <div data-testid="week-grid">
        {entries.length} entries
      </div>
    )
  }
})

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock("../../utils/downloadFile", () => ({
  downloadFromApi: jest.fn(() => Promise.resolve()),
}))

const mockGet = jest.fn()

jest.mock("../../api/axios", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    defaults: { headers: { common: {} } },
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}))

const sampleTimetable = {
  student: {
    full_name: "Test Student",
    department: "Computer Science",
    semester: 3,
    student_code: "STU001",
  },
  total_credits: 6,
  schedule_group: { label: "Semester 3 Schedule" },
  entries: [
    {
      timetable_id: 1,
      course_id: 1,
      course_code: "CS101",
      course_title: "Intro to Programming",
      day_of_week: "Monday",
      start_time: "09:00",
      end_time: "10:30",
      room_number: "A101",
      instructor_name: "Dr. Smith",
    },
  ],
}

describe("StudentTimetablePage", () => {
  beforeEach(() => {
    mockGet.mockReset()
  })

  it("shows loading state while fetching timetable", () => {
    mockGet.mockReturnValue(new Promise(() => {}))

    render(<StudentTimetablePage />)

    expect(screen.getByTestId("dashboard-layout")).toBeInTheDocument()
  })

  it("shows an error when timetable fetch fails", async () => {
    mockGet.mockRejectedValue(new Error("Network error"))

    render(<StudentTimetablePage />)

    expect(
      await screen.findByText("Could not load your timetable")
    ).toBeInTheDocument()
  })

  it("renders timetable entries when data loads", async () => {
    mockGet.mockResolvedValue({ data: sampleTimetable })

    render(<StudentTimetablePage />)

    expect(
      await screen.findByText("My Timetable")
    ).toBeInTheDocument()
    expect(screen.getByText(/Test Student/)).toBeInTheDocument()
    expect(screen.getByText("CS101")).toBeInTheDocument()
    expect(screen.getByTestId("week-grid")).toHaveTextContent("1 entries")
  })

  it("shows empty state when student has no classes", async () => {
    mockGet.mockResolvedValue({
      data: {
        ...sampleTimetable,
        entries: [],
      },
    })

    render(<StudentTimetablePage />)

    expect(
      await screen.findByText(
        "No classes scheduled for your enrolled courses"
      )
    ).toBeInTheDocument()
  })

  it("fetches timetable from /timetables/me", async () => {
    mockGet.mockResolvedValue({
      data: { ...sampleTimetable, entries: [] },
    })

    render(<StudentTimetablePage />)

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith("/timetables/me")
    })
  })

  it("triggers export when calendar button is clicked", async () => {
    const { downloadFromApi } = require("../../utils/downloadFile")
    mockGet.mockResolvedValue({ data: sampleTimetable })

    render(<StudentTimetablePage />)

    const user = userEvent.setup()
    const exportButton = await screen.findByRole("button", {
      name: /add to calendar/i,
    })

    await user.click(exportButton)

    await waitFor(() => {
      expect(downloadFromApi).toHaveBeenCalledWith(
        "/timetables/me/export/ics",
        "learnsphere-timetable-STU001.ics"
      )
    })
  })
})
