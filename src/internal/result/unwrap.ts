import { RpcError, SdkError, TransportError } from "../../errors/sdk-error"
import { ErrorOperation } from "../../errors/operations"
import type { ErrorOperation as ErrorOperationType } from "../../errors/operations"

type RpcLike = { code: number; message: string; data?: unknown }

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

  if (error instanceof Error) {
    return new TransportError(error.message, { operation, cause: error, details })
  }

  return new TransportError(String(error), { operation, cause: error, details })
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
