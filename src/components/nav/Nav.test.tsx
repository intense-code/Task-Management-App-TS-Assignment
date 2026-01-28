import { render, screen } from "@testing-library/react"
import AppNav from "./Nav"

const noop = () => {}

describe("AppNav", () => {
  it("renders skin selector options", () => {
    render(<AppNav skin="classic" setSkin={noop} />)

    expect(screen.getByLabelText(/skin/i)).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /classic/i })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /sunset/i })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /mint/i })).toBeInTheDocument()
  })
})
