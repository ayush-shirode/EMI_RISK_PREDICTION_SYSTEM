import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'user_123';

    const client = await clientPromise;
    const db = client.db('emi_system');

    const prediction = await db.collection('predictions')
      .findOne({ user_id: userId }, { sort: { created_at: -1 } });

    if (!prediction) {
      return NextResponse.json({ error: 'No prediction found for this user.' }, { status: 404 });
    }
    return NextResponse.json(prediction);
  } catch (error: any) {
    console.error('[API Risk GET] Error:', error.message || error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
