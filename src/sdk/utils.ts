import { ApiPromise } from "@polkadot/api"
import { err, ok, Result } from "neverthrow"
import { createKeyMulti, encodeAddress, sortAddresses } from "@polkadot/util-crypto"
import { EventRecord } from "@polkadot/types/interfaces/types"
import { decodeError } from "../helpers"

/**
 * Converts a commission percentage to a perbill format.
 *
 * @param {number} value - The commission percentage (0-100).
 * @return {string} The commission value in perbill format.
 * @throws {Error} If the value is not an integer or is out of the 0-100 range.
 */
export function commissionNumberToPerbill(value: number): Result<string, string> {
  if (!Number.isInteger(value)) {
    return err("Commission cannot have decimal place. It needs to be a whole number.")
  }

  if (value < 0 || value > 100) {
    return err("Commission is limited to the following range: 0 - 100. It cannot be less than 0 or more than 100.")
  }

  let commission = value.toString().concat("0000000")
  // For some reason 0 commission is not defined as "0" but as "1".
  if (commission == "00000000") {
    commission = "1"
  }

  return ok(commission)
}

export function generateMultisig(addresses: string[], threshold: number): string {
  const SS58Prefix = 42

  const multiAddress = createKeyMulti(addresses, threshold)
  const Ss58Address = encodeAddress(multiAddress, SS58Prefix)

  return Ss58Address
}

export function sortMultisigAddresses(addresses: string[]): string[] {
  const SS58Prefix = 42

  return sortAddresses(addresses, SS58Prefix)
}

/**
 * Converts a hexadecimal string to an ASCII string.
 *
 * @param {string} hex - The hexadecimal string to convert.
 * @return {string} The converted ASCII string.
 */
export function fromHexToAscii(hex: string): string {
  let str = ""
  for (let n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substring(n, n + 2), 16))
  }

  return `${str}`
}

export function deconstruct_session_keys(keys: string) {
  if (keys.startsWith("0x")) {
    keys = keys.slice(2, undefined)
  }
  const babeKey = "0x".concat(keys.slice(0, 64))
  const grandpaKey = "0x".concat(keys.slice(64, 128))
  const imonlineKey = "0x".concat(keys.slice(128, 192))
  const authorityDiscoveryKey = "0x".concat(keys.slice(192, 256))

  return {
    babe: babeKey,
    grandpa: grandpaKey,
    imOnline: imonlineKey,
    authorityDiscovery: authorityDiscoveryKey,
  }
}

export function findAndDecodeError(api: ApiPromise, events: EventRecord[]): string | null {
  const failed = events.find((e) => api.events.system.ExtrinsicFailed.is(e.event))
  if (failed == undefined) return null

  return decodeError(api, failed.event.data[0])
}
