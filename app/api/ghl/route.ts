import { NextRequest, NextResponse } from 'next/server';

// GoHighLevel API v1 — Create Contact
// Docs: https://highlevel.stoplight.io/docs/integrations/00d0c0ecaa369-create-contact
const GHL_URL = 'https://rest.gohighlevel.com/v1/contacts/';

export async function POST(req: NextRequest) {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;

  if (!apiKey || !locationId) {
    return NextResponse.json(
      { error: 'GHL_API_KEY or GHL_LOCATION_ID not set in .env.local' },
      { status: 501 }
    );
  }

  const body = await req.json() as {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    companyName?: string;
    website?: string;
    city?: string;
    state?: string;
    tags?: string[];
    source?: string;
    customField?: Record<string, string>;
  };

  // Map Sparkline lead fields → GHL contact fields
  const ghlPayload = {
    locationId,
    firstName: body.firstName ?? '',
    lastName: body.lastName ?? '',
    email: body.email ?? '',
    phone: body.phone ?? '',
    companyName: body.companyName ?? '',
    website: body.website ?? '',
    city: body.city ?? '',
    state: body.state ?? '',
    source: body.source ?? 'Sparkline',
    tags: body.tags ?? ['sparkline-lead'],
    customField: body.customField ?? {},
  };

  const res = await fetch(GHL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(ghlPayload),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `GHL error: ${res.status}`, detail: text },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json({ success: true, contact: data });
}
