import { makeStorageDoubleMap, makeStorageMap, makeStorageValue } from "./../storage"
import { AccountId } from "./../../types"
import { Decoder, U128, U32, U8 } from "./../../scale"
import { BN } from "@polkadot/util"
import { PALLET_NAME } from "./header"
import { Vec } from "../../scale/types"
import * as types from "./types"
import { AccountIdScale } from "../../scale/types"

export class SlashingSpans extends makeStorageMap<AccountId, types.SlashingSpansStruct>({
  PALLET_NAME,
  STORAGE_NAME: "SlashingSpans",
  KEY_HASHER: "Twox64Concat",
  decodeKey: AccountIdScale.decode,
  encodeKey: AccountIdScale.encode,
  decodeValue: types.SlashingSpansStruct.decode,
}) {}

export class Payee extends makeStorageMap<AccountId, types.RewardDestinationValue>({
  PALLET_NAME,
  STORAGE_NAME: "Payee",
  KEY_HASHER: "Twox64Concat",
  decodeKey: AccountIdScale.decode,
  encodeKey: AccountIdScale.encode,
  decodeValue: types.RewardDestination.decode,
}) {}

export class Nominators extends makeStorageMap<AccountId, types.Nominations>({
  PALLET_NAME,
  STORAGE_NAME: "Nominators",
  KEY_HASHER: "Twox64Concat",
  decodeKey: AccountIdScale.decode,
  encodeKey: AccountIdScale.encode,
  decodeValue: types.Nominations.decode,
}) {}

export class Ledger extends makeStorageMap<AccountId, types.StakingLedger>({
  PALLET_NAME,
  STORAGE_NAME: "Ledger",
  KEY_HASHER: "Blake2_128Concat",
  decodeKey: AccountIdScale.decode,
  encodeKey: AccountIdScale.encode,
  decodeValue: types.StakingLedger.decode,
}) {}

export class ErasValidatorReward extends makeStorageMap<number /* U32 */, BN /* U128 */>({
  PALLET_NAME,
  STORAGE_NAME: "ErasValidatorReward",
  KEY_HASHER: "Twox64Concat",
  decodeKey: U32.decode,
  encodeKey: U32.encode,
  decodeValue: U128.decode,
}) {}

export class ErasValidatorPrefs extends makeStorageDoubleMap<number /* u32 */, AccountId, types.ValidatorPerfs>({
  PALLET_NAME,
  STORAGE_NAME: "ErasValidatorPrefs",
  KEY1_HASHER: "Twox64Concat",
  KEY2_HASHER: "Twox64Concat",
  decodeKey1: U32.decode,
  decodeKey2: AccountIdScale.decode,
  encodeKey1: U32.encode,
  encodeKey2: AccountIdScale.encode,
  decodeValue: types.ValidatorPerfs.decode,
}) {}

export class ErasTotalStake extends makeStorageMap<number /* U32 */, BN /* U128 */>({
  PALLET_NAME,
  STORAGE_NAME: "ErasTotalStake",
  KEY_HASHER: "Twox64Concat",
  decodeKey: U32.decode,
  encodeKey: U32.encode,
  decodeValue: U128.decode,
}) {}

export class ErasStartSessionIndex extends makeStorageMap<number /* U32 */, number /* U32 */>({
  PALLET_NAME,
  STORAGE_NAME: "ErasStartSessionIndex",
  KEY_HASHER: "Twox64Concat",
  decodeKey: U32.decode,
  encodeKey: U32.encode,
  decodeValue: U32.decode,
}) {}

export class ErasStakersOverview extends makeStorageDoubleMap<number /* u32 */, AccountId, types.PagedExposureMetadata>(
  {
    PALLET_NAME,
    STORAGE_NAME: "ErasStakersOverview",
    KEY1_HASHER: "Twox64Concat",
    KEY2_HASHER: "Twox64Concat",
    decodeKey1: U32.decode,
    decodeKey2: AccountIdScale.decode,
    encodeKey1: U32.encode,
    encodeKey2: AccountIdScale.encode,
    decodeValue: types.PagedExposureMetadata.decode,
  },
) {}

export class ErasRewardPoints extends makeStorageMap<number, types.EraRewardPoints>({
  PALLET_NAME,
  STORAGE_NAME: "ErasRewardPoints",
  KEY_HASHER: "Twox64Concat",
  decodeKey: U32.decode,
  encodeKey: U32.encode,
  decodeValue: types.EraRewardPoints.decode,
}) {}

