import LoginPage from "./LoginPage"
import {
  renderWithProviders,
  screen,
  waitFor,
} from "../../test-utils"
import userEvent from "@testing-library/user-event"

const mockLogin = jest.fn()
const mockNavigate = jest.fn()

jest.mock("../../context/useAuth", () => ({
  useAuth: () => ({
    login: mockLogin,
    logout: jest.fn(),
    user: null,
    loading: false,
  }),
}))

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}))

describe("LoginPage", () => {
  beforeEach(() => {
    mockLogin.mockReset()
    mockNavigate.mockReset()
  })

  it("renders the login form", () => {
    renderWithProviders(<LoginPage />)

    expect(screen.getByText("LearnSphere")).toBeInTheDocument()
    expect(
      screen.getByText("Sign in to your account")
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /login/i })
    ).toBeInTheDocument()
  })

  it("shows an error when login fails", async () => {
    mockLogin.mockRejectedValue(new Error("Invalid credentials"))
    const user = userEvent.setup()

    renderWithProviders(<LoginPage />)

    await user.type(
      screen.getByPlaceholderText("Email"),
      "wrong@test.com"
    )
    await user.type(
      screen.getByPlaceholderText("Password"),
      "badpassword"
    )
    await user.click(screen.getByRole("button", { name: /login/i }))

    expect(
      await screen.findByText("Invalid email or password")
    ).toBeInTheDocument()
  })

  it("redirects admin users to /admin after login", async () => {
    mockLogin.mockResolvedValue({ role: "admin", email: "admin@test.com" })
    const user = userEvent.setup()

    renderWithProviders(<LoginPage />)

    await user.type(
      screen.getByPlaceholderText("Email"),
      "admin@test.com"
    )
    await user.type(
      screen.getByPlaceholderText("Password"),
      "secret12"
    )
    await user.click(screen.getByRole("button", { name: /login/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/admin")
    })
  })

  it("redirects student users to /student after login", async () => {
    mockLogin.mockResolvedValue({
      role: "student",
      email: "student@test.com",
    })
    const user = userEvent.setup()

    renderWithProviders(<LoginPage />)

    await user.type(
      screen.getByPlaceholderText("Email"),
      "student@test.com"
    )
    await user.type(
      screen.getByPlaceholderText("Password"),
      "secret12"
    )
    await user.click(screen.getByRole("button", { name: /login/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/student")
    })
  })

  it("calls login with entered email and password", async () => {
    mockLogin.mockResolvedValue({ role: "admin" })
    const user = userEvent.setup()

    renderWithProviders(<LoginPage />)

    await user.type(
      screen.getByPlaceholderText("Email"),
      "user@test.com"
    )
    await user.type(
      screen.getByPlaceholderText("Password"),
      "mypassword"
    )
    await user.click(screen.getByRole("button", { name: /login/i }))

    expect(mockLogin).toHaveBeenCalledWith(
      "user@test.com",
      "mypassword"
    )
  })
})
