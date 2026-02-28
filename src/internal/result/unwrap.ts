import {
  DecodeError,
  NotFoundError,
  RpcError,
  SdkError,
  TimeoutError,
  TransportError,
  ValidationError,
} from "../../errors/sdk-error"
import { ErrorOperation } from "../../errors/operations"

type LegacyErrorLike = {
  message: string
  constructor?: { name?: string }
}

function isLegacyAvailError(value: unknown): value is LegacyErrorLike {
  if (!(value instanceof Error)) {
    return false
  }

  return value.constructor?.name === "AvailError"
}

function parseLegacyRpcMessage(message: string): { code?: number; message: string; data?: string } {
  const match = /^Rpc Error\. Code:\s*(-?\d+),\s*Message:\s*(.*?)(?:,\s*Data:\s*(.*))?$/.exec(message)
  if (!match) {
    return { message }
  }

  const code = Number(match[1])
  const parsedMessage = match[2]?.trim() || message
  const data = match[3]?.trim()
  return { code: Number.isFinite(code) ? code : undefined, message: parsedMessage, data }
}

function classifyByMessage(message: string, cause: unknown): SdkError {
  if (/timeout|timed out/i.test(message)) {
    return new TimeoutError(message, { operation: ErrorOperation.NormalizeThrown, cause })
  }
  if (/not found|no .* found|missing runtime|failed to find/i.test(message)) {
    return new NotFoundError(message, { operation: ErrorOperation.NormalizeThrown, cause })
  }
  if (/invalid|malformed|validation|cannot be after|expected input/i.test(message)) {
    return new ValidationError(message, { operation: ErrorOperation.NormalizeThrown, cause })
  }
  if (/decode|decoding|codec|scale/i.test(message)) {
    return new DecodeError(message, { operation: ErrorOperation.NormalizeThrown, cause })
  }

  return new TransportError(message, { operation: ErrorOperation.NormalizeThrown, cause })
}

function fromUnknown(error: unknown): SdkError {
  if (error instanceof SdkError) return error
  if (isLegacyAvailError(error)) {
    if (error.message.startsWith("Rpc Error.")) {
      const parsed = parseLegacyRpcMessage(error.message)
      return new RpcError(parsed.message, {
        operation: ErrorOperation.NormalizeThrown,
        cause: error,
        details: {
          code: parsed.code,
          data: parsed.data,
          legacyMessage: error.message,
        },
      })
    }
    return classifyByMessage(error.message, error)
  }
  if (error instanceof Error) return classifyByMessage(error.message, error)
  return new TransportError(String(error), { operation: ErrorOperation.NormalizeThrown, cause: error })
}

export function unwrapAvail<T>(value: T): Exclude<T, LegacyErrorLike> {
  if (isLegacyAvailError(value)) {
    throw fromUnknown(value)
  }
  return value as Exclude<T, LegacyErrorLike>
}

export function unwrapAvailNullable<T>(value: T | null): Exclude<T, LegacyErrorLike> | null {
  if (isLegacyAvailError(value)) {
    throw fromUnknown(value)
  }
  return value as Exclude<T, LegacyErrorLike> | null
}

export function normalizeThrown(error: unknown): never {
  throw fromUnknown(error)
}
