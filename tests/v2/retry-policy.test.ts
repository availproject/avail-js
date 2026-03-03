import { RetryPolicy, resolveRetryPolicy } from "../../src/types/retry-policy"

describe("v2 retry policy", () => {
  it("resolves inherit from parent setting", () => {
    expect(resolveRetryPolicy("inherit", true)).toBe(true)
    expect(resolveRetryPolicy("inherit", false)).toBe(false)
  })

  it("maps explicit policies", () => {
    expect(resolveRetryPolicy("enabled", false)).toBe(true)
    expect(resolveRetryPolicy("disabled", true)).toBe(false)
  })
})
