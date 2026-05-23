import { NextResponse } from 'next/server';

const MAX_REASONABLE_EMI = 500_000; // ₹5,00,000

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, emiAmount, emiDueDate } = body;

    // ── Input validation ──────────────────────────────────────────────────
    if (!userId || emiAmount === undefined || !emiDueDate) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, emiAmount, emiDueDate' },
        { status: 400 }
      );
    }

    const parsedAmount = Number(emiAmount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'EMI amount must be a positive number.' },
        { status: 400 }
      );
    }

    if (parsedAmount > MAX_REASONABLE_EMI) {
      return NextResponse.json(
        {
          error:
            `EMI amount ₹${parsedAmount.toLocaleString('en-IN')} is unrealistically high. ` +
            `The maximum accepted value is ₹${MAX_REASONABLE_EMI.toLocaleString('en-IN')} (₹5 lakh). ` +
            `Please enter your actual monthly EMI amount, not the total loan amount or an annual figure.`,
        },
        { status: 400 }
      );
    }
    // ─────────────────────────────────────────────────────────────────────

    const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://ai-engine:3002';
    console.log(
      `[API Risk Trigger] Forwarding prediction to ${aiEngineUrl}/predict — user: ${userId}, EMI: ₹${parsedAmount}, due: ${emiDueDate}`
    );

    const res = await fetch(`${aiEngineUrl}/predict`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId, emiAmount: parsedAmount, emiDueDate }),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(async () => ({ details: await res.text() }));
      const detail    = errorBody?.details || errorBody?.error || 'Unknown AI engine error';

      // Surface a human-friendly message for known error types
      if (typeof detail === 'string' && detail.includes('cluster_block_exception')) {
        return NextResponse.json(
          {
            error:
              'Prediction saved to database, but Elasticsearch is temporarily read-only (disk full). ' +
              'The risk score is available in MongoDB. Contact your system admin to free disk space.',
          },
          { status: 503 }
        );
      }

      return NextResponse.json({ error: 'AI Engine error: ' + detail }, { status: res.status });
    }

    const prediction = await res.json();
    return NextResponse.json(prediction);
  } catch (error: any) {
    console.error('[API Risk Trigger] Unexpected error:', error.message || error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
