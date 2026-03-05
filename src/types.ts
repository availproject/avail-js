import { AccountId, H256, MultiAddress } from "./core/types"
import { ValidationError } from "./errors/sdk-error"

export type BlockQueryMode = "finalized" | "best"
export type RetryPolicy = "inherit" | "enabled" | "disabled"

export enum TracingFormat {
  Plain = "plain",
  Json = "json",
}

export function stringToHash(value: HashLike): H256 {
  const parsed = H256.from(value)
  if (parsed instanceof Error) {
    throw new ValidationError(parsed.message, {
      details: { value },
      cause: parsed,
    })
  }

  return parsed
}

export function blockAtToHashOrNumber(value: BlockAt): H256 | number {
  if (typeof value == "number") {
    return value
  }

  return stringToHash(value)
}

export type AccountLike = AccountId | string
export type HashLike = H256 | string
export type BlockAt = HashLike | number

export function ToSS58Address(value: AccountLike): string {
  return typeof value == "string" ? value : value.toSS58()
}

export function toMultiAddress(value: AccountLike | MultiAddress): MultiAddress {
  if (value instanceof AccountId) {
    return { Id: value }
  }
  if (typeof value == "string") {
    return { Id: AccountId.from(value) }
  }

  return value
}
