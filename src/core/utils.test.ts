import { formatNumberToBalance } from "./utils"

describe("formatNumberToBalance", () => {
  it("converts positive decimals to base units", () => {
    expect(formatNumberToBalance(1.5, 2).toString()).toBe("150")
  })

  it("converts negative decimals to base units", () => {
    expect(formatNumberToBalance(-1.5, 2).toString()).toBe("-150")
  })
})
