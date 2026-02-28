import { executeWithRetry } from "../../src/internal/retry/execute"
import { RetryPolicy } from "../../src/types/retry-policy"

describe("v2 retry execution", () => {
  it("uses ascending retry backoff intervals", async () => {
    jest.useFakeTimers()

    const observed: number[] = []
    const timeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation(((
      fn: (...args: unknown[]) => void,
      ms?: number,
    ) => {
      observed.push((ms ?? 0) as number)
      fn()
      return 0 as unknown as NodeJS.Timeout
    }) as typeof setTimeout)

    let attempts = 0
    await executeWithRetry({ policy: RetryPolicy.Enabled, inherited: true }, async () => {
      attempts += 1
      if (attempts < 3) {
        throw new Error("transient")
      }
      return "ok"
    })

    expect(observed).toEqual([1000, 2000])

    timeoutSpy.mockRestore()
    jest.useRealTimers()
  })
})
