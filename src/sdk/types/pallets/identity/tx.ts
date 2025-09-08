import { Encoder, Decoder } from "../../scale"
import { ClientError } from "../../../error"
import { addHeader } from "../../../interface"
import { PALLET_ID } from "."
import * as types from "./types"
import { AccountId, MultiAddress } from "../../metadata"

export class AddSub extends addHeader(PALLET_ID, 11) {
  constructor(
    public sub: MultiAddress,
    public data: types.DataValue,
  ) {
    super()
  }

  static decode(decoder: Decoder): AddSub | ClientError {
    const result = decoder.any2(MultiAddress, types.Data)
    if (result instanceof ClientError) return result

    return new AddSub(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(this.sub, new types.Data(this.data))
  }
}

export class ClearIdentity extends addHeader(PALLET_ID, 3) {
  constructor() {
    super()
  }

  static decode(_decoder: Decoder): ClearIdentity | ClientError {
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

  static decode(_decoder: Decoder): QuitSub | ClientError {
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

  static decode(decoder: Decoder): RemoveSub | ClientError {
    const result = decoder.any1(MultiAddress)
    if (result instanceof ClientError) return result

    return new RemoveSub(result)
  }

  encode(): Uint8Array {
    return Encoder.concat(this.sub)
  }
}

export class SetIdentity extends addHeader(PALLET_ID, 1) {
  constructor(public info: types.IdentityInfo) {
    super()
  }

  static decode(decoder: Decoder): SetIdentity | ClientError {
    const result = decoder.any1(types.IdentityInfo)
    if (result instanceof ClientError) return result

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

  static decode(decoder: Decoder): SetSubs | ClientError {
    const result = decoder.vecTuple2(AccountId, types.Data)
    if (result instanceof ClientError) return result

    return new SetSubs(result)
  }

  encode(): Uint8Array {
    return Encoder.vecTuple2(this.subs.map((x) => [x[0], new types.Data(x[1])]))
  }
}
