import { Encoder, Decoder } from "../../scale"
import { ClientError } from "../../../error"

export type ProxyTypeValue = "Any" | "NonTransfer" | "Governance" | "Staking" | "IdentityJudgement" | "NominationPools"
export class ProxyType {
  constructor(public value: ProxyTypeValue) {}

  static decode(decoder: Decoder): ProxyTypeValue | ClientError {
    const variant = decoder.u8()
    if (variant instanceof ClientError) return variant

    if (variant == 0) return "Any"
    if (variant == 1) return "NonTransfer"
    if (variant == 2) return "Governance"
    if (variant == 3) return "Staking"
    if (variant == 4) return "IdentityJudgement"
    if (variant == 5) return "NominationPools"

    return new ClientError("Unknown ProxyType")
  }

  encode(): Uint8Array {
    if (this.value == "Any") return Encoder.u8(0)
    if (this.value == "NonTransfer") return Encoder.u8(1)
    if (this.value == "Governance") return Encoder.u8(2)
    if (this.value == "Staking") return Encoder.u8(3)
    if (this.value == "IdentityJudgement") return Encoder.u8(4)

    // NominationPools
    return Encoder.u8(5)
  }
}
