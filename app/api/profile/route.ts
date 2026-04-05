import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      message: 'Backend profile API is not connected yet. Use /settings/profile (local mode) for now.',
      phase: '4-backend-migration-scaffold',
    },
    { status: 501 },
  );
}
