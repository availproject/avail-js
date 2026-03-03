import { executeWithRetry } from "../../src/internal/retry/execute"
import { ValidationError } from "../../src/errors/sdk-error"
import { TransactionReceipt } from "../../src/submission/submitted"
import { Sub } from "../../src/subscription/sub"
import { BlockQueryMode } from "../../src/types/block-query-mode"
import { RetryPolicy } from "../../src/types/retry-policy"

describe("v2 behavior parity", () => {
  it("uses rust-style retry backoff intervals", async () => {
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
    await executeWithRetry({ policy: "enabled", inherited: true }, async () => {
      attempts += 1
      if (attempts < 6) {
        throw new Error("transient")
      }
      return "ok"
    })

    expect(observed).toEqual([1000, 2000, 3000, 5000, 8000])

    timeoutSpy.mockRestore()
    jest.useRealTimers()
  })

  it("does not retry when retry policy is disabled", async () => {
    const timeoutSpy = jest.spyOn(global, "setTimeout")

    await expect(
      executeWithRetry({ policy: "disabled", inherited: true }, async () => {
        throw new Error("boom")
      }),
    ).rejects.toThrow("boom")

    expect(timeoutSpy).not.toHaveBeenCalled()
    timeoutSpy.mockRestore()
  })

  it("validates receipt block range boundaries", async () => {
    const fakeClient = {
      chain: () => ({
        systemFetchExtrinsics: async () => [],
      }),
    }

    await expect(TransactionReceipt.fromRange(fakeClient as never, "0x1", 10, 5)).rejects.toBeInstanceOf(
      ValidationError,
    )
  })

  it("uses finalized mode by default in receipt search", async () => {
    const setMode = jest.fn()
    const setHeight = jest.fn()
    const setPollInterval = jest.fn()
    const next = jest
      .fn()
      .mockResolvedValueOnce({ hash: "0xaaa", height: 3 })
      .mockResolvedValueOnce({ hash: "0xbbb", height: 4 })

    const subMock = {
      setBlockQueryMode: setMode,
      setBlockHeight: setHeight,
      setPollInterval,
      next,
    }

    const fromClientSpy = jest.spyOn(Sub, "fromClient").mockReturnValue(subMock as never)

    const fakeClient = {
      chain: () => ({
        systemFetchExtrinsics: async () => [],
      }),
    }

    const receipt = await TransactionReceipt.fromRange(fakeClient as never, "0x1", 3, 3)
    expect(receipt).toBeNull()
    expect(setMode).toHaveBeenCalledWith("finalized")
    expect(setHeight).toHaveBeenCalledWith(3)

    fromClientSpy.mockRestore()
  })
})
