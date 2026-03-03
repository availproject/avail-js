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
