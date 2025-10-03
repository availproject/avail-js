import { AvailError } from "../../zero_dep/error"
import { AccountId } from "./../../metadata"
import { CompactU32, Encoder, Decoder } from "./../../scale"

export class AppKeys {
  constructor(
    public owner: AccountId,
    public appId: number, // Compact<U32>
  ) {}

  static decode(decoder: Decoder): AppKeys | AvailError {
    const value = decoder.any2(AccountId, CompactU32)
    if (value instanceof AvailError) return value

    return new AppKeys(value[0], value[1])
  }

  static encode(value: AppKeys): Uint8Array {
    return value.encode()
  }

  encode(): Uint8Array {
    return Encoder.concat(this.owner, new CompactU32(this.appId))
  }
}
