import { Encoder, Decoder } from "./../../scale"
import { AvailError } from "../../zero_dep/error"
import { ArrayU8L20, ArrayU8L32 } from "../../scale/types"
import { u8aConcat } from "@polkadot/util"

export type DataValue =
  | "None"
  | { Raw: Uint8Array /* Variable fixed array */ }
  | { BlakeTwo256: Uint8Array /* [u8; 32] */ }
  | { Sha256: Uint8Array /* [u8; 32] */ }
  | { Keccak256: Uint8Array /* [u8; 32] */ }
  | { ShaThree256: Uint8Array /* [u8; 32] */ }
export class Data {
  constructor(public value: DataValue) {}
  static decode(decoder: Decoder): DataValue | AvailError {
    const variant = decoder.u8()
    if (variant instanceof AvailError) return variant

    if (variant == 0) return "None"
    if (variant >= 1 && variant <= 33) {
      const bytes = decoder.bytes(variant - 1)
      if (bytes instanceof AvailError) return bytes
      return { Raw: bytes }
    }
    if (variant == 34) {
      const blake = decoder.any1(ArrayU8L32)
      if (blake instanceof AvailError) return blake
      return { BlakeTwo256: blake }
    }

    if (variant == 35) {
      const sha = decoder.any1(ArrayU8L32)
      if (sha instanceof AvailError) return sha
      return { Sha256: sha }
    }

    if (variant == 36) {
      const keccak = decoder.any1(ArrayU8L32)
      if (keccak instanceof AvailError) return keccak
      return { Keccak256: keccak }
    }

    if (variant == 37) {
      const shaThree = decoder.any1(ArrayU8L32)
      if (shaThree instanceof AvailError) return shaThree
      return { ShaThree256: shaThree }
    }

    return new AvailError("Unknown Data")
  }

  encode(): Uint8Array {
    if (this.value == "None") return Encoder.u8(0)
    if ("Raw" in this.value) {
      let val = this.value.Raw
      if (val.length >= 33) {
        val = val.slice(0, 33)
      }

      return Encoder.enum(val.length + 1, val)
    }
    if ("BlakeTwo256" in this.value) return Encoder.enum(34, new ArrayU8L32(this.value.BlakeTwo256))
    if ("Sha256" in this.value) return Encoder.enum(35, new ArrayU8L32(this.value.Sha256))
    if ("Keccak256" in this.value) return Encoder.enum(36, new ArrayU8L32(this.value.Keccak256))

    // ShaThree256
    return Encoder.enum(37, new ArrayU8L32(this.value.ShaThree256))
  }
}

export class DoubleData {
  constructor(public value: [DataValue, DataValue]) {}
  static decode(decoder: Decoder): [DataValue, DataValue] | AvailError {
    return decoder.any2(Data, Data)
  }

  encode(): Uint8Array {
    return Encoder.concat(new Data(this.value[0]), new Data(this.value[1]))
  }
}

export class IdentityInfo {
  constructor(
    public additional: [DataValue, DataValue][], // Vec
    public display: DataValue,
    public legal: DataValue,
    public web: DataValue,
    public riot: DataValue,
    public email: DataValue,
    public pgpFingerprint: Uint8Array | null, // Option<[u8; 20]>,
    public image: DataValue,
    public twitter: DataValue,
  ) {}
  static decode(decoder: Decoder): IdentityInfo | AvailError {
    const additional = decoder.vec(DoubleData)
    if (additional instanceof AvailError) return additional

    const res1 = decoder.any5(Data, Data, Data, Data, Data)
    if (res1 instanceof AvailError) return res1

    const pgpFingerprint = decoder.option(ArrayU8L20)
    if (pgpFingerprint instanceof AvailError) return pgpFingerprint

    const res2 = decoder.any2(Data, Data)
    if (res2 instanceof AvailError) return res2

    return new IdentityInfo(additional, ...res1, pgpFingerprint, ...res2)
  }

  encode(): Uint8Array {
    return u8aConcat(
      Encoder.vec(this.additional.map((x) => new DoubleData([x[0], x[1]]))),
      new Data(this.display).encode(),
      new Data(this.legal).encode(),
      new Data(this.web).encode(),
      new Data(this.riot).encode(),
      new Data(this.email).encode(),
      Encoder.option(this.pgpFingerprint ? new ArrayU8L20(this.pgpFingerprint) : null),
      new Data(this.image).encode(),
      new Data(this.twitter).encode(),
    )
  }
}
