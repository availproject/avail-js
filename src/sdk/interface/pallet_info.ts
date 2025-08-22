export interface HasPalletInfo {
  PALLET_ID: number
  VARIANT_ID: number
}

export function addPalletInfo(PALLET_ID: number, VARIANT_ID: number) {
  abstract class BasePalletInfo implements HasPalletInfo {
    static PALLET_ID: number = PALLET_ID
    static VARIANT_ID: number = VARIANT_ID
    readonly PALLET_ID: number = PALLET_ID
    readonly VARIANT_ID: number = VARIANT_ID
  }
  return BasePalletInfo
}
