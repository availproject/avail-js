import { makeStorageMap } from "./../storage"
import { Decoder } from "./../../scale"
import { AccountId, AccountInfo, StorageHasher } from "../../metadata"

export class Account extends makeStorageMap<AccountId, AccountInfo>({
  PALLET_NAME: "System",
  STORAGE_NAME: "Account",
  KEY_HASHER: "Blake2_128Concat",
  decodeKey: AccountId.decode,
  encodeKey: AccountId.encode,
  decodeValue: AccountInfo.decode,
}) {}
