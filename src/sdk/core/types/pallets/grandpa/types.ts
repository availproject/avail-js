import { AvailError } from "../../../error"
import { U32, Encoder, Decoder } from "../../scale"
import { AuthorityList } from "../../metadata"
import { u8aConcat } from "../../polkadot"

export class StoredPendingChange {
  constructor(
    public scheduledAt: number, // u32
    public delay: number, // u32
    public nextAuthorities: AuthorityList,
    public forced: number | null, // u32 || null
  ) {}

  static decode(decoder: Decoder): StoredPendingChange | AvailError {
    const scheduledAt = decoder.any1(U32)
    if (scheduledAt instanceof AvailError) return scheduledAt

    const delay = decoder.any1(U32)
    if (delay instanceof AvailError) return delay

    const nextAuthorities = decoder.any1(AuthorityList)
    if (nextAuthorities instanceof AvailError) return nextAuthorities

    const forced = decoder.option(U32)
    if (forced instanceof AvailError) return forced

    return new StoredPendingChange(scheduledAt, delay, nextAuthorities, forced)
  }

  encode(): Uint8Array {
    const encoded = u8aConcat(
      new U32(this.scheduledAt).encode(),
      new U32(this.delay).encode(),
      this.nextAuthorities.encode(),
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

  static decode(decoder: Decoder): StoredState | AvailError {
    const variant = decoder.u8()
    if (variant instanceof AvailError) return variant

    if (variant == 0) return new StoredState("Live")
    if (variant == 1) {
      const result = decoder.any2(U32, U32)
      if (result instanceof AvailError) return result
      return new StoredState({ PendingPause: { scheduledAt: result[0], delay: result[1] } })
    }
    if (variant == 2) return new StoredState("Paused")
    if (variant == 3) {
      const result = decoder.any2(U32, U32)
      if (result instanceof AvailError) return result
      return new StoredState({ PendingResume: { scheduledAt: result[0], delay: result[1] } })
    }

    return new AvailError("Unknown StoredState")
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
