import { NextRequest, NextResponse } from 'next/server';

const APOLLO_URL = 'https://api.apollo.io/v1/mixed_people/search';

export async function POST(req: NextRequest) {
  const apiKey = process.env.APOLLO_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'APOLLO_API_KEY not set' }, { status: 501 });
  }

  const body = await req.json();

  const res = await fetch(APOLLO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
    body: JSON.stringify({ ...body, api_key: apiKey }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `Apollo error: ${res.status}`, detail: text }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
