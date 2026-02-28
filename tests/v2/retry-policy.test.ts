import { RetryPolicy, resolveRetryPolicy } from "../../src/types/retry-policy"

describe("v2 retry policy", () => {
  it("resolves inherit from parent setting", () => {
    expect(resolveRetryPolicy(RetryPolicy.Inherit, true)).toBe(true)
    expect(resolveRetryPolicy(RetryPolicy.Inherit, false)).toBe(false)
  })

  it("maps explicit policies", () => {
    expect(resolveRetryPolicy(RetryPolicy.Enabled, false)).toBe(true)
    expect(resolveRetryPolicy(RetryPolicy.Disabled, true)).toBe(false)
  })
})
