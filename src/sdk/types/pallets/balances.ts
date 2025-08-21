import { BN } from "./../polkadot"
import { Encoder, Decoder } from "./../scale"
import ClientError from "../../error"
import { mergeArrays } from "../../utils"
import { MultiAddress } from "./../metadata"
import { addPalletInfo } from "../../interface"

export const PALLET_NAME: string = "balances"
export const PALLET_INDEX: number = 6

export namespace tx {
  export class TransferAllowDeath extends addPalletInfo(PALLET_INDEX, 0) {
    constructor(
      public dest: MultiAddress,
      public value: BN,
    ) {
      super()
    }

    encode(): Uint8Array {
      return mergeArrays([Encoder.any1(this.dest), Encoder.u128(this.value, true)])
    }

    static decode(decoder: Decoder): TransferAllowDeath | ClientError {
      const dest = MultiAddress.decode(decoder)
      if (dest instanceof ClientError) return dest

      const value = decoder.u128(true)
      if (value instanceof ClientError) return value

      return new TransferAllowDeath(dest, value)
    }
  }

  export class TransferKeepAlive extends addPalletInfo(PALLET_INDEX, 3) {
    constructor(
      public dest: MultiAddress,
      public value: BN,
    ) {
      super()
    }

    encode(): Uint8Array {
      return mergeArrays([Encoder.any1(this.dest), Encoder.u128(this.value, true)])
    }

    static decode(decoder: Decoder): TransferKeepAlive | ClientError {
      const dest = MultiAddress.decode(decoder)
      if (dest instanceof ClientError) return dest

      const value = decoder.u128(true)
      if (value instanceof ClientError) return value

      return new TransferKeepAlive(dest, value)
    }
  }

  export class TransferAll extends addPalletInfo(PALLET_INDEX, 4) {
    constructor(
      public dest: MultiAddress,
      public keepAlive: boolean,
    ) {
      super()
    }
    encode(): Uint8Array {
      return mergeArrays([Encoder.any1(this.dest), Encoder.bool(this.keepAlive)])
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
