import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const payload = await req.json()

    const { cart_mandate_id, status, tx_signature } = payload

    if (status === 'payment-successful') {
      console.log(`HSP Payment Confirmed:`)
      console.log(`  Cart Mandate: ${cart_mandate_id}`)
      console.log(`  TX: ${tx_signature}`)
      console.log(`  Action: MockHSP simulation only; production webhook would call JobEscrow.confirmHSPFunding()`)

      return NextResponse.json({
        code: 0,
        message: 'MockHSP webhook acknowledged. Production HSP webhook would verify signature and trigger JobEscrow.confirmHSPFunding().',
      })
    }

    return NextResponse.json({ code: 0, message: 'Acknowledged' })
  } catch (error: any) {
    return NextResponse.json({ code: 1, msg: error.message }, { status: 500 })
  }
}
