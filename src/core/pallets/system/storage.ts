import { makeStorageMap, makeStorageValue } from "./../storage"
import { U32 } from "./../../scale"
import { type AccountId, type AccountInfo, type PerDispatchClassWeight } from "../../types"
import { AccountIdScale, AccountInfoScale, PerDispatchClassWeightScale } from "../../scale/types"

export class Account extends makeStorageMap<AccountId, AccountInfo>({
  PALLET_NAME: "System",
  STORAGE_NAME: "Account",
  KEY_HASHER: "Blake2_128Concat",
  decodeKey: AccountIdScale.decode,
  encodeKey: AccountIdScale.encode,
  decodeValue: AccountInfoScale.decode,
}) {}

export class EventCount extends makeStorageValue<number>({
  PALLET_NAME: "System",
  STORAGE_NAME: "EventCount",
  decodeValue: U32.decode,
}) {}

export class BlockWeight extends makeStorageValue<PerDispatchClassWeight>({
  PALLET_NAME: "System",
  STORAGE_NAME: "BlockWeight",
  decodeValue: PerDispatchClassWeightScale.decode,
}) {}
