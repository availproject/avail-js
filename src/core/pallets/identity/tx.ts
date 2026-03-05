import { addHeader } from "./../../interface"
import { Encoder, Decoder } from "./../../scale"
import { PALLET_ID } from "./header"
import { AccountId, MultiAddress } from "../../types"
import * as types from "./types"
import { AccountIdScale, MultiAddressScale } from "../../scale/types"

export { PALLET_ID }

export class AddSub extends addHeader(PALLET_ID, 11) {
  constructor(
    public sub: MultiAddress,
    public data: types.DataValue,
  ) {
    super()
  }

  static decode(decoder: Decoder): AddSub {
    const result = decoder.any2(MultiAddressScale, types.Data)

    return new AddSub(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new MultiAddressScale(this.sub), new types.Data(this.data))
  }
}

export class ClearIdentity extends addHeader(PALLET_ID, 3) {
  constructor() {
    super()
  }

  static decode(_decoder: Decoder): ClearIdentity {
    return new ClearIdentity()
  }

  encode(): Uint8Array {
    return new Uint8Array()
  }
}

export class QuitSub extends addHeader(PALLET_ID, 14) {
  constructor() {
    super()
  }

  static decode(_decoder: Decoder): QuitSub {
    return new QuitSub()
  }

  encode(): Uint8Array {
    return new Uint8Array()
  }
}

export class RemoveSub extends addHeader(PALLET_ID, 13) {
  constructor(public sub: MultiAddress) {
    super()
  }

  static decode(decoder: Decoder): RemoveSub {
    const result = decoder.any1(MultiAddressScale)

    return new RemoveSub(result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new MultiAddressScale(this.sub))
  }
}

export class SetIdentity extends addHeader(PALLET_ID, 1) {
  constructor(public info: types.IdentityInfo) {
    super()
  }

  static decode(decoder: Decoder): SetIdentity {
    const result = decoder.any1(types.IdentityInfo)

    return new SetIdentity(result)
  }

  encode(): Uint8Array {
    return this.info.encode()
  }
}

export class SetSubs extends addHeader(PALLET_ID, 2) {
  constructor(public subs: [AccountId, types.DataValue][] /* Vec */) {
    super()
  }

  static decode(decoder: Decoder): SetSubs {
    const result = decoder.vecTuple2(AccountIdScale, types.Data)

    return new SetSubs(result)
  }

  encode(): Uint8Array {
    return Encoder.vecTuple2(this.subs.map((x) => [new AccountIdScale(x[0]), new types.Data(x[1])]))
  }
}
