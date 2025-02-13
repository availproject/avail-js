import { BN } from "."

export interface TransactionOptions {
  app_id?: number
  nonce?: number
  tip?: BN
}