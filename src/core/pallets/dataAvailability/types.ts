import { AccountIdScale } from "../../scale/types"
import { AccountId } from "./../../types"
import { CompactU32, Encoder, Decoder } from "./../../scale"

export class AppKeys {
  constructor(
    public owner: AccountId,
    public appId: number, // Compact<U32>
  ) {}

  static decode(decoder: Decoder): AppKeys {
    const value = decoder.any2(AccountIdScale, CompactU32)

    return new AppKeys(value[0], value[1])
  }

  static encode(value: AppKeys): Uint8Array {
    return value.encode()
  }

  encode(): Uint8Array {
    return Encoder.concat(new AccountIdScale(this.owner), new CompactU32(this.appId))
  }
}
