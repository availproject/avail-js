import { QueryableStorage } from "@polkadot/api/types"
import { Decoder, Hasher } from "./../../decoder"
import { BN } from "../../.";

export class ActiveEra {
  public index: number
  public start: BN | null

  constructor(decoder: Decoder) {
    this.index = decoder.decodeU32()
    this.start = null

    const isPresent = decoder.decodeU8() == 1
    if (isPresent) {
      this.start = decoder.decodeU64()
    }
  }

  static HASHER: Hasher = Hasher.BLAKE2_128_CONCAT

  static async fetch(storageAt: QueryableStorage<'promise'>): Promise<ActiveEra | null> {
    const storage = await storageAt.staking.activeEra()
    const decoder = new Decoder(storage.toU8a(true), 0)
    if (decoder.len() == 0) {
      return null
    }
    return new ActiveEra(decoder)
  }
}

export class MinNominatorBond {
  static async fetch(storageAt: QueryableStorage<'promise'>): Promise<BN> {
    const storage = await storageAt.staking.minNominatorBond()
    const decoder = new Decoder(storage.toU8a(true), 0)
    if (decoder.len() == 0) {
      return new BN(0)
    }

    return decoder.decodeU128()
  }
}

export class MinValidatorBond {
  static async fetch(storageAt: QueryableStorage<'promise'>): Promise<BN> {
    const storage = await storageAt.staking.minValidatorBond()
    const decoder = new Decoder(storage.toU8a(true), 0)
    if (decoder.len() == 0) {
      return new BN(0)
    }

    return decoder.decodeU128()
  }
}

export class MinimumActiveStake {
  static async fetch(storageAt: QueryableStorage<'promise'>): Promise<BN> {
    const storage = await storageAt.staking.minimumActiveStake()
    const decoder = new Decoder(storage.toU8a(true), 0)
    if (decoder.len() == 0) {
      return new BN(0)
    }

    return decoder.decodeU128()
  }
}

export class MinimumValidatorCount {
  static async fetch(storageAt: QueryableStorage<'promise'>): Promise<number> {
    const storage = await storageAt.staking.minimumValidatorCount()
    const decoder = new Decoder(storage.toU8a(true), 0)
    if (decoder.len() == 0) {
      return 0
    }

    return decoder.decodeU32()
  }
}

export class ValidatorCount {
  static async fetch(storageAt: QueryableStorage<'promise'>): Promise<number> {
    const storage = await storageAt.staking.validatorCount()
    const decoder = new Decoder(storage.toU8a(true), 0)
    if (decoder.len() == 0) {
      return 0
    }

    return decoder.decodeU32()
  }
}

export class MinCommission {
  static async fetch(storageAt: QueryableStorage<'promise'>): Promise<number> {
    const storage = await storageAt.staking.minCommission()
    const decoder = new Decoder(storage.toU8a(true), 0)
    if (decoder.len() == 0) {
      return 0
    }

    return decoder.decodeU32()
  }
}

export class CurrentEra {
  static async fetch(storageAt: QueryableStorage<'promise'>): Promise<number | null> {
    const storage = await storageAt.staking.currentEra()
    const decoder = new Decoder(storage.toU8a(true), 0)
    if (decoder.len() == 0) {
      return null
    }

    return decoder.decodeU32()
  }
}