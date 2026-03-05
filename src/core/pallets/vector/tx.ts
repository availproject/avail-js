import { addHeader } from "./../../interface"
import { Bool, CompactU32, CompactU64, VecU8, Encoder, Decoder } from "./../../scale"
import { H256 } from "../../types"
import { BN, u8aConcat } from "@polkadot/util"
import { PALLET_ID } from "./header"
import * as types from "./types"
import { H256Scale } from "../../scale/types"

export class FulfillCall extends addHeader(PALLET_ID, 0) {
  constructor(
    public function_id: H256,
    public input: Uint8Array,
    public output: Uint8Array,
    public proof: Uint8Array,
    public slot: BN, // Compact U64
  ) {
    super()
  }
  static decode(decoder: Decoder): FulfillCall {
    const value = decoder.any5(H256Scale, VecU8, VecU8, VecU8, CompactU64)

    return new FulfillCall(...value)
  }

  encode(): Uint8Array {
    return Encoder.concat(
      new H256Scale(this.function_id),
      new VecU8(this.input),
      new VecU8(this.output),
      new VecU8(this.proof),
      new CompactU64(this.slot),
    )
  }
}

export class Execute extends addHeader(PALLET_ID, 1) {
  constructor(
    public slot: BN, // Compact U64
    public addrMessage: types.AddressedMessage,
    public accountProof: Uint8Array[],
    public storageProof: Uint8Array[],
  ) {
    super()
  }
  static decode(decoder: Decoder): Execute {
    const slot = decoder.any1(CompactU64)

    const addrMessage = decoder.any1(types.AddressedMessage)

    const accountProof = decoder.vec(VecU8)

    const storageProof = decoder.vec(VecU8)

    return new Execute(slot, addrMessage, accountProof, storageProof)
  }

  encode(): Uint8Array {
    return u8aConcat(
      new CompactU64(this.slot).encode(),
      this.addrMessage.encode(),
      Encoder.vec(this.accountProof.map((x) => new VecU8(x))),
      Encoder.vec(this.storageProof.map((x) => new VecU8(x))),
    )
  }
}

export class SourceChainFroze extends addHeader(PALLET_ID, 2) {
  constructor(
    public sourceChainId: number, // Compact u32
    public frozen: boolean,
  ) {
    super()
  }
  static decode(decoder: Decoder): SourceChainFroze {
    const result = decoder.any2(CompactU32, Bool)

    return new SourceChainFroze(...result)
  }

  encode(): Uint8Array {
    return u8aConcat(new CompactU32(this.sourceChainId).encode(), new Bool(this.frozen).encode())
  }
}

export class SendMessage extends addHeader(PALLET_ID, 3) {
  constructor(
    public slot: BN, // Compact U64
    public message: types.Message,
    public to: H256,
    public domain: number, // Compact U32
  ) {
    super()
  }
  static decode(decoder: Decoder): SendMessage {
    const result = decoder.any4(CompactU64, types.Message, H256Scale, CompactU32)

    return new SendMessage(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new CompactU64(this.slot), this.message, new H256Scale(this.to), new CompactU32(this.domain))
  }
}

export class SetPoseidonHash extends addHeader(PALLET_ID, 4) {
  constructor(
    public period: BN, // Compact U64
    public poseidonHash: Uint8Array, // Vec
  ) {
    super()
  }
  static decode(decoder: Decoder): SetPoseidonHash {
    const result = decoder.any2(CompactU64, VecU8)

    return new SetPoseidonHash(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new CompactU64(this.period), new VecU8(this.poseidonHash))
  }
}

export class SetBroadcaster extends addHeader(PALLET_ID, 5) {
  constructor(
    public broadcasterDomain: number, // Compact U32
    public broadcaster: H256, // Vec
  ) {
    super()
  }
  static decode(decoder: Decoder): SetBroadcaster {
    const result = decoder.any2(CompactU32, H256Scale)

    return new SetBroadcaster(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new CompactU32(this.broadcasterDomain), new H256Scale(this.broadcaster))
  }
}

export class FailedSendMessageTxs extends addHeader(PALLET_ID, 11) {
  constructor(public failedTxs: number[]) {
    super()
  }

  static decode(decoder: Decoder): FailedSendMessageTxs {
    const value = decoder.vec(CompactU32)

    return new FailedSendMessageTxs(value)
  }

  encode(): Uint8Array {
    return Encoder.vec(this.failedTxs.map((x) => new CompactU32(x)))
  }
}
