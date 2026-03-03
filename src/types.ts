import { H256 } from "./core/metadata"
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

export function toH256(value: H256 | string): H256 {
  const parsed = H256.from(value)
  if (parsed instanceof Error) {
    throw new ValidationError(parsed.message, {
      details: { value },
      cause: parsed,
    })
  }

  return parsed
}


export function toH256OrNumber(value: H256 | number | string): H256 | number {
  if (typeof value == "number") {
    return value
  }

  return toH256(value)
}
