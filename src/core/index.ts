// Re-export polkadot types
export { SignedBlock, Header, Extrinsic } from "@polkadot/types/interfaces"
export { KeyringPair } from "@polkadot/keyring/types"
export { Keyring } from "@polkadot/api"
export { BN, hexToU8a, u8aToHex, compactFromU8a, bnToU8a, compactAddLength, compactToU8a } from "@polkadot/util"
export { cryptoWaitReady, decodeAddress, encodeAddress } from "@polkadot/util-crypto"
export { GenericExtrinsic } from "@polkadot/types"

export { AvailHeader } from "./../helpers/index"

// Local types
export * as avail from "./chain_types"
export * as rpc from "./rpc/index"
export * as systemRpc from "./rpc/system"
export * from "./accounts"
export * as types from "./types"
export { GeneralError } from "./error"
export { Decoder } from "./decoder"
export { Encoder } from "./encoder"
export { DecodedTransaction, OpaqueTransaction, TransactionCall, TransactionCallDecoded } from "./decoded_transaction"
export {
  Decodable,
  Encodable,
  HasEventEmittedIndex,
  HasTxDispatchIndex,
  EventCodec,
  TransactionCallCodec,
} from "./codec"
export {
  TransactionSigned,
  TransactionLocation,
  TransactionExtra,
  BlockLocation,
  H256,
  AccountId,
  AccountData,
  MultiAddress,
  MultiSignature,
  DispatchError,
  DispatchInfo,
  DispatchResult,
  ProxyType,
  Weight,
  HashNumber,
  Mortality,
  SignatureOptions,
  RefinedOptions,
  BlockState,
  BlockId,
  AccountInfo,
} from "./types"
export * from "./codec_types"
export { Hex, Utils, OS, Duration } from "./utils"
