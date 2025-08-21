import { Encoder, Decoder } from "./../scale"
import ClientError from "../../error"
import { mergeArrays } from "../../utils"
import { AccountId, AccountInfo, decodeAccountInfo, DispatchError, DispatchInfo } from "./../metadata"
import { makeStorageMap, StorageHasher } from "../../interface"

export const PALLET_NAME: string = "system"
export const PALLET_INDEX: number = 0

export namespace storage {
  export class Account extends makeStorageMap<AccountId, AccountInfo>({
    PALLET_NAME: "System",
    STORAGE_NAME: "Account",
    KEY_HASHER: new StorageHasher("Blake2_128Concat"),
    decodeKey: AccountId.decode,
    encodeKey: AccountId.encode,
    decodeValue: decodeAccountInfo,
  }) {}
}

export namespace events {
  export class ExtrinsicSuccess {
    constructor(public dispatchInfo: DispatchInfo) {}

    encode(): Uint8Array {
      return Encoder.any(this.dispatchInfo)
    }

    static emittedIndex(): [number, number] {
      return [PALLET_INDEX, 0]
    }

    emittedIndex(): [number, number] {
      return ExtrinsicSuccess.emittedIndex()
    }

    static decode(decoder: Decoder): ExtrinsicSuccess | ClientError {
      const dispatchInfo = decoder.any(DispatchInfo)
      if (dispatchInfo instanceof ClientError) return dispatchInfo

      return new ExtrinsicSuccess(dispatchInfo)
    }
  }

  export class ExtrinsicFailed {
    constructor(
      public dispatchError: DispatchError,
      public dispatchInfo: DispatchInfo,
    ) {}

    encode(): Uint8Array {
      return mergeArrays([Encoder.any(this.dispatchError), Encoder.any(this.dispatchInfo)])
    }

    static emittedIndex(): [number, number] {
      return [PALLET_INDEX, 1]
    }

    emittedIndex(): [number, number] {
      return ExtrinsicFailed.emittedIndex()
    }

    static decode(decoder: Decoder): ExtrinsicFailed | ClientError {
      const dispatchError = decoder.any(DispatchError)
      if (dispatchError instanceof ClientError) return dispatchError

      const dispatchInfo = decoder.any(DispatchInfo)
      if (dispatchInfo instanceof ClientError) return dispatchInfo

      return new ExtrinsicFailed(dispatchError, dispatchInfo)
    }
  }
}

export namespace tx {
  export class Remark {
    constructor(
      public remark: Uint8Array, // Vec<u8>,
    ) {}

    encode(): Uint8Array {
      return mergeArrays([Encoder.vecU8(this.remark)])
    }

    static dispatchIndex(): [number, number] {
      return [PALLET_INDEX, 0]
    }

    dispatchIndex(): [number, number] {
      return Remark.dispatchIndex()
    }

    static decode(decoder: Decoder): Remark | ClientError {
      const remark = decoder.vecU8()
      if (remark instanceof ClientError) return remark

      return new Remark(remark)
    }
  }

  export class SetCode {
    constructor(
      public code: Uint8Array, // Vec<u8>,
    ) {}

    encode(): Uint8Array {
      return mergeArrays([Encoder.vecU8(this.code)])
    }

    static dispatchIndex(): [number, number] {
      return [PALLET_INDEX, 2]
    }

    dispatchIndex(): [number, number] {
      return SetCode.dispatchIndex()
    }

    static decode(decoder: Decoder): SetCode | ClientError {
      const code = decoder.vecU8()
      if (code instanceof ClientError) return code

      return new SetCode(code)
    }
  }

  export class SetCodeWithoutChecks {
    constructor(
      public code: Uint8Array, // Vec<u8>,
    ) {}

    encode(): Uint8Array {
      return mergeArrays([Encoder.vecU8(this.code)])
    }

    static dispatchIndex(): [number, number] {
      return [PALLET_INDEX, 3]
    }

    dispatchIndex(): [number, number] {
      return SetCodeWithoutChecks.dispatchIndex()
    }

    static decode(decoder: Decoder): SetCodeWithoutChecks | ClientError {
      const code = decoder.vecU8()
      if (code instanceof ClientError) return code

      return new SetCodeWithoutChecks(code)
    }
  }

  export class RemarkWithEvent {
    constructor(
      public remark: Uint8Array, // Vec<u8>,
    ) {}

    encode(): Uint8Array {
      return mergeArrays([Encoder.vecU8(this.remark)])
    }

    static dispatchIndex(): [number, number] {
      return [PALLET_INDEX, 7]
    }

    dispatchIndex(): [number, number] {
      return RemarkWithEvent.dispatchIndex()
    }

    static decode(decoder: Decoder): RemarkWithEvent | ClientError {
      const remark = decoder.vecU8()
      if (remark instanceof ClientError) return remark

      return new RemarkWithEvent(remark)
    }
  }
}