export class ClaimedRewards extends makeStorageDoubleMap<number, AccountId, number[]>({
  PALLET_NAME,
  STORAGE_NAME: "ClaimedRewards",
  KEY1_HASHER: "Twox64Concat",
  KEY2_HASHER: "Twox64Concat",
  decodeKey1: U32.decode,
  decodeKey2: AccountIdScale.decode,
  encodeKey1: U32.encode,
  encodeKey2: AccountIdScale.encode,
  decodeValue: (decoder: Decoder) => Vec.decode(U32, decoder),
}) {}

export class Validators extends makeStorageMap<AccountId, types.ValidatorPerfs>({
  PALLET_NAME,
  STORAGE_NAME: "Validators",
  KEY_HASHER: "Twox64Concat",
  decodeKey: AccountIdScale.decode,
  encodeKey: AccountIdScale.encode,
  decodeValue: types.ValidatorPerfs.decode,
}) {}

export class Bonded extends makeStorageMap<AccountId, AccountId>({
  PALLET_NAME,
  STORAGE_NAME: "Bonded",
  KEY_HASHER: "Twox64Concat",
  decodeKey: AccountIdScale.decode,
  encodeKey: AccountIdScale.encode,
  decodeValue: AccountIdScale.decode,
}) {}

export class ActiveEra extends makeStorageValue<types.ActiveEraInfo>({
  PALLET_NAME,
  STORAGE_NAME: "ActiveEra",
  decodeValue: types.ActiveEraInfo.decode,
}) {}

export class BondedEras extends makeStorageValue<[number, number][]>({
  PALLET_NAME,
  STORAGE_NAME: "BondedEras",
  decodeValue: types.BondedEraValue.decode,
}) {}

export class MinValidatorBond extends makeStorageValue<BN>({
  PALLET_NAME,
  STORAGE_NAME: "MinValidatorBond",
  decodeValue: U128.decode,
}) {}

export class MinNominatorBond extends makeStorageValue<BN>({
  PALLET_NAME,
  STORAGE_NAME: "MinNominatorBond",
  decodeValue: U128.decode,
}) {}

export class MinimumActiveStake extends makeStorageValue<BN>({
  PALLET_NAME,
  STORAGE_NAME: "MinimumActiveStake",
  decodeValue: U128.decode,
}) {}

export class MinimumValidatorCount extends makeStorageValue<number>({
  PALLET_NAME,
  STORAGE_NAME: "MinimumValidatorCount",
  decodeValue: U32.decode,
}) {}

export class MaxValidatorsCount extends makeStorageValue<number | null>({
  PALLET_NAME,
  STORAGE_NAME: "MaxValidatorsCount",
  decodeValue: U32.decode,
}) {}

export class MaxNominatorsCount extends makeStorageValue<number | null>({
  PALLET_NAME,
  STORAGE_NAME: "MaxNominatorsCount",
  decodeValue: U32.decode,
}) {}

export class ValidatorCount extends makeStorageValue<number>({
  PALLET_NAME,
  STORAGE_NAME: "ValidatorCount",
  decodeValue: U32.decode,
}) {}

export class CurrentEra extends makeStorageValue<number | null>({
  PALLET_NAME,
  STORAGE_NAME: "CurrentEra",
  decodeValue: U32.decode,
}) {}

export class CurrentPlannedSession extends makeStorageValue<number | null>({
  PALLET_NAME,
  STORAGE_NAME: "CurrentPlannedSession",
  decodeValue: U32.decode,
}) {}

export class CounterForValidators extends makeStorageValue<number>({
  PALLET_NAME,
  STORAGE_NAME: "CounterForValidators",
  decodeValue: U32.decode,
}) {}

export class CounterForNominators extends makeStorageValue<number>({
  PALLET_NAME,
  STORAGE_NAME: "CounterForNominators",
  decodeValue: U32.decode,
}) {}

export class ForceEra extends makeStorageValue<types.ForcingValue>({
  PALLET_NAME,
  STORAGE_NAME: "ForceEra",
  decodeValue: types.Forcing.decode,
}) {}

export class MinCommission extends makeStorageValue<number>({
  PALLET_NAME,
  STORAGE_NAME: "MinCommission",
  decodeValue: types.Perbill.decode,
}) {}

export class ChillThreshold extends makeStorageValue<number>({
  PALLET_NAME,
  STORAGE_NAME: "ChillThreshold",
  decodeValue: U8.decode,
}) {}

export class CanceledSlashPayout extends makeStorageValue<BN>({
  PALLET_NAME,
  STORAGE_NAME: "CanceledSlashPayout",
  decodeValue: U128.decode,
}) {}
