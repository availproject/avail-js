import { addHeader } from "./../../interface"
import { Encoder, Decoder } from "./../../scale"
import { AvailError } from "../../misc/error"
import { PALLET_ID } from "./header"
import { AccountId, MultiAddress, MultiAddressValue } from "../../metadata"
import * as types from "./types"

export { PALLET_ID }

export class AddSub extends addHeader(PALLET_ID, 11) {
  constructor(
    public sub: MultiAddressValue,
    public data: types.DataValue,
  ) {
    super()
  }

  static decode(decoder: Decoder): AddSub | AvailError {
    const result = decoder.any2(MultiAddress, types.Data)
    if (result instanceof AvailError) return result

    return new AddSub(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new MultiAddress(this.sub), new types.Data(this.data))
  }
}

export class ClearIdentity extends addHeader(PALLET_ID, 3) {
  constructor() {
    super()
  }

  static decode(_decoder: Decoder): ClearIdentity | AvailError {
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

  static decode(_decoder: Decoder): QuitSub | AvailError {
    return new QuitSub()
  }

  encode(): Uint8Array {
    return new Uint8Array()
  }
}

export class RemoveSub extends addHeader(PALLET_ID, 13) {
  constructor(public sub: MultiAddressValue) {
    super()
  }

  static decode(decoder: Decoder): RemoveSub | AvailError {
    const result = decoder.any1(MultiAddress)
    if (result instanceof AvailError) return result

    return new RemoveSub(result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new MultiAddress(this.sub))
  }
}

export class SetIdentity extends addHeader(PALLET_ID, 1) {
  constructor(public info: types.IdentityInfo) {
    super()
  }

  static decode(decoder: Decoder): SetIdentity | AvailError {
    const result = decoder.any1(types.IdentityInfo)
    if (result instanceof AvailError) return result

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

  static decode(decoder: Decoder): SetSubs | AvailError {
    const result = decoder.vecTuple2(AccountId, types.Data)
    if (result instanceof AvailError) return result

    return new SetSubs(result)
  }

  encode(): Uint8Array {
    return Encoder.vecTuple2(this.subs.map((x) => [x[0], new types.Data(x[1])]))
  }
}
