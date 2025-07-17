export namespace DataAvailability {
  export const PALLET_NAME: string = "dataAvailability"
  export const PALLET_INDEX: number = 29


  export namespace Storage { }
  export namespace Types { }
  export namespace Events { }
  export namespace Tx {
    // Checked
    export class CreateApplicationKey {
      constructor(public key: Uint8Array) { }
      static PALLET_NAME: string = PALLET_NAME
      static PALLET_INDEX: number = PALLET_INDEX
      static CALL_NAME: string = "createApplicationKey"
      static CALL_INDEX: number = 0

      /*       static decode(palletName: string, callName: string, callData: Uint8Array): CreateApplicationKey | null {
              // TODO
              return null;
              if (!palletCallMatch(palletName, callName, this)) {
                return undefined
              }
      
              const decoder = new Decoder(callData, 0)
              return new CreateApplicationKey(decoder.bytesWLen())
            } */
    }

    // Checked
    export class SubmitData {
      constructor(public data: Uint8Array) { }
      static PALLET_NAME: string = PALLET_NAME
      static PALLET_INDEX: number = PALLET_INDEX
      static CALL_NAME: string = "submitData"
      static CALL_INDEX: number = 1

      /*       encode(): Uint8Array {
              const dispatchId = new Uint8Array(2)
              dispatchId[0] = PALLET_INDEX
              dispatchId[1] = SubmitData.CALL_INDEX
      
      
              return dispatchId
            }
      
            static decode(palletName: string, callName: string, callData: Uint8Array): SubmitData | null {
              // TODO
              return null;
      
              if (!palletCallMatch(palletName, callName, this)) {
                return undefined
              }
      
              const decoder = new Decoder(callData, 0)
              return new SubmitData(decoder.bytesWLen())
            } */
    }

  }
}