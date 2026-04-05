import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      message: 'Backend accounts API is scaffolded only. Use /accounts (localStorage mode) for now.',
      phase: '4-backend-migration-scaffold',
    },
    { status: 501 },
  );
}
