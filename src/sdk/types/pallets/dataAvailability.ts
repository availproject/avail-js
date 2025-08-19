import { Encoder, Decoder } from "./../scale"
import ClientError from "../../error"
import { mergeArrays } from "../../utils"
import { AccountId, H256 } from "./../metadata"

export const PALLET_NAME: string = "dataAvailability"
export const PALLET_INDEX: number = 29

export namespace events {
  export class ApplicationKeyCreated {
    constructor(
      public key: Uint8Array,
      public owner: AccountId,
      public id: number, // u32
    ) {}

    encode(): Uint8Array {
      return mergeArrays([Encoder.vecU8(this.key), Encoder.any(this.owner), Encoder.u32(this.id)])
    }

    static emittedIndex(): [number, number] {
      return [PALLET_INDEX, 0]
    }

    emittedIndex(): [number, number] {
      return ApplicationKeyCreated.emittedIndex()
    }

    static decode(decoder: Decoder): ApplicationKeyCreated | ClientError {
      const key = decoder.vecU8()
      if (key instanceof ClientError) return key

      const owner = decoder.any(AccountId)
      if (owner instanceof ClientError) return owner

      const id = decoder.u32()
      if (id instanceof ClientError) return id

      return new ApplicationKeyCreated(key, owner, id)
    }
  }

  export class DataSubmitted {
    constructor(
      public who: AccountId,
      public dataHash: H256,
    ) {}

    encode(): Uint8Array {
      return mergeArrays([Encoder.any(this.who), Encoder.any(this.dataHash)])
    }

    static emittedIndex(): [number, number] {
      return [PALLET_INDEX, 1]
    }

    emittedIndex(): [number, number] {
      return DataSubmitted.emittedIndex()
    }

    static decode(decoder: Decoder): DataSubmitted | ClientError {
      const who = decoder.any(AccountId)
      if (who instanceof ClientError) return who

      const dataHash = decoder.any(H256)
      if (dataHash instanceof ClientError) return dataHash

      return new DataSubmitted(who, dataHash)
    }
  }
}

export namespace tx {
  export class CreateApplicationKey {
    constructor(public key: Uint8Array) {}
    static PALLET_NAME: string = PALLET_NAME
    static CALL_NAME: string = "createApplicationKey"

    encode(): Uint8Array {
      return Encoder.vecU8(this.key)
    }

    static dispatchIndex(): [number, number] {
      return [PALLET_INDEX, 0]
    }

    dispatchIndex(): [number, number] {
      return CreateApplicationKey.dispatchIndex()
    }

    static decode(decoder: Decoder): CreateApplicationKey | ClientError {
      const value = decoder.vecU8()
      if (value instanceof ClientError) return value

      return new CreateApplicationKey(value)
    }
  }

  export class SubmitData {
    constructor(public data: Uint8Array) {}
    static PALLET_NAME: string = PALLET_NAME
    static CALL_NAME: string = "submitData"

    encode(): Uint8Array {
      return Encoder.vecU8(this.data)
    }

    static dispatchIndex(): [number, number] {
      return [PALLET_INDEX, 1]
    }

    dispatchIndex(): [number, number] {
      return SubmitData.dispatchIndex()
    }

    static decode(decoder: Decoder): SubmitData | ClientError {
      const value = decoder.vecU8()
      if (value instanceof ClientError) return value

      return new SubmitData(value)
    }
  }
}
