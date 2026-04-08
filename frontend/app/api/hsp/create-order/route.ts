import { NextResponse } from 'next/server'
import { createHash, createHmac, createPrivateKey, createSign, randomBytes } from 'crypto'
import { CONTRACTS } from '../../../../lib/config'

const HSP_BASE = process.env.HSP_API_BASE || 'https://merchant-qa.hashkeymerchant.com'
const HSP_APP_KEY = process.env.HSP_APP_KEY!
const HSP_APP_SECRET = process.env.HSP_APP_SECRET!
const HSP_MERCHANT_PRIVATE_KEY = (process.env.HSP_MERCHANT_PRIVATE_KEY || '').replace(/\\n/g, '\n')
const MERCHANT_NAME = process.env.HSP_MERCHANT_NAME || 'SLAA Protocol'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://slaa-protocol.vercel.app'
const JOB_ESCROW = process.env.JOB_ESCROW_ADDRESS || CONTRACTS.jobEscrow
const USDC_ADDRESS = process.env.HSP_USDC_ADDRESS || CONTRACTS.usdc

function sortKeys(val: unknown): unknown {
  if (val === null || typeof val !== 'object') return val
  if (Array.isArray(val)) return val.map(sortKeys)
  const sorted: Record<string, unknown> = {}
  for (const key of Object.keys(val as Record<string, unknown>).sort()) {
    sorted[key] = sortKeys((val as Record<string, unknown>)[key])
  }
  return sorted
}

function canonicalJSON(obj: unknown): string {
  return JSON.stringify(sortKeys(obj))
}

function hmacSign(method: string, path: string, query: string, bodyHash: string, timestamp: string, nonce: string): string {
  const message = `${method}\n${path}\n${query}\n${bodyHash}\n${timestamp}\n${nonce}`
  return createHmac('sha256', HSP_APP_SECRET).update(message).digest('hex')
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value).toString('base64url')
}

function signMerchantAuthorization(claims: Record<string, unknown>): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'ES256K', typ: 'JWT' }))
  const payload = base64UrlEncode(JSON.stringify(claims))
  const signingInput = `${header}.${payload}`

  const signature = createSign('SHA256')
    .update(signingInput)
    .end()
    .sign({
      key: createPrivateKey(HSP_MERCHANT_PRIVATE_KEY),
      dsaEncoding: 'ieee-p1363',
    })

  return `${signingInput}.${signature.toString('base64url')}`
}

export async function POST(req: Request) {
  try {
    const { jobId, rewardUSDC } = await req.json()

    if (!jobId || Number(jobId) <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid jobId' }, { status: 400 })
    }

    if (!rewardUSDC || Number(rewardUSDC) <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid reward amount' }, { status: 400 })
    }

    if (!HSP_APP_KEY || !HSP_APP_SECRET || !HSP_MERCHANT_PRIVATE_KEY) {
      return NextResponse.json({ success: false, error: 'HSP credentials not configured' }, { status: 500 })
    }

    const cartMandateId = `SLAA-JOB-${jobId}-${Date.now()}`
    const paymentRequestId = `PAY-${cartMandateId}`
    const amountStr = String(rewardUSDC)

    const expiry = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

    const contents = {
      id: cartMandateId,
      user_cart_confirmation_required: true,
      payment_request: {
        method_data: [
          {
            supported_methods: 'https://www.x402.org/',
            data: {
              x402Version: 2,
              network: 'hashkey-testnet',
              chain_id: 133,
              contract_address: USDC_ADDRESS,
              pay_to: JOB_ESCROW,
              coin: 'USDC',
            },
          },
        ],
        details: {
          id: paymentRequestId,
          display_items: [
            {
              label: `SLAA Job #${jobId} Payment`,
              amount: { currency: 'USD', value: amountStr },
            },
          ],
          total: {
            label: 'Total',
            amount: { currency: 'USD', value: amountStr },
          },
        },
      },
      cart_expiry: expiry,
      merchant_name: MERCHANT_NAME,
    }

    // Canonical JSON -> SHA-256 -> cart_hash
    const canonical = canonicalJSON(contents)
    const cartHash = createHash('sha256').update(canonical).digest('hex')

    const now = Math.floor(Date.now() / 1000)
    const jwt = signMerchantAuthorization({
      cart_hash: cartHash,
      iss: MERCHANT_NAME,
      sub: MERCHANT_NAME,
      aud: 'HashkeyMerchant',
      iat: now,
      exp: now + 3600,
      jti: `JWT-${now}-${randomBytes(8).toString('hex')}`,
    })

    const body = {
      cart_mandate: {
        contents,
        merchant_authorization: jwt,
      },
      redirect_url: `${APP_URL.replace(/\/$/, '')}/jobs/${jobId}`,
    }

    // HMAC-SHA256 request signing
    const bodyStr = canonicalJSON(body)
    const bodyHash = createHash('sha256').update(bodyStr).digest('hex')
    const timestamp = String(Math.floor(Date.now() / 1000))
    const nonce = randomBytes(16).toString('hex')
    const apiPath = '/api/v1/merchant/orders'
    const signature = hmacSign('POST', apiPath, '', bodyHash, timestamp, nonce)

    const hspResponse = await fetch(`${HSP_BASE}${apiPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Key': HSP_APP_KEY,
        'X-Timestamp': timestamp,
        'X-Nonce': nonce,
        'X-Signature': signature,
      },
      body: bodyStr,
    })

    const hspData = await hspResponse.json()

    if (hspData.code !== 0) {
      console.error('HSP create-order error:', hspData)
      return NextResponse.json({
        success: false,
        error: hspData.msg || 'HSP order creation failed',
        hspCode: hspData.code,
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      cartMandateId,
      paymentUrl: hspData.data.payment_url,
      paymentRequestId: hspData.data.payment_request_id,
      jobId,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('HSP create-order exception:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
