import ClientError from "../../../error"
import { Bool, CompactU32, CompactU64, VecU8, Encoder, Decoder } from "../../scale"
import { addHeader } from "../../../interface"
import { H256 } from "../../metadata"
import { BN, u8aConcat } from "../../polkadot"
import { PALLET_ID } from "."
import * as types from "./types"

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
  static decode(decoder: Decoder): FulfillCall | ClientError {
    const value = decoder.any5(H256, VecU8, VecU8, VecU8, CompactU64)
    if (value instanceof ClientError) return value

    return new FulfillCall(...value)
  }

  encode(): Uint8Array {
    return Encoder.concat(
      this.function_id,
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
  static decode(decoder: Decoder): Execute | ClientError {
    const slot = decoder.any1(CompactU64)
    if (slot instanceof ClientError) return slot

    const addrMessage = decoder.any1(types.AddressedMessage)
    if (addrMessage instanceof ClientError) return addrMessage

    const accountProof = decoder.vec(VecU8)
    if (accountProof instanceof ClientError) return accountProof

    const storageProof = decoder.vec(VecU8)
    if (storageProof instanceof ClientError) return storageProof

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
  static decode(decoder: Decoder): SourceChainFroze | ClientError {
    const result = decoder.any2(CompactU32, Bool)
    if (result instanceof ClientError) return result

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
  static decode(decoder: Decoder): SendMessage | ClientError {
    const result = decoder.any4(CompactU64, types.Message, H256, CompactU32)
    if (result instanceof ClientError) return result

    return new SendMessage(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new CompactU64(this.slot), this.message, this.to, new CompactU32(this.domain))
  }
}

export class SetPoseidonHash extends addHeader(PALLET_ID, 4) {
  constructor(
    public period: BN, // Compact U64
    public poseidonHash: Uint8Array, // Vec
  ) {
    super()
  }
  static decode(decoder: Decoder): SetPoseidonHash | ClientError {
    const result = decoder.any2(CompactU64, VecU8)
    if (result instanceof ClientError) return result

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
  static decode(decoder: Decoder): SetBroadcaster | ClientError {
    const result = decoder.any2(CompactU32, H256)
    if (result instanceof ClientError) return result

    return new SetBroadcaster(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new CompactU32(this.broadcasterDomain), this.broadcaster)
  }
}

export class FailedSendMessageTxs extends addHeader(PALLET_ID, 11) {
  constructor(public failedTxs: number[]) {
    super()
  }

  static decode(decoder: Decoder): FailedSendMessageTxs | ClientError {
    const value = decoder.vec(CompactU32)
    if (value instanceof ClientError) return value

    return new FailedSendMessageTxs(value)
  }

  encode(): Uint8Array {
    return Encoder.vec(this.failedTxs.map((x) => new CompactU32(x)))
  }
}
