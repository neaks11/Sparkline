import { isReferralSourceNiche, isSeniorLivingNiche } from '@/lib/niches';
import { Lead, LeadSearchInput, OutreachBundle, ReferralType, UserProfile } from '@/lib/types';

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

// ─── Senior Living / Referral outreach templates ──────────────────────────────

interface SLTemplateArgs {
  contactName: string;
  businessName: string;
  city: string;
  senderName: string;
  company: string;
  painPoint: string;
}

interface SLTemplate {
  subject: string;
  body: (args: SLTemplateArgs) => string;
  voicemail: (args: SLTemplateArgs) => string;
  linkedin: (args: SLTemplateArgs) => string;
}

const slTemplates: Record<ReferralType | 'default', SLTemplate> = {
  'Hospital': {
    subject: 'Supporting smoother discharge transitions in {{city}}',
    body: ({ contactName, businessName, city, senderName, company }) =>
      `Hi ${contactName},\n\nI work with senior living communities in ${city} focused on reducing discharge friction and making care transitions easier for patients and families.\n\nWhen patients at ${businessName} need a long-term care setting, it can be difficult for families to quickly identify the right fit — level of care, proximity, cost, availability.\n\nI'd love to share a quick overview of our placement options so your team has a trusted resource ready when the situation calls for it. No paperwork, no pressure — just a 15-minute call to see if we're a good fit for your discharge cases.\n\nWould that be useful?\n\nBest,\n${senderName}${company ? `\n${company}` : ''}`,
    voicemail: ({ contactName, businessName, city, senderName, company }) =>
      `Hi ${contactName}, this is ${senderName}${company ? ` from ${company}` : ''}. I work with senior living communities in ${city} and wanted to reach out about discharge coordination from ${businessName}. When patients need a care transition, I'd love to be a resource your team can count on. I'll send a quick email too — feel free to call or text back at [Your Number]. Thanks.`,
    linkedin: ({ contactName, businessName, city }) =>
      `Hi ${contactName} — I work with senior living communities in ${city} that support smooth care transitions from hospitals like ${businessName}. Open to a quick intro to see if we'd be a useful resource for your discharge cases?`.slice(0, 300),
  },
  'Rehab Facility': {
    subject: 'Coordinating post-rehab placement options in {{city}}',
    body: ({ contactName, businessName, city, senderName, company }) =>
      `Hi ${contactName},\n\nI work with senior living communities in ${city} that specialize in supporting patients transitioning out of rehab settings like ${businessName}.\n\nFor patients who aren't ready to return home after rehab — whether for memory care, assisted living, or a higher level of support — having a trusted next step makes the transition smoother for families and reduces readmission risk.\n\nI'd love to connect and share what we offer so your team has a reliable option when the time comes.\n\nWould a quick 15-minute call work this week?\n\nBest,\n${senderName}${company ? `\n${company}` : ''}`,
    voicemail: ({ contactName, businessName, city, senderName, company }) =>
      `Hi ${contactName}, this is ${senderName}${company ? ` from ${company}` : ''}. I partner with rehab centers like ${businessName} in ${city} to support patients who need a higher level of care after discharge. I'd love to be a resource for your team. I'll follow up by email too — you can also reach me at [Your Number]. Thanks.`,
    linkedin: ({ contactName, businessName, city }) =>
      `Hi ${contactName} — I work with senior living communities in ${city} that support post-rehab placements from centers like ${businessName}. Would love to connect and share options for patients who need a next step.`.slice(0, 300),
  },
  'Skilled Nursing': {
    subject: 'Long-term care partnership opportunity in {{city}}',
    body: ({ contactName, businessName, city, senderName, company }) =>
      `Hi ${contactName},\n\nI work with senior living communities in ${city} and wanted to reach out to ${businessName} about building a referral relationship.\n\nFor residents who need assisted living, memory care, or independent living after a skilled nursing stay, having a trusted partner community can streamline the transition and provide continuity of care for families.\n\nI'd love to introduce our community and explore whether there's a natural referral fit for your residents. Happy to come by for a quick tour or a brief call.\n\nWould that work for you?\n\nBest,\n${senderName}${company ? `\n${company}` : ''}`,
    voicemail: ({ contactName, businessName, city, senderName, company }) =>
      `Hi ${contactName}, this is ${senderName}${company ? ` from ${company}` : ''}. I'm reaching out to explore a referral relationship between our senior living community and ${businessName} in ${city}. Happy to come by or chat at [Your Number]. Thanks.`,
    linkedin: ({ contactName, businessName, city }) =>
      `Hi ${contactName} — interested in exploring a referral relationship between our senior living community and ${businessName} in ${city}. Would love to connect.`.slice(0, 300),
  },
  'Elder Law Attorney': {
    subject: 'Helping your clients navigate care transitions in {{city}}',
    body: ({ contactName, businessName, city, senderName, company }) =>
      `Hi ${contactName},\n\nI work with senior living communities in ${city} and wanted to reach out to ${businessName} because many of your clients are likely navigating care decisions alongside estate planning.\n\nWhen clients and families are planning for assisted living or memory care — especially around Medicaid planning, asset preservation, or life care decisions — having a trusted placement resource can make a real difference.\n\nI'd love to connect briefly and share what we offer so you have a community you can confidently recommend when your clients need it.\n\nWould a quick call this week work?\n\nBest,\n${senderName}${company ? `\n${company}` : ''}`,
    voicemail: ({ contactName, businessName, city, senderName, company }) =>
      `Hi ${contactName}, this is ${senderName}${company ? ` from ${company}` : ''}. I work with a senior living community in ${city} and wanted to connect with ${businessName} — many elder law clients also navigate placement decisions, and I'd love to be a resource. I'll follow up by email. You can reach me at [Your Number]. Thanks.`,
    linkedin: ({ contactName, businessName, city }) =>
      `Hi ${contactName} — I work with a senior living community in ${city}. Many of your clients at ${businessName} may face care placement decisions alongside legal planning. Happy to share what we offer.`.slice(0, 300),
  },
  'Financial Advisor': {
    subject: 'Care planning support for your clients in {{city}}',
    body: ({ contactName, businessName, city, senderName, company }) =>
      `Hi ${contactName},\n\nI work with a senior living community in ${city} and wanted to reach out to ${businessName} because many of your clients are likely thinking about long-term care costs alongside retirement and estate planning.\n\nHaving a trusted care option to refer clients to — with transparent pricing, flexible care levels, and strong outcomes — can make a meaningful difference in how families feel confident about their decisions.\n\nI'd love to connect and share what we offer so we can be a resource your clients can count on when the time comes.\n\nWould a quick call this week work?\n\nBest,\n${senderName}${company ? `\n${company}` : ''}`,
    voicemail: ({ contactName, businessName, city, senderName, company }) =>
      `Hi ${contactName}, this is ${senderName}${company ? ` from ${company}` : ''}. I work with a senior living community in ${city} and wanted to connect with ${businessName}. Many financial planning clients also face care decisions, and I'd love to be a resource you can recommend. Happy to chat at [Your Number]. Thanks.`,
    linkedin: ({ contactName, businessName, city }) =>
      `Hi ${contactName} — I work with a senior living community in ${city} and think there could be a fit for ${businessName}'s clients planning for long-term care costs. Would love to connect briefly.`.slice(0, 300),
  },
  'Home Care Agency': {
    subject: 'Supporting your clients as care needs increase in {{city}}',
    body: ({ contactName, businessName, city, senderName, company }) =>
      `Hi ${contactName},\n\nI work with a senior living community in ${city} and wanted to reach out to ${businessName} because home care agencies are often the first to recognize when a client's needs have progressed beyond what home care can safely provide.\n\nFor clients and families who need a transition to assisted living or memory care, having a trusted partner community can make that conversation easier and the transition smoother.\n\nI'd love to connect and see if there's a natural referral relationship here — one that serves your clients well when the time comes.\n\nWould a quick call work this week?\n\nBest,\n${senderName}${company ? `\n${company}` : ''}`,
    voicemail: ({ contactName, businessName, city, senderName, company }) =>
      `Hi ${contactName}, this is ${senderName}${company ? ` from ${company}` : ''}. I work with a senior living community in ${city} and wanted to connect with ${businessName}. When your clients need a higher level of care, I'd love to be a resource your team can count on. Happy to chat at [Your Number]. Thanks.`,
    linkedin: ({ contactName, businessName, city }) =>
      `Hi ${contactName} — I work with a senior living community in ${city}. For ${businessName} clients who progress beyond home care, I'd love to be a trusted referral option. Open to a quick intro?`.slice(0, 300),
  },
  'Placement Agency': {
    subject: 'Expanding your trusted community options in {{city}}',
    body: ({ contactName, businessName, city, senderName, company }) =>
      `Hi ${contactName},\n\nI work with a senior living community in ${city} and wanted to connect with ${businessName} about becoming part of your referral network.\n\nI know placement advisors rely on communities that are responsive, transparent, and consistently deliver a good experience for families. I'd love to walk you through what we offer so you have a clear picture of when we'd be the right fit for your clients.\n\nWould a quick tour or call work this week?\n\nBest,\n${senderName}${company ? `\n${company}` : ''}`,
    voicemail: ({ contactName, businessName, city, senderName, company }) =>
      `Hi ${contactName}, this is ${senderName}${company ? ` from ${company}` : ''}. I'm with a senior living community in ${city} and wanted to connect with ${businessName} about joining your referral network. Happy to give a quick tour or chat at [Your Number]. Thanks.`,
    linkedin: ({ contactName, businessName, city }) =>
      `Hi ${contactName} — I work with a senior living community in ${city} and would love to connect with ${businessName}'s referral network. Happy to walk through our offerings and availability.`.slice(0, 300),
  },
  'Geriatric Care Manager': {
    subject: 'Trusted placement option for your clients in {{city}}',
    body: ({ contactName, businessName, city, senderName, company }) =>
      `Hi ${contactName},\n\nI work with a senior living community in ${city} and wanted to reach out to ${businessName}. Geriatric care managers are often the most trusted voice families hear during care transitions, and I'd love to be a resource you can confidently recommend.\n\nI'm happy to give you a full tour, share our care philosophy, and answer any questions so you have a clear picture of when we'd be the right fit.\n\nWould a call or in-person visit work this week?\n\nBest,\n${senderName}${company ? `\n${company}` : ''}`,
    voicemail: ({ contactName, businessName, city, senderName, company }) =>
      `Hi ${contactName}, this is ${senderName}${company ? ` from ${company}` : ''}. I work with a senior living community in ${city} and wanted to connect with ${businessName}. I'd love to give you a tour and make sure you have us in mind for clients who need a reliable placement option. Happy to talk at [Your Number]. Thanks.`,
    linkedin: ({ contactName, businessName, city }) =>
      `Hi ${contactName} — I work with a senior living community in ${city} and would love to be a trusted placement option you recommend to ${businessName}'s clients. Open to a quick tour or call?`.slice(0, 300),
  },
  'Church / Community': {
    subject: 'Trusted care options for your community in {{city}}',
    body: ({ contactName, businessName, city, senderName, company }) =>
      `Hi ${contactName},\n\nI work with a senior living community in ${city} and wanted to connect with ${businessName}.\n\nWhen families in your congregation or community are facing difficult care decisions for an aging parent or loved one, it helps to have a trusted local resource to point them toward. We're focused on dignity, connection, and compassionate care for seniors and their families.\n\nI'd love to introduce our community and see if there's a way we can serve your members when they need it.\n\nWould a brief call or a visit work?\n\nBest,\n${senderName}${company ? `\n${company}` : ''}`,
    voicemail: ({ contactName, businessName, city, senderName, company }) =>
      `Hi ${contactName}, this is ${senderName}${company ? ` from ${company}` : ''}. I work with a senior living community in ${city} and wanted to connect with ${businessName}. When families face care decisions, I'd love to be a trusted resource. Happy to visit or chat at [Your Number]. Thanks.`,
    linkedin: ({ contactName, businessName, city }) =>
      `Hi ${contactName} — I work with a senior living community in ${city} and would love to be a trusted resource for ${businessName}'s members facing care decisions for aging loved ones. Open to a brief intro?`.slice(0, 300),
  },
  'Other': {
    subject: 'Senior living partnership opportunity in {{city}}',
    body: ({ contactName, businessName, city, senderName, company, painPoint }) =>
      `Hi ${contactName},\n\nI work with a senior living community in ${city} and wanted to reach out to ${businessName}.\n\nI noticed that organizations like yours often encounter seniors and families navigating ${painPoint}. Having a trusted placement partner can make those conversations easier.\n\nI'd love to connect briefly and share what we offer.\n\nWould a call this week work?\n\nBest,\n${senderName}${company ? `\n${company}` : ''}`,
    voicemail: ({ contactName, businessName, city, senderName, company }) =>
      `Hi ${contactName}, this is ${senderName}${company ? ` from ${company}` : ''}. I work with a senior living community in ${city} and wanted to connect with ${businessName} about a potential referral relationship. Happy to chat at [Your Number]. Thanks.`,
    linkedin: ({ contactName, businessName, city }) =>
      `Hi ${contactName} — I work with a senior living community in ${city} and think there could be value in connecting with ${businessName}. Would love to share what we offer.`.slice(0, 300),
  },
  'default': {
    subject: 'Senior living partnership in {{city}}',
    body: ({ contactName, city, senderName, company }) =>
      `Hi ${contactName},\n\nI work with a senior living community in ${city} focused on referral partner development.\n\nI'd love to connect briefly.\n\nBest,\n${senderName}${company ? `\n${company}` : ''}`,
    voicemail: ({ contactName, city, senderName, company }) =>
      `Hi ${contactName}, this is ${senderName}${company ? ` from ${company}` : ''}. I work with a senior living community in ${city} and wanted to connect about a referral relationship. Happy to chat at [Your Number]. Thanks.`,
    linkedin: ({ contactName, city }) =>
      `Hi ${contactName} — I work with a senior living community in ${city} and would love to connect about a potential referral relationship.`.slice(0, 300),
  },
};

