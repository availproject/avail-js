import { ValidationError } from "../errors/sdk-error"
import { MultiAddress, MultiSignature, Extension } from "./types"
import { IHeaderAndDecodable, scaleDecodeExtrinsicCall } from "./interface"
import { Decoder } from "./scale/decoder"
import { ExtensionScale, MultiAddressScale, MultiSignatureScale } from "./scale/types"

export const VERSION_MASK = 0b0011_1111
export const TYPE_MASK = 0b1100_0000
export const BARE_EXTRINSIC = 0b0000_0000
export const SIGNED_EXTRINSIC = 0b1000_0000
export const GENERAL_EXTRINSIC = 0b0100_0000

export const EXTENSION_VERSION = 0
export const LEGACY_EXTRINSIC_FORMAT_VERSION = 4
export const EXTRINSIC_FORMAT_VERSION = 5

export type Preamble =
  | { bare: { extensionVersion: number } }
  | { signed: { address: MultiAddress; signature: MultiSignature; extension: Extension } }
  | { general: { extensionVersion: number; extension: Extension } }

export class PreambleScale {
  constructor(public value: Preamble) {}

  static decode(decoder: Decoder): Preamble {
    const versionAndType = decoder.byte()
    const extensionVersion = versionAndType & VERSION_MASK
    const xtType = versionAndType & TYPE_MASK

    if (
      extensionVersion >= LEGACY_EXTRINSIC_FORMAT_VERSION &&
      extensionVersion <= EXTRINSIC_FORMAT_VERSION &&
      xtType == BARE_EXTRINSIC
    ) {
      return { bare: { extensionVersion } }
    }

    if (extensionVersion == LEGACY_EXTRINSIC_FORMAT_VERSION && xtType == SIGNED_EXTRINSIC) {
      const address = MultiAddressScale.decode(decoder)
      const signature = MultiSignatureScale.decode(decoder)
      const extension = ExtensionScale.decode(decoder)
      return { signed: { address, signature, extension } }
    }

    if (extensionVersion == EXTRINSIC_FORMAT_VERSION && xtType == GENERAL_EXTRINSIC) {
      const extension = ExtensionScale.decode(decoder)
      return { general: { extensionVersion, extension } }
    }

    throw new Error("Invalid transaction Version")
  }
}

export class Extrinsic {
  constructor(
    public preamble: Preamble,
    public call: Uint8Array,
  ) {}

  static decode(value: Decoder | string | Uint8Array): Extrinsic {
    const decoder = Decoder.from(value)

    const expectedLength = decoder.u32(true)
    const actualLength = decoder.remainingLen()

    if (expectedLength != actualLength)
      throw new ValidationError("Malformed transaction. Expected length and Actual length mismatch")

    const preamble = PreambleScale.decode(decoder)
    const call = decoder.readRemainingBytes()

    return new Extrinsic(preamble, call)
  }

  palletId(): number {
    return this.call[0]
  }

  variantId(): number {
    return this.call[1]
  }

  toCall<T>(as: IHeaderAndDecodable<T>): T | null {
    return scaleDecodeExtrinsicCall(as, this.call)
  }
}
