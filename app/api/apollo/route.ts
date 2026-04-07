import { NextRequest, NextResponse } from 'next/server';

const APOLLO_URL = 'https://api.apollo.io/v1/mixed_people/search';

export async function POST(req: NextRequest) {
  const apiKey = process.env.APOLLO_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'APOLLO_API_KEY not set' }, { status: 501 });
  }

  const body = await req.json();

  // Apollo requires key in X-Api-Key header (not request body)
  const res = await fetch(APOLLO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();

  // Free plan returns 403 with "API_INACCESSIBLE" — treat as plan upgrade needed
  if (res.status === 403) {
    let parsed: { error_code?: string } = {};
    try { parsed = JSON.parse(text); } catch { /* ignore */ }
    if (parsed.error_code === 'API_INACCESSIBLE') {
      return NextResponse.json(
        { error: 'Apollo plan upgrade required', error_code: 'PLAN_UPGRADE_REQUIRED' },
        { status: 402 }
      );
    }
  }

  if (!res.ok) {
    return NextResponse.json({ error: `Apollo error: ${res.status}`, detail: text }, { status: res.status });
  }

  try {
    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON from Apollo', detail: text }, { status: 502 });
  }
}
