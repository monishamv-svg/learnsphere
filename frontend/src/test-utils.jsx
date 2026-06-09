import { render } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"

import { AuthProvider } from "./context/AuthProvider"

export function renderWithProviders(
  ui,
  { route = "/", ...options } = {}
) {
  window.history.pushState({}, "Test page", route)

  function Wrapper({ children }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    )
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

export {
  act,
  fireEvent,
  screen,
  waitFor,
  within
} from "@testing-library/react"
export { default as userEvent } from "@testing-library/user-event"
