import { makeStorageValue } from "../../../interface/storage"

import { BN } from "../../polkadot"
import { Decoder } from "../../scale"

export class Now extends makeStorageValue<BN>({
  PALLET_NAME: "Timestamp",
  STORAGE_NAME: "Now",
  decodeValue: (decoder: Decoder) => decoder.u64(),
}) { }

export class DidUpdate extends makeStorageValue<boolean>({
  PALLET_NAME: "Timestamp",
  STORAGE_NAME: "DidUpdate",
  decodeValue: (decoder: Decoder) => decoder.bool(),
}) { }
