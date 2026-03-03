export const ErrorCode = {
  Unknown: "UNKNOWN",
  Validation: "VALIDATION_ERROR",
  Transport: "TRANSPORT_ERROR",
  Rpc: "RPC_ERROR",
  NotFound: "NOT_FOUND",
  Timeout: "TIMEOUT",
  Decode: "DECODE_ERROR",
  EnumDecode: "ENUM_DECODE_ERROR",
  HashComputation: "HASH_COMPUTATION_ERROR",
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]