// ─── Standard SMB outreach builder ───────────────────────────────────────────

function buildStandardOutreach(lead: Lead, userNotes?: string, tone: LeadSearchInput['tone'] = 'Friendly', profile: UserProfile | null = null): OutreachBundle {
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

  const emailSubject = pitch
    ? `Quick idea for ${lead.businessName}`
    : `${lead.city} growth idea for ${lead.businessName}`;

  const intro = tone === 'Direct'
    ? `I help ${lead.niche} teams in ${lead.city} get more from their existing pipeline.`
    : tone === 'Formal'
      ? `I work with ${lead.niche} organizations in ${lead.city} focused on sustainable pipeline growth.`
      : `I work with ${lead.niche} teams in ${lead.city} that want steadier pipeline without burning time on manual follow-up.`;

  const close = lead.leadScore >= 85
    ? "Would you have 15 minutes this week to see if it's a fit?"
    : tone === 'Direct'
      ? 'Would you be open to a brief review this week?'
      : 'Would it be useful if I shared that this week?';

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

  const voicemailScript = `Hey ${lead.contactName}, this is ${senderName}${company ? ` from ${company}` : ''}. I was reaching out after looking at ${lead.businessName} in ${lead.city}. ${pitch ? pitch.slice(0, 120) + (pitch.length > 120 ? '...' : '') : `We help ${lead.niche} operators ${valueProp}.`} A lot of teams I speak with deal with ${painPoint.toLowerCase()}, so I thought it might be relevant. If you want, I can send a short breakdown with a few practical wins. You can reach me at [Your Number]. Again, this is ${senderName}. Thanks.`;

  const linkedinMessage = `Hi ${lead.contactName} — noticed ${lead.businessName} is active in ${lead.city}. ${pitch ? pitch.split('.')[0] + '.' : `I work with ${lead.niche} teams focused on ${painPoint.toLowerCase()}.`} Happy to share a quick idea on lifting conversions if helpful. Open to connect?`.slice(0, 300);

  return {
    emailSubject,
    emailBody,
    voicemailScript,
    linkedinMessage,
    bestFirstTouch: firstTouch as 'Email' | 'Voicemail' | 'LinkedIn',
  };
}

