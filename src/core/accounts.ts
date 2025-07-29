import { KeyringPair, Keyring } from "./index"

export function alice(): KeyringPair {
  return new Keyring({ type: "sr25519" }).addFromUri("//Alice")
}

export function bob(): KeyringPair {
  return new Keyring({ type: "sr25519" }).addFromUri("//Bob")
}

export function charlie(): KeyringPair {
  return new Keyring({ type: "sr25519" }).addFromUri("//Charlie")
}

export function dave(): KeyringPair {
  return new Keyring({ type: "sr25519" }).addFromUri("//Dave")
}

export function eve(): KeyringPair {
  return new Keyring({ type: "sr25519" }).addFromUri("//Eve")
}

export function ferdie(): KeyringPair {
  return new Keyring({ type: "sr25519" }).addFromUri("//Ferdie")
}

export function create(uri: string): KeyringPair {
  return new Keyring({ type: "sr25519" }).addFromUri(uri)
}

export function generate(): KeyringPair {
  const array: Uint8Array = new Uint8Array(32)
  for (let i = 0; i < 32; i++) {
    array[i] = Math.floor(Math.random() * 256)
  }
  return new Keyring({ type: "sr25519" }).addFromSeed(array)
}
