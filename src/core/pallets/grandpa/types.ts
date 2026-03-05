import { EnumDecodeError } from "../../../errors/sdk-error"
import { AuthorityList } from "../../types"
import { AuthorityListScale } from "../../scale/types"
import { U32, Encoder, Decoder } from "./../../scale"
import { u8aConcat } from "@polkadot/util"

export class StoredPendingChange {
  constructor(
    public scheduledAt: number, // u32
    public delay: number, // u32
    public nextAuthorities: AuthorityList,
    public forced: number | null, // u32 || null
  ) {}

  static decode(decoder: Decoder): StoredPendingChange {
    const scheduledAt = decoder.any1(U32)

    const delay = decoder.any1(U32)

    const nextAuthorities = decoder.any1(AuthorityListScale)

    const forced = decoder.option(U32)

    return new StoredPendingChange(scheduledAt, delay, nextAuthorities, forced)
  }

  encode(): Uint8Array {
    const encoded = u8aConcat(
      new U32(this.scheduledAt).encode(),
      new U32(this.delay).encode(),
      new AuthorityListScale(this.nextAuthorities).encode(),
    )
    let forced: U32 | null = null
    if (this.forced != null) {
      forced = new U32(this.forced)
    }

    return u8aConcat(encoded, Encoder.option(forced))
  }
}

export type StoredStateValue =
  | "Live"
  | { PendingPause: { scheduledAt: number; delay: number } }
  | "Paused"
  | { PendingResume: { scheduledAt: number; delay: number } }

export class StoredState {
  constructor(public value: StoredStateValue) {}

  static decode(decoder: Decoder): StoredState {
    const variant = decoder.u8()

    if (variant == 0) return new StoredState("Live")
    if (variant == 1) {
      const result = decoder.any2(U32, U32)
      return new StoredState({ PendingPause: { scheduledAt: result[0], delay: result[1] } })
    }
    if (variant == 2) return new StoredState("Paused")
    if (variant == 3) {
      const result = decoder.any2(U32, U32)
      return new StoredState({ PendingResume: { scheduledAt: result[0], delay: result[1] } })
    }

    throw new EnumDecodeError("Unknown StoredState")
  }

  encode(): Uint8Array {
    if (this.value == "Live") return Encoder.u8(0)
    if (this.value == "Paused") return Encoder.u8(2)

    if ("PendingPause" in this.value) {
      return u8aConcat(
        Encoder.u8(1),
        new U32(this.value.PendingPause.scheduledAt).encode(),
        new U32(this.value.PendingPause.delay).encode(),
      )
    }

    // PendingResume
    return u8aConcat(
      Encoder.u8(3),
      new U32(this.value.PendingResume.scheduledAt).encode(),
      new U32(this.value.PendingResume.delay).encode(),
    )
  }
}
