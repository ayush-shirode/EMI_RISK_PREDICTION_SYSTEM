import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'user_123';

    const client = await clientPromise;
    const db = client.db('emi_system');

    const history = await db.collection('predictions')
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray();

    return NextResponse.json(history);
  } catch (error: any) {
    console.error('[API Alerts GET] Error:', error.message || error);
    return NextResponse.json([], { status: 500 });
  }
}
