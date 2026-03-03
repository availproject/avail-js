import { RetryPolicy } from "../types"

export interface ConnectionOptions {
  transport?: "http" | "ws"
  retryPolicy?: RetryPolicy
}
