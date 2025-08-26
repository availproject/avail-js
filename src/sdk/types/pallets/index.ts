import { Decoder } from "./../scale"
import ClientError from "../../error"
import * as dataAvailability from "./dataAvailability"
export * as dataAvailability from "./dataAvailability"
import * as timestamp from "./timestamp"
export * as timestamp from "./timestamp"
export * as vector from "./vector"
import * as utility from "./utility"
export * as utility from "./utility"
import * as system from "./system"
export * as system from "./system"
import * as proxy from "./proxy"
export * as proxy from "./proxy"
import * as multisig from "./multisig"
export * as multisig from "./multisig"
import * as balances from "./balances"
import { ITransactionCall } from "../../interface"
import { GenericTransactionCall } from "../../transaction"
export * as balances from "./balances"

export type RuntimeCallValue =
  | balances.tx.TransferAllowDeath
  | balances.tx.TransferKeepAlive
  | balances.tx.TransferAll
  | utility.tx.Batch
  | utility.tx.BatchAll
  | utility.tx.ForceBatch
  | system.tx.Remark
  | system.tx.SetCode
  | system.tx.SetCodeWithoutChecks
  | system.tx.RemarkWithEvent
  | proxy.tx.Proxy
  | proxy.tx.AddProxy
  | proxy.tx.RemoveProxy
  | proxy.tx.RemoveProxies
  | proxy.tx.CreatePure
  | proxy.tx.KillPure
  | multisig.tx.AsMultiThreshold1
  | multisig.tx.AsMulti
  | multisig.tx.ApproveAsMulti
  | multisig.tx.CancelAsMulti
  | dataAvailability.tx.CreateApplicationKey
  | timestamp.tx.Set

export class RuntimeCall {
  constructor(public value: RuntimeCallValue) {}

  static decode(value: Decoder | string | Uint8Array): RuntimeCall | ClientError {
    const decoder = Decoder.from(value)
    if (decoder instanceof ClientError) return decoder

    const palletId = decoder.u8()
    const variantId = decoder.u8()

    if (palletId == balances.PALLET_ID) {
      if (variantId == balances.tx.TransferAllowDeath.VARIANT_ID) {
        const decoded = balances.tx.TransferAllowDeath.decode(decoder)
        if (decoded instanceof ClientError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == balances.tx.TransferKeepAlive.VARIANT_ID) {
        const decoded = balances.tx.TransferKeepAlive.decode(decoder)
        if (decoded instanceof ClientError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == balances.tx.TransferAll.VARIANT_ID) {
        const decoded = balances.tx.TransferAll.decode(decoder)
        if (decoded instanceof ClientError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == utility.PALLET_ID) {
      if (variantId == utility.tx.Batch.VARIANT_ID) {
        const decoded = utility.tx.Batch.decode(decoder)
        if (decoded instanceof ClientError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == utility.tx.BatchAll.VARIANT_ID) {
        const decoded = utility.tx.BatchAll.decode(decoder)
        if (decoded instanceof ClientError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == utility.tx.ForceBatch.VARIANT_ID) {
        const decoded = utility.tx.ForceBatch.decode(decoder)
        if (decoded instanceof ClientError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == system.PALLET_ID) {
      if (variantId == system.tx.Remark.VARIANT_ID) {
        const decoded = system.tx.Remark.decode(decoder)
        if (decoded instanceof ClientError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == system.tx.SetCode.VARIANT_ID) {
        const decoded = system.tx.SetCode.decode(decoder)
        if (decoded instanceof ClientError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == system.tx.SetCodeWithoutChecks.VARIANT_ID) {
        const decoded = system.tx.SetCodeWithoutChecks.decode(decoder)
        if (decoded instanceof ClientError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == system.tx.RemarkWithEvent.VARIANT_ID) {
        const decoded = system.tx.RemarkWithEvent.decode(decoder)
        if (decoded instanceof ClientError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == proxy.PALLET_ID) {
      if (variantId == proxy.tx.Proxy.VARIANT_ID) {
        const decoded = proxy.tx.Proxy.decode(decoder)
        if (decoded instanceof ClientError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == proxy.tx.AddProxy.VARIANT_ID) {
        const decoded = proxy.tx.AddProxy.decode(decoder)
        if (decoded instanceof ClientError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == proxy.tx.RemoveProxy.VARIANT_ID) {
        const decoded = proxy.tx.RemoveProxy.decode(decoder)
        if (decoded instanceof ClientError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == proxy.tx.RemoveProxies.VARIANT_ID) {
        const decoded = proxy.tx.RemoveProxies.decode(decoder)
        if (decoded instanceof ClientError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == proxy.tx.CreatePure.VARIANT_ID) {
        const decoded = proxy.tx.CreatePure.decode(decoder)
        if (decoded instanceof ClientError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == proxy.tx.KillPure.VARIANT_ID) {
        const decoded = proxy.tx.KillPure.decode(decoder)
        if (decoded instanceof ClientError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == multisig.PALLET_ID) {
      if (variantId == multisig.tx.AsMultiThreshold1.VARIANT_ID) {
        const decoded = multisig.tx.AsMultiThreshold1.decode(decoder)
        if (decoded instanceof ClientError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == multisig.tx.AsMulti.VARIANT_ID) {
        const decoded = multisig.tx.AsMulti.decode(decoder)
        if (decoded instanceof ClientError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == multisig.tx.ApproveAsMulti.VARIANT_ID) {
        const decoded = multisig.tx.ApproveAsMulti.decode(decoder)
        if (decoded instanceof ClientError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == multisig.tx.CancelAsMulti.VARIANT_ID) {
        const decoded = multisig.tx.CancelAsMulti.decode(decoder)
        if (decoded instanceof ClientError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == dataAvailability.PALLET_ID) {
      if (variantId == dataAvailability.tx.CreateApplicationKey.VARIANT_ID) {
        const decoded = dataAvailability.tx.CreateApplicationKey.decode(decoder)
        if (decoded instanceof ClientError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == dataAvailability.tx.SubmitData.VARIANT_ID) {
        const decoded = dataAvailability.tx.SubmitData.decode(decoder)
        if (decoded instanceof ClientError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == timestamp.PALLET_ID) {
      if (variantId == timestamp.tx.Set.VARIANT_ID) {
        const decoded = timestamp.tx.Set.decode(decoder)
        if (decoded instanceof ClientError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    return new ClientError("Failed to decode runtime call")
  }

  encode(): Uint8Array {
    return ITransactionCall.encode(this.value)
  }

  toGenericTransactionCall(): GenericTransactionCall {
    return GenericTransactionCall.from(this.value)
  }
}
