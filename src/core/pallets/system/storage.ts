import { makeStorageMap, makeStorageValue } from "./../storage"
import { Decoder, U32 } from "./../../scale"
import { AccountId, AccountInfo, PerDispatchClassWeight, StorageHasher } from "../../metadata"

export class Account extends makeStorageMap<AccountId, AccountInfo>({
  PALLET_NAME: "System",
  STORAGE_NAME: "Account",
  KEY_HASHER: "Blake2_128Concat",
  decodeKey: AccountId.decode,
  encodeKey: AccountId.encode,
  decodeValue: AccountInfo.decode,
}) {}

export class EventCount extends makeStorageValue<number>({
  PALLET_NAME: "System",
  STORAGE_NAME: "EventCount",
  decodeValue: U32.decode,
}) {}

export class BlockWeight extends makeStorageValue<PerDispatchClassWeight>({
  PALLET_NAME: "System",
  STORAGE_NAME: "BlockWeight",
  decodeValue: PerDispatchClassWeight.decode,
}) {}
