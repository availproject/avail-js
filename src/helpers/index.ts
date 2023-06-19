import { decodeAddress, encodeAddress, Keyring } from "@polkadot/keyring"
import { KeyringPair } from "@polkadot/keyring/types"
import { hexToU8a, isHex, BN } from "@polkadot/util"

/**
 *
 * This function checks if a given address is valid.
 *
 * @param {string} address The address to validate.
 *
 * @returns {boolean} A boolean value indicating whether the address is valid or not.
 */
export const isValidAddress = (address: string): boolean => {
  try {
    encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address))
    return true
  } catch (error) {
    return false
  }
}

/**
 * Formats a number to balance.
 *
 * @param {number} value The number value to format.
 * @param {number} [decimals] The number of decimal places to include in the formatted balance. Defaults to 18.
 *
 * @returns {BN} The converted BN value.
 */
export const formatNumberToBalance = (value: number, decimals?: number): BN => {
  const multiplier = new BN(10).pow(new BN(decimals || 18))
  return new BN(value).mul(multiplier)
}

/**
 * Generates a new keyring.
 *
 * @returns {Keyring} The newly generated Keyring instance.
 */
export const generateKeyring = (): Keyring => {
  return new Keyring({ type: "sr25519" })
}

/**
 * Retrieves a keyring pair from a given seed.
 *
 * @param {string} seed The seed value used to generate the keypair.
 * @returns {KeyringPair} The KeyringPair generated from the seed.
 */
export const getKeyringFromSeed = (seed: string): KeyringPair => {
  const keyring = generateKeyring()
  return keyring.addFromUri(seed)
}
