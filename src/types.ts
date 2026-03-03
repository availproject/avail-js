import { type AccountId, H256 } from "./core/metadata"
import { ValidationError } from "./errors/sdk-error"

export enum BlockQueryMode {
  Finalized = "finalized",
  Best = "best",
}

export enum HeadKind {
  Best = "best",
  Finalized = "finalized",
}

export enum RetryPolicy {
  Inherit = "inherit",
  Enabled = "enabled",
  Disabled = "disabled",
}

export function resolveRetryPolicy(policy: RetryPolicy, inherited: boolean): boolean {
  switch (policy) {
    case RetryPolicy.Enabled:
      return true
    case RetryPolicy.Disabled:
      return false
    case RetryPolicy.Inherit:
      return inherited
  }
}

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

export function accountLikeToAddress(value: AccountLike): string {
  return typeof value == "string" ? value : value.toSS58()
}
