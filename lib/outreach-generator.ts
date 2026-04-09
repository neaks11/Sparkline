import { Lead, LeadSearchInput, OutreachBundle, UserProfile } from '@/lib/types';

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// Load profile once per session (SSR-safe)
function getProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('sparkline_profile');
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function buildOutreach(lead: Lead, userNotes?: string, tone: LeadSearchInput['tone'] = 'Friendly'): OutreachBundle {
  const profile = getProfile();
  const senderName = profile?.fullName ?? '[Your Name]';
  const company = profile?.companyName ?? '[Your Company]';
  const pitch = profile?.elevatorPitch?.trim();
  const product = profile?.productService?.trim() ?? userNotes;

  const valueProps = pitch
    ? [pitch]
    : [
        'tighten response time so fewer inquiries go cold',
        'lift booked appointments from existing traffic',
        'improve follow-up consistency without adding headcount',
        'help your team convert high-intent leads faster',
      ];

  const firstTouch = lead.leadScore >= 85 ? 'Email' : pick(['Voicemail', 'LinkedIn', 'Email']);
  const valueProp = pick(valueProps);
  const painPoint = lead.painPoints[0] ?? `converting more local ${lead.niche} demand`;
  const hook = lead.personalizationHook;
  const offerContext = product ?? userNotes ?? '';
  const contextLine = offerContext
    ? `What we do: ${offerContext.length > 120 ? offerContext.slice(0, 120) + '...' : offerContext} `
    : '';

  // ─── Subject ───────────────────────────────────────────────────────────────
  const emailSubject = pitch
    ? `Quick idea for ${lead.businessName}`
    : `${lead.city} growth idea for ${lead.businessName}`;

  // ─── Intro line by tone ────────────────────────────────────────────────────
  const intro = tone === 'Direct'
    ? `I help ${lead.niche} teams in ${lead.city} get more from their existing pipeline.`
    : tone === 'Formal'
      ? `I work with ${lead.niche} organizations in ${lead.city} focused on sustainable pipeline growth.`
      : `I work with ${lead.niche} teams in ${lead.city} that want steadier pipeline without burning time on manual follow-up.`;

  const close = tone === 'Direct'
    ? 'Worth a quick 10-minute review this week?'
    : tone === 'Formal'
      ? 'Would you be open to a brief review this week?'
      : 'Would it be useful if I shared that this week?';

  // ─── Email ─────────────────────────────────────────────────────────────────
  const emailBody = [
    `Hi ${lead.contactName},`,
    '',
    `${intro} I noticed ${hook.toLowerCase()}, and it stood out because shops like yours usually mention ${painPoint.toLowerCase()} as a bottleneck.`,
    contextLine ? contextLine.trim() : '',
    `We typically help owners ${pitch ? 'with exactly this' : valueProp}.`,
    '',
    `If you're open to it, I can send a quick 3-point teardown focused on what to adjust first for ${lead.businessName}. No hard pitch — just practical ideas you can use either way.`,
    '',
    `${close}`,
    '',
    `Best,`,
    senderName,
    company ? company : '',
  ].filter((l, i, arr) => !(l === '' && arr[i - 1] === '')).join('\n').trim();

  // ─── Voicemail ─────────────────────────────────────────────────────────────
  const voicemailScript = `Hey ${lead.contactName}, this is ${senderName}${company ? ` from ${company}` : ''}. I was reaching out after looking at ${lead.businessName} in ${lead.city}. ${pitch ? pitch.slice(0, 120) + (pitch.length > 120 ? '...' : '') : `We help ${lead.niche} operators ${valueProp}.`} A lot of teams I speak with deal with ${painPoint.toLowerCase()}, so I thought it might be relevant. If you want, I can send a short breakdown with a few practical wins. You can reach me at [Your Number]. Again, this is ${senderName}. Thanks.`;

  // ─── LinkedIn ──────────────────────────────────────────────────────────────
  const linkedinMessage = `Hi ${lead.contactName} — noticed ${lead.businessName} is active in ${lead.city}. ${pitch ? pitch.split('.')[0] + '.' : `I work with ${lead.niche} teams focused on ${painPoint.toLowerCase()}.`} Happy to share a quick idea on lifting conversions if helpful. Open to connect?`.slice(0, 300);

  return {
    emailSubject,
    emailBody,
    voicemailScript,
    linkedinMessage,
    bestFirstTouch: firstTouch as OutreachBundle['bestFirstTouch'],
  };
}
