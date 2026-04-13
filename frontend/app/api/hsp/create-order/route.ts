import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const HSP_PROXY_URL = process.env.HSP_PROXY_URL
    if (!HSP_PROXY_URL) {
      return NextResponse.json(
        {
          success: false,
          error: 'HSP proxy is not configured. Set HSP_PROXY_URL for live Cart Mandate order creation.',
        },
        { status: 503 }
      )
    }

    const body = await req.json()

    const proxyRes = await fetch(`${HSP_PROXY_URL}/api/hsp/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await proxyRes.json()
    return NextResponse.json(data, { status: proxyRes.status })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('HSP proxy error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}
