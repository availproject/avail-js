import { Encoder, Decoder } from "./../scale"
import ClientError from "../../error"
import { Bool, CompactU128, CompactU16, CompactU32, CompactU64, U32, U64, VecU8 } from "../scale/types"
import { addPalletInfo, makeStorageMap, makeStorageValue, StorageHasher } from "../../interface"
import { AuthorityList, H256 } from "../metadata"
import { BN, u8aConcat } from "../polkadot"

export const PALLET_NAME: string = "grandpa"
export const PALLET_ID: number = 17

export namespace types {
  export class StoredPendingChange {
    constructor(
      public scheduledAt: number, // u32
      public delay: number, // u32
      public nextAuthorities: AuthorityList,
      public forced: number | null, // u32 || null
    ) {}

    static decode(decoder: Decoder): StoredPendingChange | ClientError {
      const scheduledAt = decoder.any1(U32)
      if (scheduledAt instanceof ClientError) return scheduledAt

      const delay = decoder.any1(U32)
      if (delay instanceof ClientError) return delay

      const nextAuthorities = decoder.any1(AuthorityList)
      if (nextAuthorities instanceof ClientError) return nextAuthorities

      const forced = decoder.option(U32)
      if (forced instanceof ClientError) return forced

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

    static decode(decoder: Decoder): StoredState | ClientError {
      const variant = decoder.u8()
      if (variant instanceof ClientError) return variant

      if (variant == 0) return new StoredState("Live")
      if (variant == 1) {
        const result = decoder.any2(U32, U32)
        if (result instanceof ClientError) return result
        return new StoredState({ PendingPause: { scheduledAt: result[0], delay: result[1] } })
      }
      if (variant == 2) return new StoredState("Paused")
      if (variant == 3) {
        const result = decoder.any2(U32, U32)
        if (result instanceof ClientError) return result
        return new StoredState({ PendingResume: { scheduledAt: result[0], delay: result[1] } })
      }

      return new ClientError("Unknown StoredState")
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
}

export namespace storage {
  const PALLET_NAME = "Grandpa"

  export class SetIdSession extends makeStorageMap<BN, number>({
    PALLET_NAME,
    STORAGE_NAME: "SetIdSession",
    KEY_HASHER: new StorageHasher("Twox64Concat"),
    decodeKey: U64.decode,
    encodeKey: (value: BN) => new U64(value).encode(),
    decodeValue: U32.decode,
  }) {}

  export class CurrentSetId extends makeStorageValue<BN>({
    PALLET_NAME,
    STORAGE_NAME: "CurrentSetId",
    decodeValue: U64.decode,
  }) {}

  export class Authorities extends makeStorageValue<AuthorityList>({
    PALLET_NAME,
    STORAGE_NAME: "Authorities",
    decodeValue: AuthorityList.decode,
  }) {}

  export class PendingChange extends makeStorageValue<types.StoredPendingChange>({
    PALLET_NAME,
    STORAGE_NAME: "PendingChange",
    decodeValue: types.StoredPendingChange.decode,
  }) {}

  export class StoredState extends makeStorageValue<types.StoredState>({
    PALLET_NAME,
    STORAGE_NAME: "StoredState",
    decodeValue: types.StoredState.decode,
  }) {}

  export class NextForced extends makeStorageValue<number>({
    PALLET_NAME,
    STORAGE_NAME: "NextForced",
    decodeValue: U32.decode,
  }) {}

  export class Stalled extends makeStorageValue<[number, number]>({
    PALLET_NAME,
    STORAGE_NAME: "NextForced",
    decodeValue: (decoder) => decoder.any2(U32, U32),
  }) {}
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
}
