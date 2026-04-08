import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { JOB_ESCROW_ABI } from '../../../../lib/contracts'
import { hashkeyTestnet, CONTRACTS } from '../../../../lib/config'

const HSP_APP_SECRET = process.env.HSP_APP_SECRET!
const DEPLOYER_KEY = process.env.PRIVATE_KEY!

function verifySignature(signatureHeader: string, rawBody: string): boolean {
  if (!signatureHeader) return false

  let ts = ''
  let received = ''
  for (const part of signatureHeader.split(',')) {
    if (part.startsWith('t=')) ts = part.slice(2)
    else if (part.startsWith('v1=')) received = part.slice(3)
  }

  if (!ts || !received) return false

  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - parseInt(ts)) > 300) return false

  const message = `${ts}.${rawBody}`
  const expected = createHmac('sha256', HSP_APP_SECRET).update(message).digest('hex')

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(received))
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signatureHeader = req.headers.get('X-Signature') || ''

    if (!verifySignature(signatureHeader, rawBody)) {
      console.error('HSP webhook: invalid signature')
      return NextResponse.json({ code: 1, msg: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)
    const { cart_mandate_id, status, amount, token, tx_signature } = payload

    console.log(`HSP Webhook received: status=${status}, cart_mandate_id=${cart_mandate_id}, tx=${tx_signature}`)

    if (status === 'payment-successful') {
      // Extract jobId from cart_mandate_id format: SLAA-JOB-{jobId}-{timestamp}
      const parts = cart_mandate_id.split('-')
      const jobId = parseInt(parts[2])

      if (isNaN(jobId) || jobId <= 0) {
        console.error('HSP webhook: cannot parse jobId from cart_mandate_id:', cart_mandate_id)
        return NextResponse.json({ code: 0 })
      }

      console.log(`HSP payment confirmed for job ${jobId}: ${amount} ${token}, tx: ${tx_signature}`)

      // Call JobEscrow.confirmHSPFunding on-chain
      try {
        const account = privateKeyToAccount(DEPLOYER_KEY as `0x${string}`)
        const walletClient = createWalletClient({
          account,
          chain: hashkeyTestnet,
          transport: http(),
        })
        const publicClient = createPublicClient({
          chain: hashkeyTestnet,
          transport: http(),
        })

        const txHash = await walletClient.writeContract({
          address: CONTRACTS.jobEscrow as `0x${string}`,
          abi: JOB_ESCROW_ABI,
          functionName: 'confirmHSPFunding',
          args: [BigInt(jobId), cart_mandate_id],
        })

        console.log(`confirmHSPFunding tx submitted: ${txHash}`)

        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
        console.log(`confirmHSPFunding confirmed in block ${receipt.blockNumber}`)
      } catch (chainErr: unknown) {
        const msg = chainErr instanceof Error ? chainErr.message : 'Unknown chain error'
        console.error('HSP webhook: on-chain confirmHSPFunding failed:', msg)
        // Still return 200 so HSP doesn't retry; we can query and retry manually
      }
    }

    return NextResponse.json({ code: 0 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('HSP webhook exception:', message)
    return NextResponse.json({ code: 0 })
  }
}
