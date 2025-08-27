import { Decoder } from "../../scale"
import { AccountId, AccountInfo } from "../../metadata"
import { makeStorageMap, StorageHasher } from "../../../interface"

export class Account extends makeStorageMap<AccountId, AccountInfo>({
  PALLET_NAME: "System",
  STORAGE_NAME: "Account",
  KEY_HASHER: new StorageHasher("Blake2_128Concat"),
  decodeKey: AccountId.decode,
  encodeKey: AccountId.encode,
  decodeValue: AccountInfo.decode,
}) {}
