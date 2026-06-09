import Input from "./Input"
import { render, screen } from "@testing-library/react"

describe("Input component validation", () => {
  it("supports email and password input types", () => {
    render(
      <>
        <Input type="email" placeholder="Email" />
        <Input type="password" placeholder="Password" />
      </>
    )

    expect(screen.getByPlaceholderText("Email")).toHaveAttribute(
      "type",
      "email"
    )
    expect(screen.getByPlaceholderText("Password")).toHaveAttribute(
      "type",
      "password"
    )
  })

  it("passes through additional props", () => {
    render(
      <Input
        type="text"
        placeholder="Name"
        required
        minLength={2}
      />
    )

    const input = screen.getByPlaceholderText("Name")
    expect(input).toBeRequired()
    expect(input).toHaveAttribute("minLength", "2")
  })
})
