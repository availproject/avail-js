import { assert_eq } from "."
import { Account, SDK } from "./../src/index"

export async function runTransactionPayment() {
  const sdk = await SDK.New(SDK.localEndpoint)
  const account = Account.alice()
  const tx = sdk.tx.dataAvailability.submitData("0123")

  {
    // payment_query_fee_details
    const fee_details = await tx.paymentQueryFeeDetails(account.address)
    const inclusionFee = fee_details.inclusionFee
    if (inclusionFee == null) throw Error()

    console.log("Base Fee: ", inclusionFee.baseFee.toString())
    console.log("Len Fee: ", inclusionFee.lenFee.toString())
    console.log("Adjusted weight Fee: ", inclusionFee.adjustedWeightFee.toString())
    const totalFee = inclusionFee.adjustedWeightFee.add(inclusionFee.baseFee).add(inclusionFee.lenFee)
    console.log("Total Fee: ", totalFee.toString())

    // payment_query_info
    const info = await tx.paymentQueryInfo(account.address)
    console.log("Partial Fee: ", info.partialFee.toString())
    assert_eq(info.partialFee.toString(), totalFee.toString())

  }

  {
    // payment_query_call_fee_details
    const fee_details = await tx.paymentQueryCallFeeDetails()
    const inclusionFee = fee_details.inclusionFee
    if (inclusionFee == null) throw Error()

    console.log("Base Fee: ", inclusionFee.baseFee.toString())
    console.log("Len Fee: ", inclusionFee.lenFee.toString())
    console.log("Adjusted weight Fee: ", inclusionFee.adjustedWeightFee.toString())
    const totalFee = inclusionFee.adjustedWeightFee.add(inclusionFee.baseFee).add(inclusionFee.lenFee)
    console.log("Total Fee: ", totalFee.toString())

    // payment_query_call_info
    const info = await tx.paymentQueryCallInfo()
    console.log("Partial Fee: ", info.partialFee.toString())
    assert_eq(info.partialFee.toString(), totalFee.toString())
  }

  console.log("runTransactionPayment finished correctly")
}
