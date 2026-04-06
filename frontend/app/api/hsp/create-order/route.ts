import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { jobId, rewardUSDC, cartMandateId } = await req.json()

    const response = {
      success: true,
      cartMandateId: cartMandateId || `SLAA-JOB-${jobId}-${Date.now()}`,
      jobId,
      amount: rewardUSDC,
      message: 'Order created. In production, payer would be redirected to HSP checkout. For demo, use MockHSP.payOrder() directly.',
      hspFlow: {
        step1: 'Merchant signs cart_mandate with ES256K JWT',
        step2: 'POST /api/v1/merchant/orders to HSP gateway',
        step3: 'Payer redirected to HSP checkout URL',
        step4: 'Payer signs EIP-712 USDC authorization in wallet',
        step5: 'HSP broadcasts on-chain transaction',
        step6: 'HSP webhook calls /api/hsp/webhook with payment-successful',
        step7: 'Backend calls JobEscrow.confirmHSPFunding()',
      }
    }

    return NextResponse.json(response)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
