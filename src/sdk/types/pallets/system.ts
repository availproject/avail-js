import { Encoder, Decoder } from "./../scale"
import ClientError from "../../error"
import { mergeArrays } from "../../utils"
import { AccountId, AccountInfo, DispatchError, DispatchInfo } from "./../metadata"
import { addPalletInfo, makeStorageMap, StorageHasher } from "../../interface"

export const PALLET_NAME: string = "system"
export const PALLET_ID: number = 0

export namespace storage {
  export class Account extends makeStorageMap<AccountId, AccountInfo>({
    PALLET_NAME: "System",
    STORAGE_NAME: "Account",
    KEY_HASHER: new StorageHasher("Blake2_128Concat"),
    decodeKey: AccountId.decode,
    encodeKey: AccountId.encode,
    decodeValue: AccountInfo.decode,
  }) {}
}

export namespace events {
  export class ExtrinsicSuccess extends addPalletInfo(PALLET_ID, 0) {
    constructor(public dispatchInfo: DispatchInfo) {
      super()
    }

    static decode(decoder: Decoder): ExtrinsicSuccess | ClientError {
      const dispatchInfo = decoder.any1(DispatchInfo)
      if (dispatchInfo instanceof ClientError) return dispatchInfo

      return new ExtrinsicSuccess(dispatchInfo)
    }

    encode(): Uint8Array {
      return Encoder.any1(this.dispatchInfo)
    }
  }

  export class ExtrinsicFailed extends addPalletInfo(PALLET_ID, 1) {
    constructor(
      public dispatchError: DispatchError,
      public dispatchInfo: DispatchInfo,
    ) {
      super()
    }

    static decode(decoder: Decoder): ExtrinsicFailed | ClientError {
      const dispatchError = decoder.any1(DispatchError)
      if (dispatchError instanceof ClientError) return dispatchError

      const dispatchInfo = decoder.any1(DispatchInfo)
      if (dispatchInfo instanceof ClientError) return dispatchInfo

      return new ExtrinsicFailed(dispatchError, dispatchInfo)
    }

    encode(): Uint8Array {
      return mergeArrays([Encoder.any1(this.dispatchError), Encoder.any1(this.dispatchInfo)])
    }
  }
}

export namespace tx {
  export class Remark extends addPalletInfo(PALLET_ID, 0) {
    constructor(
      public remark: Uint8Array, // Vec<u8>,
    ) {
      super()
    }

    static decode(decoder: Decoder): Remark | ClientError {
      const remark = decoder.vecU8()
      if (remark instanceof ClientError) return remark

      return new Remark(remark)
    }

    encode(): Uint8Array {
      return Encoder.vecU8(this.remark)
    }
  }

  export class SetCode extends addPalletInfo(PALLET_ID, 2) {
    constructor(
      public code: Uint8Array, // Vec<u8>,
    ) {
      super()
    }

    static decode(decoder: Decoder): SetCode | ClientError {
      const code = decoder.vecU8()
      if (code instanceof ClientError) return code

      return new SetCode(code)
    }

    encode(): Uint8Array {
      return Encoder.vecU8(this.code)
    }
  }

  export class SetCodeWithoutChecks extends addPalletInfo(PALLET_ID, 3) {
    constructor(
      public code: Uint8Array, // Vec<u8>,
    ) {
      super()
    }

    static decode(decoder: Decoder): SetCodeWithoutChecks | ClientError {
      const code = decoder.vecU8()
      if (code instanceof ClientError) return code

      return new SetCodeWithoutChecks(code)
    }

    encode(): Uint8Array {
      return Encoder.vecU8(this.code)
    }
  }

  export class RemarkWithEvent extends addPalletInfo(PALLET_ID, 7) {
    constructor(
      public remark: Uint8Array, // Vec<u8>,
    ) {
      super()
    }

    static decode(decoder: Decoder): RemarkWithEvent | ClientError {
      const remark = decoder.vecU8()
      if (remark instanceof ClientError) return remark

      return new RemarkWithEvent(remark)
    }

    encode(): Uint8Array {
      return Encoder.vecU8(this.remark)
    }
  }
}
