import type { Mortality, SignatureOptions } from "../core/metadata"
import type { BN } from "../core/polkadot"

export class Options {
  private readonly value: SignatureOptions

  constructor() {
    this.value = {}
  }

  static new(): Options {
    return new Options()
  }

  appId(value: number): Options {
    this.value.app_id = value
    return this
  }

  mortality(value: Mortality): Options {
    this.value.mortality = value
    return this
  }

  nonce(value: number): Options {
    this.value.nonce = value
    return this
  }

  tip(value: BN): Options {
    this.value.tip = value
    return this
  }

  toSignatureOptions(): SignatureOptions {
    return { ...this.value }
  }
}

export function normalizeSignatureOptions(options?: SignatureOptions | Options): SignatureOptions | undefined {
  if (options == null) return undefined
  if (options instanceof Options) return options.toSignatureOptions()
  return options
}
