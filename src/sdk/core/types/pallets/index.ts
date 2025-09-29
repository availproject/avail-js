import { Decoder } from "./../scale"
import { AvailError } from "../../../."
import { ICall } from "../../interface"

export { addHeader } from "./utils"

export * as vector from "./vector"
import * as timestamp from "./timestamp"
export * as timestamp from "./timestamp"
import * as utility from "./utility"
export * as utility from "./utility"
import * as system from "./system"
export * as system from "./system"
import * as proxy from "./proxy"
export * as proxy from "./proxy"
import * as multisig from "./multisig"
export * as multisig from "./multisig"
import * as dataAvailability from "./dataAvailability"
export * as dataAvailability from "./dataAvailability"
import * as balances from "./balances"
export * as balances from "./balances"
import * as staking from "./staking"
export * as staking from "./staking"
export * as grandpa from "./grandpa"
import * as identity from "./identity"
export * as identity from "./identity"
import * as nominationPools from "./nomination_pools"
export * as nominationPools from "./nomination_pools"
import * as sudo from "./sudo"
export * as sudo from "./sudo"
import * as session from "./session"
export * as session from "./session"

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
  | dataAvailability.tx.SubmitData
  | staking.tx.Bond
  | staking.tx.BondExtra
  | staking.tx.Chill
  | staking.tx.ChillOther
  | staking.tx.ForceApplyMinCommission
  | staking.tx.Kick
  | staking.tx.Nominate
  | staking.tx.PayoutStakers
  | staking.tx.PayoutStakersByPage
  | staking.tx.ReapStash
  | staking.tx.Rebond
  | staking.tx.SetController
  | staking.tx.SetPayee
  | staking.tx.Unbond
  | staking.tx.Validate
  | staking.tx.WithdrawUnbonded
  | identity.tx.AddSub
  | identity.tx.ClearIdentity
  | identity.tx.QuitSub
  | identity.tx.RemoveSub
  | identity.tx.SetIdentity
  | identity.tx.SetSubs
  | nominationPools.tx.BondExtra
  | nominationPools.tx.BondExtraOther
  | nominationPools.tx.Chill
  | nominationPools.tx.ClaimCommission
  | nominationPools.tx.ClaimPayout
  | nominationPools.tx.ClaimPayoutOther
  | nominationPools.tx.Create
  | nominationPools.tx.CreateWithPoolId
  | nominationPools.tx.Join
  | nominationPools.tx.Nominate
  | nominationPools.tx.SetClaimPermission
  | nominationPools.tx.SetCommission
  | nominationPools.tx.SetCommissionChangeRate
  | nominationPools.tx.SetCommissionMax
  | nominationPools.tx.SetMetadata
  | nominationPools.tx.SetState
  | nominationPools.tx.Unbond
  | nominationPools.tx.UpdateRoles
  | nominationPools.tx.WithdrawUnbonded
  | sudo.tx.Sudo
  | sudo.tx.SudoAs
  | session.tx.SetKeys
  | session.tx.PurgeKeys
  | timestamp.tx.Set

export class RuntimeCall {
  constructor(public value: RuntimeCallValue) {}

