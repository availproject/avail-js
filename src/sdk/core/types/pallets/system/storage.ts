import { makeStorageMap, StorageHasher } from "../../../interface"

import { Decoder } from "../../scale"
import { AccountId, AccountInfo } from "../../metadata"

export class Account extends makeStorageMap<AccountId, AccountInfo>({
  PALLET_NAME: "System",
  STORAGE_NAME: "Account",
  KEY_HASHER: "Blake2_128Concat",
  decodeKey: AccountId.decode,
  encodeKey: AccountId.encode,
  decodeValue: AccountInfo.decode,
}) {}
