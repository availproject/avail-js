import { BN } from "./../polkadot"
import { Encoder, Decoder } from "./../scale"
import ClientError from "../../error"
import { mergeArrays } from "../../utils"
import { MultiAddress } from "./../metadata"

export const PALLET_NAME: string = "balances"
export const PALLET_INDEX: number = 6

export namespace tx {
  export class TransferAllowDeath {
    constructor(
      public dest: MultiAddress,
      public value: BN,
    ) {}
    static PALLET_NAME: string = PALLET_NAME
    static CALL_NAME: string = "transferAllowDeath"

    encode(): Uint8Array {
      return mergeArrays([Encoder.any(this.dest), Encoder.u128(this.value, true)])
    }

    static dispatchIndex(): [number, number] {
      return [PALLET_INDEX, 0]
    }

    dispatchIndex(): [number, number] {
      return TransferAllowDeath.dispatchIndex()
    }

    static decode(decoder: Decoder): TransferAllowDeath | ClientError {
      const dest = MultiAddress.decode(decoder)
      if (dest instanceof ClientError) return dest

      const value = decoder.u128(true)
      if (value instanceof ClientError) return value

      return new TransferAllowDeath(dest, value)
    }
  }

  export class TransferKeepAlive {
    constructor(
      public dest: MultiAddress,
      public value: BN,
    ) {}
    static PALLET_NAME: string = PALLET_NAME
    static CALL_NAME: string = "transferKeepAlive"

    encode(): Uint8Array {
      return mergeArrays([Encoder.any(this.dest), Encoder.u128(this.value, true)])
    }

    static dispatchIndex(): [number, number] {
      return [PALLET_INDEX, 3]
    }

    dispatchIndex(): [number, number] {
      return TransferKeepAlive.dispatchIndex()
    }

    static decode(decoder: Decoder): TransferKeepAlive | ClientError {
      const dest = MultiAddress.decode(decoder)
      if (dest instanceof ClientError) return dest

      const value = decoder.u128(true)
      if (value instanceof ClientError) return value

      return new TransferKeepAlive(dest, value)
    }
  }

  export class TransferAll {
    constructor(
      public dest: MultiAddress,
      public keepAlive: boolean,
    ) {}
    static PALLET_NAME: string = PALLET_NAME
    static CALL_NAME: string = "transferAll"

    encode(): Uint8Array {
      return mergeArrays([Encoder.any(this.dest), Encoder.bool(this.keepAlive)])
    }

    static dispatchIndex(): [number, number] {
      return [PALLET_INDEX, 4]
    }

    dispatchIndex(): [number, number] {
      return TransferAll.dispatchIndex()
    }

    static decode(decoder: Decoder): TransferAll | ClientError {
      const dest = MultiAddress.decode(decoder)
      if (dest instanceof ClientError) return dest

      const keepAlive = decoder.bool()
      if (keepAlive instanceof ClientError) return keepAlive

      return new TransferAll(dest, keepAlive)
    }
  }
}
