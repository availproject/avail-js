import type {
  EncodeSelector,
  ExtrinsicFilterOptions,
  Options as RpcExtrinsicOptions,
} from "../core/rpc/system/fetch_extrinsics"

export type ExtrinsicOptions = {
  filter?: ExtrinsicFilterOptions
  ss58Address?: string
  appId?: number
  nonce?: number
}

export function toRpcOptions(opts: ExtrinsicOptions, encodeAs: EncodeSelector): RpcExtrinsicOptions {
  return { appId: opts.appId, filter: opts.filter, nonce: opts.nonce, ss58Address: opts.ss58Address, encodeAs }
}
