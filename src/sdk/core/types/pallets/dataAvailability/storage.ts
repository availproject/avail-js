import { StorageHasher, makeStorageMap, makeStorageValue } from "../../../interface/storage"

import { DispatchFeeModifier, H256 } from "./../../metadata"
import { CompactU32, VecU8, Decoder } from "../../scale"
import * as types from "./types"

export class NextAppId extends makeStorageValue<number>({
  PALLET_NAME: "DataAvailability",
  STORAGE_NAME: "NextAppId",
  decodeValue: CompactU32.decode,
}) {}

export class SubmitDataFeeModifier extends makeStorageValue<DispatchFeeModifier>({
  PALLET_NAME: "DataAvailability",
  STORAGE_NAME: "SubmitDataFeeModifier",
  decodeValue: DispatchFeeModifier.decode,
}) {}

export class AppKeys extends makeStorageMap<Uint8Array, types.AppKeys>({
  PALLET_NAME: "DataAvailability",
  STORAGE_NAME: "AppKeys",
  KEY_HASHER: "Blake2_128Concat",
  decodeKey: VecU8.decode,
  encodeKey: (value: Uint8Array) => value,
  decodeValue: types.AppKeys.decode,
}) {}
