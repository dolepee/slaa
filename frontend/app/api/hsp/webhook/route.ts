import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const payload = await req.json()

    const { cart_mandate_id, status, tx_signature } = payload

    if (status === 'payment-successful') {
      console.log(`HSP Payment Confirmed:`)
      console.log(`  Cart Mandate: ${cart_mandate_id}`)
      console.log(`  TX: ${tx_signature}`)
      console.log(`  Action: Would call JobEscrow.confirmHSPFunding()`)

      return NextResponse.json({
        code: 0,
        message: 'Webhook received. In production, this triggers JobEscrow.confirmHSPFunding().',
      })
    }

    return NextResponse.json({ code: 0, message: 'Acknowledged' })
  } catch (error: any) {
    return NextResponse.json({ code: 1, msg: error.message }, { status: 500 })
  }
}
