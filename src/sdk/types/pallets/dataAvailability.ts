import { Encoder, Decoder } from "./../scale"
import ClientError from "../../error"
import { AccountId, DispatchFeeModifier, H256 } from "./../metadata"
import { CompactU32, U32, VecU8 } from "../scale/types"
import { StorageHasher, addPalletInfo, makeStorageMap, makeStorageValue } from "../../interface"
import { u8aConcat } from "../polkadot"

export const PALLET_NAME: string = "dataAvailability"
export const PALLET_ID: number = 29

export namespace types {
  export class AppKeys {
    constructor(
      public owner: AccountId,
      public appId: number, // Compact<U32>
    ) {}

    static decode(decoder: Decoder): AppKeys | ClientError {
      const value = decoder.any2(AccountId, CompactU32)
      if (value instanceof ClientError) return value

      return new AppKeys(value[0], value[1])
    }

    static encode(value: AppKeys): Uint8Array {
      return value.encode()
    }

    encode(): Uint8Array {
      return Encoder.concat(this.owner, new CompactU32(this.appId))
    }
  }
}

export namespace storage {
  export class NextAppId extends makeStorageValue<number>({
    PALLET_NAME: "DataAvailability",
    STORAGE_NAME: "NextAppId",
    decodeValue: CompactU32.decode,
  }) {}

  export class SubmitDataFeeModifier extends makeStorageValue<DispatchFeeModifier>({
    PALLET_NAME: "DataAvailability",
    STORAGE_NAME: "SubmitDataFeeModifier",
    decodeValue: DispatchFeeModifier.decode,
  }) {}

  export class AppKeys extends makeStorageMap<Uint8Array, types.AppKeys>({
    PALLET_NAME: "DataAvailability",
    STORAGE_NAME: "AppKeys",
    KEY_HASHER: new StorageHasher("Blake2_128Concat"),
    decodeKey: VecU8.decode,
    encodeKey: (value: Uint8Array) => value,
    decodeValue: types.AppKeys.decode,
  }) {}
}

export namespace events {
  export class ApplicationKeyCreated extends addPalletInfo(PALLET_ID, 0) {
    constructor(
      public key: Uint8Array,
      public owner: AccountId,
      public id: number, // u32
    ) {
      super()
    }

    static decode(decoder: Decoder): ApplicationKeyCreated | ClientError {
      const result = decoder.any3(VecU8, AccountId, U32)
      if (result instanceof ClientError) return result

      return new ApplicationKeyCreated(result[0], result[1], result[2])
    }

    encode(): Uint8Array {
      return u8aConcat(Encoder.vecU8(this.key), Encoder.any1(this.owner), Encoder.u32(this.id))
    }
  }

  export class DataSubmitted extends addPalletInfo(PALLET_ID, 1) {
    constructor(
      public who: AccountId,
      public dataHash: H256,
    ) {
      super()
    }

    static decode(decoder: Decoder): DataSubmitted | ClientError {
      const result = decoder.any2(AccountId, H256)
      if (result instanceof ClientError) return result

      return new DataSubmitted(result[0], result[1])
    }

    encode(): Uint8Array {
      return u8aConcat(Encoder.any1(this.who), Encoder.any1(this.dataHash))
    }
  }
}

export namespace tx {
  export class CreateApplicationKey extends addPalletInfo(PALLET_ID, 0) {
    constructor(public key: Uint8Array) {
      super()
    }

    static decode(decoder: Decoder): CreateApplicationKey | ClientError {
      const value = decoder.vecU8()
      if (value instanceof ClientError) return value

      return new CreateApplicationKey(value)
    }

    encode(): Uint8Array {
      return Encoder.vecU8(this.key)
    }
  }

  export class SubmitData extends addPalletInfo(PALLET_ID, 1) {
    constructor(public data: Uint8Array) {
      super()
    }

    static decode(decoder: Decoder): SubmitData | ClientError {
      const value = decoder.vecU8()
      if (value instanceof ClientError) return value

      return new SubmitData(value)
    }

    encode(): Uint8Array {
      return Encoder.vecU8(this.data)
    }
  }
}
