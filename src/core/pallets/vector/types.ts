import { CompactU128, CompactU16, CompactU32, CompactU64 } from "./../../scale/types"
import { Decoder } from "./../../scale/decoder"
import { Encoder } from "./../../scale/encoder"
import { H256 } from "../../metadata"
import { BN } from "@polkadot/util"
import { AvailError } from "../../error"

export class AddressedMessage {
  constructor(
    public message: Message,
    public from: H256,
    public to: H256,
    public originDomain: number, // Compact<u32>,
    public destinationDomain: number, // Compact<u32>,
    public id: BN, // Compact<u64>,
  ) {}

  static decode(decoder: Decoder): AddressedMessage {
    const message = decoder.any1(Message)

    const from = decoder.any1(H256)

    const to = decoder.any1(H256)

    const originDomain = decoder.any1(CompactU32)

    const destinationDomain = decoder.any1(CompactU32)

    const id = decoder.any1(CompactU64)

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

  static decode(decoder: Decoder): Message {
    const variant = decoder.u8()

    if (variant == 0) {
      const value = decoder.vecU8()
      return new Message({ ArbitraryMessage: value })
    }
    if (variant == 1) {
      const value = decoder.any2(H256, CompactU128)
      return new Message({ FungibleToken: { assetId: value[0], amount: value[1] } })
    }

    throw new AvailError("Unknown Message")
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

  static decode(decoder: Decoder): Configuration {
    const result = decoder.any2(CompactU64, CompactU16)

    return new Configuration(...result)
  }

  encode(): Uint8Array {
    return Encoder.concat(new CompactU64(this.slotsPerPeriod), new CompactU16(this.finalityThreshold))
  }
}
