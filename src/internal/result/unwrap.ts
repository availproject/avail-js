import { RpcError, SdkError, TransportError } from "../../errors/sdk-error"
import { ErrorOperation } from "../../errors/operations"
import type { ErrorOperation as ErrorOperationType } from "../../errors/operations"

type LegacyErrorLike = Error & { data?: unknown }
type RpcLike = { code: number; message: string; data?: unknown }

function isLegacyAvailError(value: unknown): value is LegacyErrorLike {
  if (!(value instanceof Error)) {
    return false
  }

  return value.constructor?.name === "AvailError"
}

function isRpcLike(value: unknown): value is RpcLike {
  if (typeof value !== "object" || value == null) {
    return false
  }

  const maybe = value as Partial<RpcLike>
  return typeof maybe.code === "number" && typeof maybe.message === "string"
}

export function toSdkError(
  error: unknown,
  operation: ErrorOperationType = ErrorOperation.NormalizeThrown,
  details?: Record<string, unknown>,
): SdkError {
  if (error instanceof SdkError) {
    return error
  }

  if (isRpcLike(error)) {
    return new RpcError(error.message, {
      operation,
      cause: error,
      details: {
        ...details,
        rpcCode: error.code,
        rpcData: error.data,
      },
    })
  }

  if (isLegacyAvailError(error)) {
    if (typeof (error as LegacyErrorLike).data !== "undefined") {
      return new RpcError(error.message, {
        operation,
        cause: error,
        details: {
          ...details,
          rpcData: (error as LegacyErrorLike).data,
        },
      })
    }

    return new TransportError(error.message, { operation, cause: error, details })
  }

  if (error instanceof Error) {
    return new TransportError(error.message, { operation, cause: error, details })
  }

  return new TransportError(String(error), { operation, cause: error, details })
}

export function unwrapAvail<T>(value: T): Exclude<T, LegacyErrorLike> {
  if (isLegacyAvailError(value)) {
    throw toSdkError(value)
  }
  return value as Exclude<T, LegacyErrorLike>
}

export function unwrapAvailNullable<T>(value: T | null): Exclude<T, LegacyErrorLike> | null {
  if (isLegacyAvailError(value)) {
    throw toSdkError(value)
  }
  return value as Exclude<T, LegacyErrorLike> | null
}

export function rethrowAsSdkError(
  error: unknown,
  operation: ErrorOperationType = ErrorOperation.NormalizeThrown,
  details?: Record<string, unknown>,
): never {
  throw toSdkError(error, operation, details)
}

export function normalizeThrown(error: unknown): never {
  throw toSdkError(error)
}