  static decode(value: Decoder | string | Uint8Array): RuntimeCall | AvailError {
    const decoder = Decoder.from(value)
    if (decoder instanceof AvailError) return decoder

    const palletId = decoder.u8()
    const variantId = decoder.u8()

    if (palletId == session.PALLET_ID) {
      if (variantId == session.tx.SetKeys.variantId()) {
        const decoded = session.tx.SetKeys.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == session.tx.PurgeKeys.variantId()) {
        const decoded = session.tx.PurgeKeys.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == balances.PALLET_ID) {
      if (variantId == balances.tx.TransferAllowDeath.variantId()) {
        const decoded = balances.tx.TransferAllowDeath.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == balances.tx.TransferKeepAlive.variantId()) {
        const decoded = balances.tx.TransferKeepAlive.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == balances.tx.TransferAll.variantId()) {
        const decoded = balances.tx.TransferAll.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == utility.PALLET_ID) {
      if (variantId == utility.tx.Batch.variantId()) {
        const decoded = utility.tx.Batch.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == utility.tx.BatchAll.variantId()) {
        const decoded = utility.tx.BatchAll.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == utility.tx.ForceBatch.variantId()) {
        const decoded = utility.tx.ForceBatch.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == system.PALLET_ID) {
      if (variantId == system.tx.Remark.variantId()) {
        const decoded = system.tx.Remark.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == system.tx.SetCode.variantId()) {
        const decoded = system.tx.SetCode.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == system.tx.SetCodeWithoutChecks.variantId()) {
        const decoded = system.tx.SetCodeWithoutChecks.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == system.tx.RemarkWithEvent.variantId()) {
        const decoded = system.tx.RemarkWithEvent.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == proxy.PALLET_ID) {
      if (variantId == proxy.tx.Proxy.variantId()) {
        const decoded = proxy.tx.Proxy.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == proxy.tx.AddProxy.variantId()) {
        const decoded = proxy.tx.AddProxy.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == proxy.tx.RemoveProxy.variantId()) {
        const decoded = proxy.tx.RemoveProxy.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == proxy.tx.RemoveProxies.variantId()) {
        const decoded = proxy.tx.RemoveProxies.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == proxy.tx.CreatePure.variantId()) {
        const decoded = proxy.tx.CreatePure.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == proxy.tx.KillPure.variantId()) {
        const decoded = proxy.tx.KillPure.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == multisig.PALLET_ID) {
      if (variantId == multisig.tx.AsMultiThreshold1.variantId()) {
        const decoded = multisig.tx.AsMultiThreshold1.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == multisig.tx.AsMulti.variantId()) {
        const decoded = multisig.tx.AsMulti.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == multisig.tx.ApproveAsMulti.variantId()) {
        const decoded = multisig.tx.ApproveAsMulti.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == multisig.tx.CancelAsMulti.variantId()) {
        const decoded = multisig.tx.CancelAsMulti.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == dataAvailability.PALLET_ID) {
      if (variantId == dataAvailability.tx.CreateApplicationKey.variantId()) {
        const decoded = dataAvailability.tx.CreateApplicationKey.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == dataAvailability.tx.SubmitData.variantId()) {
        const decoded = dataAvailability.tx.SubmitData.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == sudo.PALLET_ID) {
      if (variantId == sudo.tx.Sudo.variantId()) {
        const decoded = sudo.tx.Sudo.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == sudo.tx.SudoAs.variantId()) {
        const decoded = sudo.tx.SudoAs.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == timestamp.PALLET_ID) {
      if (variantId == timestamp.tx.Set.variantId()) {
        const decoded = timestamp.tx.Set.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == staking.PALLET_ID) {
      if (variantId == staking.tx.Bond.variantId()) {
        const decoded = staking.tx.Bond.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.tx.BondExtra.variantId()) {
        const decoded = staking.tx.BondExtra.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.tx.Chill.variantId()) {
        const decoded = staking.tx.Chill.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.tx.ChillOther.variantId()) {
        const decoded = staking.tx.ChillOther.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.tx.ForceApplyMinCommission.variantId()) {
        const decoded = staking.tx.ForceApplyMinCommission.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.tx.Kick.variantId()) {
        const decoded = staking.tx.Kick.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.tx.Nominate.variantId()) {
        const decoded = staking.tx.Nominate.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.tx.PayoutStakers.variantId()) {
        const decoded = staking.tx.PayoutStakers.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.tx.PayoutStakersByPage.variantId()) {
        const decoded = staking.tx.PayoutStakersByPage.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.tx.ReapStash.variantId()) {
        const decoded = staking.tx.ReapStash.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.tx.Rebond.variantId()) {
        const decoded = staking.tx.Rebond.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.tx.SetController.variantId()) {
        const decoded = staking.tx.SetController.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.tx.SetPayee.variantId()) {
        const decoded = staking.tx.SetPayee.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.tx.Unbond.variantId()) {
        const decoded = staking.tx.Unbond.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.tx.Validate.variantId()) {
        const decoded = staking.tx.Validate.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.tx.WithdrawUnbonded.variantId()) {
        const decoded = staking.tx.WithdrawUnbonded.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == identity.PALLET_ID) {
      if (variantId == identity.tx.AddSub.variantId()) {
        const decoded = identity.tx.AddSub.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == identity.tx.ClearIdentity.variantId()) {
        const decoded = identity.tx.ClearIdentity.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == identity.tx.QuitSub.variantId()) {
        const decoded = identity.tx.QuitSub.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == identity.tx.RemoveSub.variantId()) {
        const decoded = identity.tx.RemoveSub.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == identity.tx.SetIdentity.variantId()) {
        const decoded = identity.tx.SetIdentity.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == identity.tx.SetSubs.variantId()) {
        const decoded = identity.tx.SetSubs.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == nominationPools.PALLET_ID) {
      if (variantId == nominationPools.tx.BondExtra.variantId()) {
        const decoded = nominationPools.tx.BondExtra.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.tx.BondExtraOther.variantId()) {
        const decoded = nominationPools.tx.BondExtraOther.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.tx.Chill.variantId()) {
        const decoded = nominationPools.tx.Chill.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.tx.ClaimCommission.variantId()) {
        const decoded = nominationPools.tx.ClaimCommission.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.tx.ClaimPayout.variantId()) {
        const decoded = nominationPools.tx.ClaimPayout.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.tx.ClaimPayoutOther.variantId()) {
        const decoded = nominationPools.tx.ClaimPayoutOther.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.tx.Create.variantId()) {
        const decoded = nominationPools.tx.Create.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.tx.CreateWithPoolId.variantId()) {
        const decoded = nominationPools.tx.CreateWithPoolId.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.tx.Join.variantId()) {
        const decoded = nominationPools.tx.Join.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.tx.Nominate.variantId()) {
        const decoded = nominationPools.tx.Nominate.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.tx.SetClaimPermission.variantId()) {
        const decoded = nominationPools.tx.SetClaimPermission.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.tx.SetCommission.variantId()) {
        const decoded = nominationPools.tx.SetCommission.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.tx.SetCommissionChangeRate.variantId()) {
        const decoded = nominationPools.tx.SetCommissionChangeRate.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.tx.SetCommissionMax.variantId()) {
        const decoded = nominationPools.tx.SetCommissionMax.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.tx.SetMetadata.variantId()) {
        const decoded = nominationPools.tx.SetMetadata.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.tx.SetState.variantId()) {
        const decoded = nominationPools.tx.SetState.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.tx.Unbond.variantId()) {
        const decoded = nominationPools.tx.Unbond.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.tx.UpdateRoles.variantId()) {
        const decoded = nominationPools.tx.UpdateRoles.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.tx.WithdrawUnbonded.variantId()) {
        const decoded = nominationPools.tx.WithdrawUnbonded.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    return new AvailError("Failed to decode runtime call")
  }

  encode(): Uint8Array {
    return ICall.encode(this.value)
  }
}
