import { RetryPolicy } from "../../types"
import { isRetryableError } from "../../errors/sdk-error"
import { rethrowAsSdkError } from "../result/unwrap"
import { ErrorOperation } from "../../errors/operations"

export interface RetryConfig {
  policy: RetryPolicy
  inherited: boolean
  intervalsMs?: number[]
}

export async function executeWithRetry<T>(config: RetryConfig, op: () => Promise<T>): Promise<T> {
  let shouldRetry
  if (config.policy == "disabled") {
    shouldRetry = false
  } else if (config.policy == "enabled") {
    shouldRetry = true
  } else {
    shouldRetry = config.inherited
  }

  const intervals = config.intervalsMs ?? [1000, 2000, 3000, 5000, 8000]

  let index = 0
  while (true) {
    try {
      return await op()
    } catch (error) {
      if (!shouldRetry || !isRetryableError(error) || index >= intervals.length) {
        rethrowAsSdkError(error, ErrorOperation.RetryExecute, {
          retryAttempt: index,
          maxAttempts: intervals.length,
        })
      }
      await new Promise((resolve) => setTimeout(resolve, intervals[index]))
      index += 1
    }
  }
}
