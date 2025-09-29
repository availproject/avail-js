export { sleep, Duration, Hex, generateMultisig, mergeArrays } from "./utils"
export * as rpc from "./rpc"
export * as types from "./types"
export * as constants from "./constants"
export * as accounts from "./accounts"
export * as avail from "./types/pallets"
export * as metadata from "./types/metadata"
export * as polkadot from "./types/polkadot"

export {
  AccountId,
  AccountInfo,
  MultiAddress,
  MultiAddressValue,
  MultiSignature,
  MultiSignatureValue,
  H256,
  AccountData,
  SessionKeys,
  ExtrinsicSignature,
  SignedExtra,
  SignatureOptions,
} from "./types/metadata"
export { AvailHeader } from "./types/extension"
export { BN, ApiPromise, RuntimeVersion, SignedBlock } from "./types/polkadot"
export { BlockInfo, ChainInfo } from "./rpc/system"
export { GrandpaJustification, GrandpaCommit, GrandpaPrecommit, GrandpaSignedPrecommit } from "./rpc/grandpa"
export { BlockPhaseEvent, ExtrinsicInfo, PhaseEvent, SignerPayload, EncodeSelector } from "./rpc"
