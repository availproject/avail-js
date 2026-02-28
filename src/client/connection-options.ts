import { RetryPolicy } from "../types/retry-policy"

export interface ConnectionOptions {
  transport?: "http" | "ws"
  retryPolicy?: RetryPolicy
}
