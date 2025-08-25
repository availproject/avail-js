import { Encoder, Decoder } from "./../scale"
import ClientError from "../../error"
import { Bool, CompactU128, CompactU16, CompactU32, CompactU64, VecU8 } from "../scale/types"
import { addPalletInfo } from "../../interface"
import { H256 } from "../metadata"
import { BN, u8aConcat } from "../polkadot"

export const PALLET_NAME: string = "vector"
export const PALLET_ID: number = 39

export namespace types {
  export class AddressedMessage {
    constructor(
      public message: Message,
      public from: H256,
      public to: H256,
      public originDomain: number, // Compact<u32>,
      public destinationDomain: number, // Compact<u32>,
      public id: BN, // Compact<u64>,
    ) {}

    static decode(decoder: Decoder): AddressedMessage | ClientError {
      const message = decoder.any1(Message)
      if (message instanceof ClientError) return message

      const from = decoder.any1(H256)
      if (from instanceof ClientError) return from

      const to = decoder.any1(H256)
      if (to instanceof ClientError) return to

      const originDomain = decoder.any1(CompactU32)
      if (originDomain instanceof ClientError) return originDomain

      const destinationDomain = decoder.any1(CompactU32)
      if (destinationDomain instanceof ClientError) return destinationDomain

      const id = decoder.any1(CompactU64)
      if (id instanceof ClientError) return id

      return new AddressedMessage(message, from, to, originDomain, destinationDomain, id)
    }

    encode(): Uint8Array {
      return Encoder.concat(
        this.message,
        this.from,
        this.to,
        new CompactU32(this.originDomain),
        new CompactU32(this.destinationDomain),
        new CompactU64(this.id),
      )
    }
  }

  export type MessageValue =
    | { ArbitraryMessage: Uint8Array /* Vec */ }
    | { FungibleToken: { assetId: H256; amount: BN /* Compact U128 */ } }
  // Possible types of Messages allowed by Avail to bridge to other chains.
  export class Message {
    constructor(public value: MessageValue) {}

    static decode(decoder: Decoder): Message | ClientError {
      const variant = decoder.u8()
      if (variant instanceof ClientError) return variant

      if (variant == 0) {
        const value = decoder.vecU8()
        if (value instanceof ClientError) return value
        return new Message({ ArbitraryMessage: value })
      }
      if (variant == 1) {
        const value = decoder.any2(H256, CompactU128)
        if (value instanceof ClientError) return value
        return new Message({ FungibleToken: { assetId: value[0], amount: value[1] } })
      }

      return new ClientError("Unknown Message")
    }

    encode(): Uint8Array {
      if ("ArbitraryMessage" in this.value) return Encoder.vecU8(this.value.ArbitraryMessage)

      // FungibleToken
      return Encoder.concat(this.value.FungibleToken.assetId, new CompactU128(this.value.FungibleToken.amount))
    }
  }

  export class Configuration {
    constructor(
      public slotsPerPeriod: BN, // Compact<u64>,
      public finalityThreshold: number, // Compact<u16>,
    ) {}

    static decode(decoder: Decoder): Configuration | ClientError {
      const result = decoder.any2(CompactU64, CompactU16)
      if (result instanceof ClientError) return result

      return new Configuration(...result)
    }

    encode(): Uint8Array {
      return Encoder.concat(new CompactU64(this.slotsPerPeriod), new CompactU16(this.finalityThreshold))
    }
  }
}

export namespace tx {
  export class FulfillCall extends addPalletInfo(PALLET_ID, 0) {
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

  export class Execute extends addPalletInfo(PALLET_ID, 1) {
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

  export class SourceChainFroze extends addPalletInfo(PALLET_ID, 2) {
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

  export class SendMessage extends addPalletInfo(PALLET_ID, 3) {
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

  export class SetPoseidonHash extends addPalletInfo(PALLET_ID, 4) {
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

  export class SetBroadcaster extends addPalletInfo(PALLET_ID, 5) {
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

  export class FailedSendMessageTxs extends addPalletInfo(PALLET_ID, 11) {
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
}