// ─── Senior Living outreach builder ──────────────────────────────────────────

function buildSeniorLivingOutreach(lead: Lead, profile: UserProfile | null): OutreachBundle {
  const senderName = profile?.fullName ?? '[Your Name]';
  const company = profile?.companyName ?? '[Your Company]';
  const painPoint = lead.painPoints[0] ?? 'care transitions for families';

  const referralType = lead.referralType ?? 'Other';
  const template = slTemplates[referralType] ?? slTemplates['Other'];

  const args: SLTemplateArgs = {
    contactName: lead.contactName,
    businessName: lead.businessName,
    city: lead.city,
    senderName,
    company,
    painPoint,
  };

  return {
    emailSubject: template.subject.replace('{{city}}', lead.city),
    emailBody: template.body(args),
    voicemailScript: template.voicemail(args),
    linkedinMessage: template.linkedin(args),
    bestFirstTouch: 'Email',
  };
}

// ─── Public entry point ───────────────────────────────────────────────────────

export function buildOutreach(lead: Lead, userNotes?: string, tone: LeadSearchInput['tone'] = 'Friendly'): OutreachBundle {
  const profile = getProfile();

  if (isSeniorLivingNiche(lead.niche) || isReferralSourceNiche(lead.niche)) {
    return buildSeniorLivingOutreach(lead, profile);
  }

  return buildStandardOutreach(lead, userNotes, tone, profile);
}
