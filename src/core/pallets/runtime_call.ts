import { Decoder, IDecodable } from "../scale/decoder"
import { DecodeError } from "../../errors/sdk-error"
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
import { IHeader, scaleEncodeHeaderAndEncodable } from "../interface"

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

function matches(palletId: number, variantId: number, header: IHeader): boolean {
  return palletId == header.palletId() && variantId == header.variantId()
}

function toRuntimeCall<T extends RuntimeCallValue>(as: IDecodable<T>, decoder: Decoder): RuntimeCall {
  const decoded = as.decode(decoder)
  return new RuntimeCall(decoded)
}

export class RuntimeCall {
  constructor(public value: RuntimeCallValue) {}

  static decode(value: Decoder | string | Uint8Array): RuntimeCall {
    const decoder = Decoder.from(value)

    const palletId = decoder.u8()
    const variantId = decoder.u8()

    if (matches(palletId, variantId, session.SetKeys)) {
      return toRuntimeCall(session.SetKeys, decoder)
    }
    if (matches(palletId, variantId, session.PurgeKeys)) {
      return toRuntimeCall(session.PurgeKeys, decoder)
    }

    if (matches(palletId, variantId, balances.TransferAllowDeath)) {
      return toRuntimeCall(balances.TransferAllowDeath, decoder)
    }
    if (matches(palletId, variantId, balances.TransferKeepAlive)) {
      return toRuntimeCall(balances.TransferKeepAlive, decoder)
    }
    if (matches(palletId, variantId, balances.TransferAll)) {
      return toRuntimeCall(balances.TransferAll, decoder)
    }

    if (matches(palletId, variantId, utility.Batch)) {
      return toRuntimeCall(utility.Batch, decoder)
    }
    if (matches(palletId, variantId, utility.BatchAll)) {
      return toRuntimeCall(utility.BatchAll, decoder)
    }
    if (matches(palletId, variantId, utility.ForceBatch)) {
      return toRuntimeCall(utility.ForceBatch, decoder)
    }

    if (matches(palletId, variantId, system.Remark)) {
      return toRuntimeCall(system.Remark, decoder)
    }
    if (matches(palletId, variantId, system.SetCode)) {
      return toRuntimeCall(system.SetCode, decoder)
    }
    if (matches(palletId, variantId, system.SetCodeWithoutChecks)) {
      return toRuntimeCall(system.SetCodeWithoutChecks, decoder)
    }
    if (matches(palletId, variantId, system.RemarkWithEvent)) {
      return toRuntimeCall(system.RemarkWithEvent, decoder)
    }

    if (matches(palletId, variantId, proxy.Proxy)) {
      return toRuntimeCall(proxy.Proxy, decoder)
    }
    if (matches(palletId, variantId, proxy.AddProxy)) {
      return toRuntimeCall(proxy.AddProxy, decoder)
    }
    if (matches(palletId, variantId, proxy.RemoveProxy)) {
      return toRuntimeCall(proxy.RemoveProxy, decoder)
    }
    if (matches(palletId, variantId, proxy.RemoveProxies)) {
      return toRuntimeCall(proxy.RemoveProxies, decoder)
    }
    if (matches(palletId, variantId, proxy.CreatePure)) {
      return toRuntimeCall(proxy.CreatePure, decoder)
    }
    if (matches(palletId, variantId, proxy.KillPure)) {
      return toRuntimeCall(proxy.KillPure, decoder)
    }

    if (matches(palletId, variantId, multisig.AsMultiThreshold1)) {
      return toRuntimeCall(multisig.AsMultiThreshold1, decoder)
    }
    if (matches(palletId, variantId, multisig.AsMulti)) {
      return toRuntimeCall(multisig.AsMulti, decoder)
    }
    if (matches(palletId, variantId, multisig.ApproveAsMulti)) {
      return toRuntimeCall(multisig.ApproveAsMulti, decoder)
    }
    if (matches(palletId, variantId, multisig.CancelAsMulti)) {
      return toRuntimeCall(multisig.CancelAsMulti, decoder)
    }

    if (matches(palletId, variantId, dataAvailability.CreateApplicationKey)) {
      return toRuntimeCall(dataAvailability.CreateApplicationKey, decoder)
    }
    if (matches(palletId, variantId, dataAvailability.SubmitData)) {
      return toRuntimeCall(dataAvailability.SubmitData, decoder)
    }

    if (matches(palletId, variantId, sudo.Sudo)) {
      return toRuntimeCall(sudo.Sudo, decoder)
    }
    if (matches(palletId, variantId, sudo.SudoAs)) {
      return toRuntimeCall(sudo.SudoAs, decoder)
    }

    if (matches(palletId, variantId, timestamp.Set)) {
      return toRuntimeCall(timestamp.Set, decoder)
    }

    if (matches(palletId, variantId, staking.Bond)) {
      return toRuntimeCall(staking.Bond, decoder)
    }
    if (matches(palletId, variantId, staking.BondExtra)) {
      return toRuntimeCall(staking.BondExtra, decoder)
    }
    if (matches(palletId, variantId, staking.Chill)) {
      return toRuntimeCall(staking.Chill, decoder)
    }
    if (matches(palletId, variantId, staking.ChillOther)) {
      return toRuntimeCall(staking.ChillOther, decoder)
    }
    if (matches(palletId, variantId, staking.ForceApplyMinCommission)) {
      return toRuntimeCall(staking.ForceApplyMinCommission, decoder)
    }
    if (matches(palletId, variantId, staking.Kick)) {
      return toRuntimeCall(staking.Kick, decoder)
    }
    if (matches(palletId, variantId, staking.Nominate)) {
      return toRuntimeCall(staking.Nominate, decoder)
    }
    if (matches(palletId, variantId, staking.PayoutStakers)) {
      return toRuntimeCall(staking.PayoutStakers, decoder)
    }
    if (matches(palletId, variantId, staking.PayoutStakersByPage)) {
      return toRuntimeCall(staking.PayoutStakersByPage, decoder)
    }
    if (matches(palletId, variantId, staking.ReapStash)) {
      return toRuntimeCall(staking.ReapStash, decoder)
    }
    if (matches(palletId, variantId, staking.Rebond)) {
      return toRuntimeCall(staking.Rebond, decoder)
    }
    if (matches(palletId, variantId, staking.SetController)) {
      return toRuntimeCall(staking.SetController, decoder)
    }
    if (matches(palletId, variantId, staking.SetPayee)) {
      return toRuntimeCall(staking.SetPayee, decoder)
    }
    if (matches(palletId, variantId, staking.Unbond)) {
      return toRuntimeCall(staking.Unbond, decoder)
    }
    if (matches(palletId, variantId, staking.Validate)) {
      return toRuntimeCall(staking.Validate, decoder)
    }
    if (matches(palletId, variantId, staking.WithdrawUnbonded)) {
      return toRuntimeCall(staking.WithdrawUnbonded, decoder)
    }

    if (matches(palletId, variantId, identity.AddSub)) {
      return toRuntimeCall(identity.AddSub, decoder)
    }
    if (matches(palletId, variantId, identity.ClearIdentity)) {
      return toRuntimeCall(identity.ClearIdentity, decoder)
    }
    if (matches(palletId, variantId, identity.QuitSub)) {
      return toRuntimeCall(identity.QuitSub, decoder)
    }
    if (matches(palletId, variantId, identity.RemoveSub)) {
      return toRuntimeCall(identity.RemoveSub, decoder)
    }
    if (matches(palletId, variantId, identity.SetIdentity)) {
      return toRuntimeCall(identity.SetIdentity, decoder)
    }
    if (matches(palletId, variantId, identity.SetSubs)) {
      return toRuntimeCall(identity.SetSubs, decoder)
    }

    if (matches(palletId, variantId, nominationPools.BondExtra)) {
      return toRuntimeCall(nominationPools.BondExtra, decoder)
    }
    if (matches(palletId, variantId, nominationPools.BondExtraOther)) {
      return toRuntimeCall(nominationPools.BondExtraOther, decoder)
    }
    if (matches(palletId, variantId, nominationPools.Chill)) {
      return toRuntimeCall(nominationPools.Chill, decoder)
    }
    if (matches(palletId, variantId, nominationPools.ClaimCommission)) {
      return toRuntimeCall(nominationPools.ClaimCommission, decoder)
    }
    if (matches(palletId, variantId, nominationPools.ClaimPayout)) {
      return toRuntimeCall(nominationPools.ClaimPayout, decoder)
    }
    if (matches(palletId, variantId, nominationPools.ClaimPayoutOther)) {
      return toRuntimeCall(nominationPools.ClaimPayoutOther, decoder)
    }
    if (matches(palletId, variantId, nominationPools.Create)) {
      return toRuntimeCall(nominationPools.Create, decoder)
    }
    if (matches(palletId, variantId, nominationPools.CreateWithPoolId)) {
      return toRuntimeCall(nominationPools.CreateWithPoolId, decoder)
    }
    if (matches(palletId, variantId, nominationPools.Join)) {
      return toRuntimeCall(nominationPools.Join, decoder)
    }
    if (matches(palletId, variantId, nominationPools.Nominate)) {
      return toRuntimeCall(nominationPools.Nominate, decoder)
    }
    if (matches(palletId, variantId, nominationPools.SetClaimPermission)) {
      return toRuntimeCall(nominationPools.SetClaimPermission, decoder)
    }
    if (matches(palletId, variantId, nominationPools.SetCommission)) {
      return toRuntimeCall(nominationPools.SetCommission, decoder)
    }
    if (matches(palletId, variantId, nominationPools.SetCommissionChangeRate)) {
      return toRuntimeCall(nominationPools.SetCommissionChangeRate, decoder)
    }
    if (matches(palletId, variantId, nominationPools.SetCommissionMax)) {
      return toRuntimeCall(nominationPools.SetCommissionMax, decoder)
    }
    if (matches(palletId, variantId, nominationPools.SetMetadata)) {
      return toRuntimeCall(nominationPools.SetMetadata, decoder)
    }
    if (matches(palletId, variantId, nominationPools.SetState)) {
      return toRuntimeCall(nominationPools.SetState, decoder)
    }
    if (matches(palletId, variantId, nominationPools.Unbond)) {
      return toRuntimeCall(nominationPools.Unbond, decoder)
    }
    if (matches(palletId, variantId, nominationPools.UpdateRoles)) {
      return toRuntimeCall(nominationPools.UpdateRoles, decoder)
    }
    if (matches(palletId, variantId, nominationPools.WithdrawUnbonded)) {
      return toRuntimeCall(nominationPools.WithdrawUnbonded, decoder)
    }

    throw new DecodeError("Failed to decode runtime call")
  }

  encode(): Uint8Array {
    return scaleEncodeHeaderAndEncodable(this.value)
  }
}
