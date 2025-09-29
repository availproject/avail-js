import { AvailError, core } from "./."
import { log } from "./log"

export async function withRetryOnError<T>(op: () => Promise<T | AvailError>, retry: boolean): Promise<T | AvailError> {
  const durations = [8, 5, 3, 2, 1].map((x) => core.Duration.fromSecs(x))

  while (true) {
    const result = await op()
    if (!(result instanceof AvailError)) return result
    if (retry == false || durations.length == 0) return result

    const duration = durations.pop()!
    log.warn(
      `Error: ${result.toString()}. Going to sleep for ${duration.value / 1000} seconds and then another attempt will be made`,
    )
    await core.sleep(duration)
  }
}

export async function withRetryOnErrorAndNone<T>(
  op: () => Promise<T | null | AvailError>,
  onError: boolean,
  onNone: boolean,
): Promise<T | null | AvailError> {
  const durations = [8, 5, 3, 2, 1].map((x) => core.Duration.fromSecs(x))

  while (true) {
    const result = await op()
    if (result instanceof AvailError) {
      if (onError == false || durations.length == 0) return result
      const duration = durations.pop()!
      log.warn(
        `Error: ${result.toString()}. Going to sleep for ${duration.value / 1000} seconds and then another attempt will be made`,
      )
      await core.sleep(duration)
      continue
    }

    if (result == null) {
      if (onNone == false || durations.length == 0) return result
      const duration = durations.pop()!
      log.warn(`TODO`)
      await core.sleep(duration)
      continue
    }

    return result
  }
}
