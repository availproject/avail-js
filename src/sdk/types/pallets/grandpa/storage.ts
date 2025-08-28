import { U32, U64, Decoder } from "../../scale"
import { makeStorageMap, makeStorageValue, StorageHasher } from "../../../interface"
import { AuthorityList, H256 } from "../../metadata"
import { BN } from "../../polkadot"
import { PALLET_NAME } from "."
import * as types from "./types"

export class SetIdSession extends makeStorageMap<BN, number>({
  PALLET_NAME,
  STORAGE_NAME: "SetIdSession",
  KEY_HASHER: "Twox64Concat",
  decodeKey: U64.decode,
  encodeKey: (value: BN) => new U64(value).encode(),
  decodeValue: U32.decode,
}) {}

export class CurrentSetId extends makeStorageValue<BN>({
  PALLET_NAME,
  STORAGE_NAME: "CurrentSetId",
  decodeValue: U64.decode,
}) {}

export class Authorities extends makeStorageValue<AuthorityList>({
  PALLET_NAME,
  STORAGE_NAME: "Authorities",
  decodeValue: AuthorityList.decode,
}) {}

export class PendingChange extends makeStorageValue<types.StoredPendingChange>({
  PALLET_NAME,
  STORAGE_NAME: "PendingChange",
  decodeValue: types.StoredPendingChange.decode,
}) {}

export class StoredState extends makeStorageValue<types.StoredState>({
  PALLET_NAME,
  STORAGE_NAME: "StoredState",
  decodeValue: types.StoredState.decode,
}) {}

export class NextForced extends makeStorageValue<number>({
  PALLET_NAME,
  STORAGE_NAME: "NextForced",
  decodeValue: U32.decode,
}) {}

export class Stalled extends makeStorageValue<[number, number]>({
  PALLET_NAME,
  STORAGE_NAME: "NextForced",
  decodeValue: (decoder) => decoder.any2(U32, U32),
}) {}
