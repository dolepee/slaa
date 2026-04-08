import { NextResponse } from 'next/server'

const HSP_PROXY_URL = process.env.HSP_PROXY_URL || 'http://38.49.210.117:3001'

export async function POST(req: Request) {
  try {
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
