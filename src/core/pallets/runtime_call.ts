import { Decoder } from "../scale/decoder"
import { AvailError } from "../misc/error"

import * as timestamp from "./timestamp/tx"
import * as utility from "./utility/tx"
import * as system from "./system/tx"
import * as proxy from "./proxy/tx"
import * as multisig from "./multisig/tx"
import * as dataAvailability from "./dataAvailability/tx"
import * as balances from "./balances/tx"
import * as staking from "./staking/tx"
import * as identity from "./identity/tx"
import * as nominationPools from "./nomination_pools/tx"
import * as sudo from "./sudo/tx"
import * as session from "./session/tx"
import { ICall } from "../interface"

export type RuntimeCallValue =
  | balances.TransferAllowDeath
  | balances.TransferKeepAlive
  | balances.TransferAll
  | utility.Batch
  | utility.BatchAll
  | utility.ForceBatch
  | system.Remark
  | system.SetCode
  | system.SetCodeWithoutChecks
  | system.RemarkWithEvent
  | proxy.Proxy
  | proxy.AddProxy
  | proxy.RemoveProxy
  | proxy.RemoveProxies
  | proxy.CreatePure
  | proxy.KillPure
  | multisig.AsMultiThreshold1
  | multisig.AsMulti
  | multisig.ApproveAsMulti
  | multisig.CancelAsMulti
  | dataAvailability.CreateApplicationKey
  | dataAvailability.SubmitData
  | staking.Bond
  | staking.BondExtra
  | staking.Chill
  | staking.ChillOther
  | staking.ForceApplyMinCommission
  | staking.Kick
  | staking.Nominate
  | staking.PayoutStakers
  | staking.PayoutStakersByPage
  | staking.ReapStash
  | staking.Rebond
  | staking.SetController
  | staking.SetPayee
  | staking.Unbond
  | staking.Validate
  | staking.WithdrawUnbonded
  | identity.AddSub
  | identity.ClearIdentity
  | identity.QuitSub
  | identity.RemoveSub
  | identity.SetIdentity
  | identity.SetSubs
  | nominationPools.BondExtra
  | nominationPools.BondExtraOther
  | nominationPools.Chill
  | nominationPools.ClaimCommission
  | nominationPools.ClaimPayout
  | nominationPools.ClaimPayoutOther
  | nominationPools.Create
  | nominationPools.CreateWithPoolId
  | nominationPools.Join
  | nominationPools.Nominate
  | nominationPools.SetClaimPermission
  | nominationPools.SetCommission
  | nominationPools.SetCommissionChangeRate
  | nominationPools.SetCommissionMax
  | nominationPools.SetMetadata
  | nominationPools.SetState
  | nominationPools.Unbond
  | nominationPools.UpdateRoles
  | nominationPools.WithdrawUnbonded
  | sudo.Sudo
  | sudo.SudoAs
  | session.SetKeys
  | session.PurgeKeys
  | timestamp.Set

export class RuntimeCall {
  constructor(public value: RuntimeCallValue) {}

