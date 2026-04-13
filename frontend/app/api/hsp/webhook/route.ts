import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createPublicClient, createWalletClient, http, parseUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { JOB_ESCROW_ABI } from '../../../../lib/contracts'
import { hashkeyTestnet, CONTRACTS } from '../../../../lib/config'

const HSP_APP_SECRET = process.env.HSP_APP_SECRET!
const DEPLOYER_KEY = process.env.PRIVATE_KEY!
const HSP_USDC_ADDRESS = (process.env.HSP_USDC_ADDRESS || CONTRACTS.usdc).toLowerCase()

function normalizeUsdcAmount(amount: unknown): bigint | null {
  if (typeof amount !== 'string' && typeof amount !== 'number') return null
  try {
    return parseUnits(String(amount), 6)
  } catch {
    return null
  }
}

function tokenMatchesUsdc(token: unknown): boolean {
  if (typeof token !== 'string') return false
  const normalized = token.trim().toLowerCase()
  return normalized === 'usdc' || normalized === HSP_USDC_ADDRESS
}

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

      const publicClient = createPublicClient({
        chain: hashkeyTestnet,
        transport: http(),
      })

      const job = await publicClient.readContract({
        address: CONTRACTS.jobEscrow as `0x${string}`,
        abi: JOB_ESCROW_ABI,
        functionName: 'getJob',
        args: [BigInt(jobId)],
      }) as {
        reward?: bigint
        status?: number
        fundedViaHSP?: boolean
      }

      const reward = job.reward ?? BigInt(0)
      const currentStatus = Number(job.status ?? 0)
      const alreadyFundedViaHSP = Boolean(job.fundedViaHSP ?? false)

      if (alreadyFundedViaHSP && currentStatus >= 1) {
        console.log(`HSP webhook: job ${jobId} already confirmed via HSP, acknowledging duplicate webhook`)
        return NextResponse.json({ code: 0 })
      }

      if (currentStatus !== 0) {
        console.error(`HSP webhook: job ${jobId} is not in Created state (status=${currentStatus})`)
        return NextResponse.json({ code: 1, msg: 'Job is not in a fundable state' }, { status: 409 })
      }

      const parsedAmount = normalizeUsdcAmount(amount)
      if (parsedAmount === null || parsedAmount !== reward) {
        console.error(`HSP webhook: amount mismatch for job ${jobId}. expected=${reward.toString()} got=${String(amount)}`)
        return NextResponse.json({ code: 1, msg: 'Amount mismatch' }, { status: 400 })
      }

      if (!tokenMatchesUsdc(token)) {
        console.error(`HSP webhook: token mismatch for job ${jobId}. received=${String(token)}`)
        return NextResponse.json({ code: 1, msg: 'Token mismatch' }, { status: 400 })
      }

      if (typeof tx_signature !== 'string' || tx_signature.trim().length === 0) {
        console.error(`HSP webhook: missing payment reference for job ${jobId}`)
        return NextResponse.json({ code: 1, msg: 'Missing payment reference' }, { status: 400 })
      }

      // Call JobEscrow.confirmHSPFunding on-chain
      try {
        const account = privateKeyToAccount(DEPLOYER_KEY as `0x${string}`)
        const walletClient = createWalletClient({
          account,
          chain: hashkeyTestnet,
          transport: http(),
        })

        const txHash = await walletClient.writeContract({
          address: CONTRACTS.jobEscrow as `0x${string}`,
          abi: JOB_ESCROW_ABI,
          functionName: 'confirmHSPFunding',
          args: [BigInt(jobId), cart_mandate_id, tx_signature],
        })

        console.log(`confirmHSPFunding tx submitted: ${txHash}`)

        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
        console.log(`confirmHSPFunding confirmed in block ${receipt.blockNumber}`)
      } catch (chainErr: unknown) {
        const msg = chainErr instanceof Error ? chainErr.message : 'Unknown chain error'
        console.error('HSP webhook: on-chain confirmHSPFunding failed:', msg)

        try {
          const jobAfter = await publicClient.readContract({
            address: CONTRACTS.jobEscrow as `0x${string}`,
            abi: JOB_ESCROW_ABI,
            functionName: 'getJob',
            args: [BigInt(jobId)],
          }) as {
            status?: number
            fundedViaHSP?: boolean
          }

          if (Boolean(jobAfter.fundedViaHSP ?? false) && Number(jobAfter.status ?? 0) >= 1) {
            console.log(`HSP webhook: job ${jobId} was confirmed despite receipt/polling error`)
            return NextResponse.json({ code: 0 })
          }
        } catch (postReadErr: unknown) {
          const postReadMsg = postReadErr instanceof Error ? postReadErr.message : 'Unknown post-read error'
          console.error('HSP webhook: post-failure state check failed:', postReadMsg)
        }

        return NextResponse.json({ code: 1, msg: 'On-chain confirmation failed' }, { status: 502 })
      }
    }

    return NextResponse.json({ code: 0 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('HSP webhook exception:', message)
    return NextResponse.json({ code: 1, msg: message }, { status: 500 })
  }
}
