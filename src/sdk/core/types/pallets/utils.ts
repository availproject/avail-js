export function addHeader(PALLET_ID: number, VARIANT_ID: number) {
  abstract class Header {
    static palletId(): number {
      return PALLET_ID
    }
    static variantId(): number {
      return VARIANT_ID
    }
    palletId(): number {
      return Header.palletId()
    }
    variantId(): number {
      return Header.variantId()
    }
  }

  return Header
}
