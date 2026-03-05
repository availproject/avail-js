import { Encoder, Decoder, U128 } from "./../../scale"
import { EnumDecodeError } from "../../../errors/sdk-error"
import { BN } from "@polkadot/util"
import { AccountId } from "../../types"
import { AccountIdScale } from "../../scale/types"

export type BondExtraValue = { FreeBalance: BN /* U128*/ } | "Rewards"
export class BondExtra {
  constructor(public value: BondExtraValue) {}

  static decode(decoder: Decoder): BondExtraValue {
    const variant = decoder.byte()
    if (variant == 0) {
      const balance = decoder.any1(U128)

      return { FreeBalance: balance }
    }
    if (variant == 1) return "Rewards"

    throw new EnumDecodeError("Cannot decode BondExtra")
  }

  encode(): Uint8Array {
    if (typeof this.value == "string") return Encoder.u8(1)

    return Encoder.enum(0, new U128(this.value.FreeBalance))
  }
}

export type ClaimPermissionValue =
  | "Permissioned"
  | "PermissionlessCompound"
  | "PermissionlessWithdraw"
  | "PermissionlessAll"
export class ClaimPermission {
  constructor(public value: ClaimPermissionValue) {}

  static decode(decoder: Decoder): ClaimPermissionValue {
    const variant = decoder.byte()

    if (variant == 0) return "Permissioned"
    if (variant == 1) return "PermissionlessCompound"
    if (variant == 2) return "PermissionlessWithdraw"
    if (variant == 3) return "PermissionlessAll"

    throw new EnumDecodeError("Cannot decode ClaimPermission")
  }

  encode(): Uint8Array {
    if (this.value == "Permissioned") return Encoder.u8(0)
    if (this.value == "PermissionlessCompound") return Encoder.u8(1)
    if (this.value == "PermissionlessWithdraw") return Encoder.u8(2)

    // PermissionlessAll
    return Encoder.u8(3)
  }
}

export type PoolStateValue = "Open" | "Blocked" | "Destroying"
export class PoolState {
  constructor(public value: PoolStateValue) {}

  static decode(decoder: Decoder): PoolStateValue {
    const variant = decoder.byte()

    if (variant == 0) return "Open"
    if (variant == 1) return "Blocked"
    if (variant == 2) return "Destroying"

    throw new EnumDecodeError("Cannot decode PoolState")
  }

  encode(): Uint8Array {
    if (this.value == "Open") return Encoder.u8(0)
    if (this.value == "Blocked") return Encoder.u8(1)

    // Destroying
    return Encoder.u8(2)
  }
}

export type ConfigOpAccountIdValue = "Noop" | { Set: AccountId } | "Remove"
export class ConfigOpAccountId {
  constructor(public value: ConfigOpAccountIdValue) {}

  static decode(decoder: Decoder): ConfigOpAccountIdValue {
    const variant = decoder.byte()

    if (variant == 0) return "Noop"
    if (variant == 1) {
      const accountId = decoder.any1(AccountIdScale)
      return { Set: accountId }
    }
    if (variant == 2) return "Remove"

    throw new EnumDecodeError("Cannot decode ConfigOpAccountId")
  }

  encode(): Uint8Array {
    if (this.value == "Noop") return Encoder.u8(0)
    if (this.value == "Remove") return Encoder.u8(2)

    // Set
    return Encoder.enum(1, new AccountIdScale(this.value.Set))
  }
}