  static decode(value: Decoder | string | Uint8Array): RuntimeCall | AvailError {
    const decoder = Decoder.from(value)
    if (decoder instanceof AvailError) return decoder

    const palletId = decoder.u8()
    const variantId = decoder.u8()

    if (palletId == session.PALLET_ID) {
      if (variantId == session.SetKeys.variantId()) {
        const decoded = session.SetKeys.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == session.PurgeKeys.variantId()) {
        const decoded = session.PurgeKeys.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == balances.PALLET_ID) {
      if (variantId == balances.TransferAllowDeath.variantId()) {
        const decoded = balances.TransferAllowDeath.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == balances.TransferKeepAlive.variantId()) {
        const decoded = balances.TransferKeepAlive.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == balances.TransferAll.variantId()) {
        const decoded = balances.TransferAll.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == utility.PALLET_ID) {
      if (variantId == utility.Batch.variantId()) {
        const decoded = utility.Batch.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == utility.BatchAll.variantId()) {
        const decoded = utility.BatchAll.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == utility.ForceBatch.variantId()) {
        const decoded = utility.ForceBatch.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == system.PALLET_ID) {
      if (variantId == system.Remark.variantId()) {
        const decoded = system.Remark.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == system.SetCode.variantId()) {
        const decoded = system.SetCode.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == system.SetCodeWithoutChecks.variantId()) {
        const decoded = system.SetCodeWithoutChecks.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == system.RemarkWithEvent.variantId()) {
        const decoded = system.RemarkWithEvent.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == proxy.PALLET_ID) {
      if (variantId == proxy.Proxy.variantId()) {
        const decoded = proxy.Proxy.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == proxy.AddProxy.variantId()) {
        const decoded = proxy.AddProxy.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == proxy.RemoveProxy.variantId()) {
        const decoded = proxy.RemoveProxy.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == proxy.RemoveProxies.variantId()) {
        const decoded = proxy.RemoveProxies.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == proxy.CreatePure.variantId()) {
        const decoded = proxy.CreatePure.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == proxy.KillPure.variantId()) {
        const decoded = proxy.KillPure.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == multisig.PALLET_ID) {
      if (variantId == multisig.AsMultiThreshold1.variantId()) {
        const decoded = multisig.AsMultiThreshold1.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == multisig.AsMulti.variantId()) {
        const decoded = multisig.AsMulti.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == multisig.ApproveAsMulti.variantId()) {
        const decoded = multisig.ApproveAsMulti.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == multisig.CancelAsMulti.variantId()) {
        const decoded = multisig.CancelAsMulti.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == dataAvailability.PALLET_ID) {
      if (variantId == dataAvailability.CreateApplicationKey.variantId()) {
        const decoded = dataAvailability.CreateApplicationKey.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == dataAvailability.SubmitData.variantId()) {
        const decoded = dataAvailability.SubmitData.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == sudo.PALLET_ID) {
      if (variantId == sudo.Sudo.variantId()) {
        const decoded = sudo.Sudo.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == sudo.SudoAs.variantId()) {
        const decoded = sudo.SudoAs.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == timestamp.PALLET_ID) {
      if (variantId == timestamp.Set.variantId()) {
        const decoded = timestamp.Set.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == staking.PALLET_ID) {
      if (variantId == staking.Bond.variantId()) {
        const decoded = staking.Bond.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.BondExtra.variantId()) {
        const decoded = staking.BondExtra.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.Chill.variantId()) {
        const decoded = staking.Chill.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.ChillOther.variantId()) {
        const decoded = staking.ChillOther.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.ForceApplyMinCommission.variantId()) {
        const decoded = staking.ForceApplyMinCommission.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.Kick.variantId()) {
        const decoded = staking.Kick.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.Nominate.variantId()) {
        const decoded = staking.Nominate.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.PayoutStakers.variantId()) {
        const decoded = staking.PayoutStakers.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.PayoutStakersByPage.variantId()) {
        const decoded = staking.PayoutStakersByPage.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.ReapStash.variantId()) {
        const decoded = staking.ReapStash.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.Rebond.variantId()) {
        const decoded = staking.Rebond.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.SetController.variantId()) {
        const decoded = staking.SetController.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.SetPayee.variantId()) {
        const decoded = staking.SetPayee.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.Unbond.variantId()) {
        const decoded = staking.Unbond.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.Validate.variantId()) {
        const decoded = staking.Validate.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == staking.WithdrawUnbonded.variantId()) {
        const decoded = staking.WithdrawUnbonded.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == identity.PALLET_ID) {
      if (variantId == identity.AddSub.variantId()) {
        const decoded = identity.AddSub.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == identity.ClearIdentity.variantId()) {
        const decoded = identity.ClearIdentity.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == identity.QuitSub.variantId()) {
        const decoded = identity.QuitSub.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == identity.RemoveSub.variantId()) {
        const decoded = identity.RemoveSub.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == identity.SetIdentity.variantId()) {
        const decoded = identity.SetIdentity.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == identity.SetSubs.variantId()) {
        const decoded = identity.SetSubs.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }
    }

    if (palletId == nominationPools.PALLET_ID) {
      if (variantId == nominationPools.BondExtra.variantId()) {
        const decoded = nominationPools.BondExtra.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.BondExtraOther.variantId()) {
        const decoded = nominationPools.BondExtraOther.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.Chill.variantId()) {
        const decoded = nominationPools.Chill.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.ClaimCommission.variantId()) {
        const decoded = nominationPools.ClaimCommission.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.ClaimPayout.variantId()) {
        const decoded = nominationPools.ClaimPayout.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.ClaimPayoutOther.variantId()) {
        const decoded = nominationPools.ClaimPayoutOther.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.Create.variantId()) {
        const decoded = nominationPools.Create.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.CreateWithPoolId.variantId()) {
        const decoded = nominationPools.CreateWithPoolId.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.Join.variantId()) {
        const decoded = nominationPools.Join.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.Nominate.variantId()) {
        const decoded = nominationPools.Nominate.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.SetClaimPermission.variantId()) {
        const decoded = nominationPools.SetClaimPermission.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.SetCommission.variantId()) {
        const decoded = nominationPools.SetCommission.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.SetCommissionChangeRate.variantId()) {
        const decoded = nominationPools.SetCommissionChangeRate.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.SetCommissionMax.variantId()) {
        const decoded = nominationPools.SetCommissionMax.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.SetMetadata.variantId()) {
        const decoded = nominationPools.SetMetadata.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.SetState.variantId()) {
        const decoded = nominationPools.SetState.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.Unbond.variantId()) {
        const decoded = nominationPools.Unbond.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.UpdateRoles.variantId()) {
        const decoded = nominationPools.UpdateRoles.decode(decoder)
        if (decoded instanceof AvailError) return decoded
        return new RuntimeCall(decoded)
      }

      if (variantId == nominationPools.WithdrawUnbonded.variantId()) {
        const decoded = nominationPools.WithdrawUnbonded.decode(decoder)
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
