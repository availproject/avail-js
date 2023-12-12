import { decodeAddress, encodeAddress, Keyring } from "@polkadot/keyring"
import { KeyringPair } from "@polkadot/keyring/types"
import { hexToU8a, isHex, BN, u8aToHex } from "@polkadot/util"

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

/**
 * Splits a string into an array of substrings of a specified chunk size.
 *
 * @param {string} inputString The input string to split.
 * @param {number} chunkSize The size of each chunk. Default is 2.
 * @returns {string[]} An array of substrings.
 */
export const splitStringIntoArray = (inputString: string, chunkSize: number = 2): string[] => {
  const result: string[] = []

  for (let i = 0; i < inputString.length; i += chunkSize) {
    result.push(inputString.substring(i, i + chunkSize))
  }

  return result
}

/**
 * Decodes a Uint8Array into a decimal value.
 *
 * @param {Uint8Array} value The Uint8Array to decode.
 * @returns {string} The decoded hex-encoded App ID as a string.
 */
export const decodeU8IntAppId = (value: Uint8Array): string => {
  const hexAppId = u8aToHex(value, undefined, false)
  return decodeHexAppId(hexAppId)
}

/**
 * Decodes a hex-encoded App ID string into a decimal value.
 *
 * @param {string} value The hex-encoded App ID string to decode.
 * @returns {string} The decoded decimal value as a string.
 * @throws {Error} If the input value has an invalid length.
 */
export const decodeHexAppId = (value: `0x${string}`): string => {
  if (value.length <= 2 || value.length % 2 !== 0) throw new Error("Invalid length")
  const v = value.startsWith("0x") ? value.substring(2) : value
  const array = splitStringIntoArray(v)
  let s = BigInt(0)
  array.forEach((x, i) => {
    s += BigInt(parseInt(x, 16) << (i * 8))
  })
  const result = (s >> BigInt(2)).toString()
  return result
}
