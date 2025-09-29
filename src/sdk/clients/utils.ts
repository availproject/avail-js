import { ClientError } from "../error"
import { Duration, sleep } from "../utils"
import { log } from "../log"

export async function withRetryOnError<T>(
  op: () => Promise<T | ClientError>,
  retry: boolean,
): Promise<T | ClientError> {
  const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

  while (true) {
    const result = await op()
    if (!(result instanceof ClientError)) return result
    if (retry == false || durations.length == 0) return result

    const duration = durations.pop()!
    log.warn(
      `Error: ${result.toString()}. Going to sleep for ${duration.value / 1000} seconds and then another attempt will be made`,
    )
    await sleep(duration)
  }
}

export async function withRetryOnErrorAndNone<T>(
  op: () => Promise<T | null | ClientError>,
  onError: boolean,
  onNone: boolean,
): Promise<T | null | ClientError> {
  const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

  while (true) {
    const result = await op()
    if (result instanceof ClientError) {
      if (onError == false || durations.length == 0) return result
      const duration = durations.pop()!
      log.warn(
        `Error: ${result.toString()}. Going to sleep for ${duration.value / 1000} seconds and then another attempt will be made`,
      )
      await sleep(duration)
      continue
    }

    if (result == null) {
      if (onNone == false || durations.length == 0) return result
      const duration = durations.pop()!
      log.warn(`TODO`)
      await sleep(duration)
      continue
    }

    return result
  }
}
