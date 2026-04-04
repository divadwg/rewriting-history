import { NextResponse } from 'next/server';
import { saveResult, listResults } from '@/lib/storage/results';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, title, data } = body as {
      type: 'live' | 'challenge';
      title: string;
      data: Record<string, unknown>;
    };

    if (!type || !title || !data) {
      return NextResponse.json({ error: 'Missing type, title, or data' }, { status: 400 });
    }

    const result = saveResult(type, title, data);
    return NextResponse.json({ id: result.id, url: `/results/${result.id}` });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const results = listResults();
    return NextResponse.json(results.map(r => ({
      id: r.id,
      type: r.type,
      title: r.title,
      createdAt: r.createdAt,
    })));
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
