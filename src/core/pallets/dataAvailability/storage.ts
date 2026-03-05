import { makeStorageMap, makeStorageValue } from "./../storage"
import { DispatchFeeModifier } from "./../../types"
import { CompactU32, VecU8, Decoder } from "./../../scale"
import * as types from "./types"
import { DispatchFeeModifierScale } from "../../scale/types"

export class NextAppId extends makeStorageValue<number>({
  PALLET_NAME: "DataAvailability",
  STORAGE_NAME: "NextAppId",
  decodeValue: CompactU32.decode,
}) {}

export class SubmitDataFeeModifier extends makeStorageValue<DispatchFeeModifier>({
  PALLET_NAME: "DataAvailability",
  STORAGE_NAME: "SubmitDataFeeModifier",
  decodeValue: DispatchFeeModifierScale.decode,
}) {}

export class AppKeys extends makeStorageMap<Uint8Array, types.AppKeys>({
  PALLET_NAME: "DataAvailability",
  STORAGE_NAME: "AppKeys",
  KEY_HASHER: "Blake2_128Concat",
  decodeKey: VecU8.decode,
  encodeKey: (value: Uint8Array) => value,
  decodeValue: types.AppKeys.decode,
}) {}
