import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://ai-engine:3002';

    console.log(`[API Risk Trigger] Forwarding prediction trigger to ${aiEngineUrl}/predict for user: ${body.userId}`);

    const res = await fetch(`${aiEngineUrl}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: 'AI Engine failed: ' + errorText }, { status: res.status });
    }

    const prediction = await res.json();
    return NextResponse.json(prediction);
  } catch (error: any) {
    console.error('[API Risk Trigger] Error:', error.message || error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
