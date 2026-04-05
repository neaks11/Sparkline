import { Lead, OutreachBundle } from '@/lib/types';

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function buildOutreach(lead: Lead, userNotes?: string): OutreachBundle {
  const valueProps = [
    'tighten response time so fewer inquiries go cold',
    'lift booked appointments from existing traffic',
    'improve follow-up consistency without adding headcount',
    'help your team convert high-intent leads faster',
  ];
  const firstTouch = lead.leadScore >= 85 ? 'Email' : pick(['Voicemail', 'LinkedIn', 'Email']);
  const valueProp = pick(valueProps);
  const painPoint = lead.painPoints[0] ?? `converting more local ${lead.niche} demand`;
  const hook = lead.personalizationHook;
  const noteLine = userNotes ? `I also had your note in mind: ${userNotes}. ` : '';

  const emailSubject = `${lead.city} growth idea for ${lead.businessName}`;
  const emailBody = `Hi ${lead.contactName},\n\nI work with ${lead.niche} teams in ${lead.city} that want steadier pipeline without burning time on manual follow-up. I noticed ${hook.toLowerCase()}, and it stood out because shops like yours usually mention ${painPoint.toLowerCase()} as a bottleneck. ${noteLine}We typically help owners ${valueProp}.\n\nIf you are open to it, I can send a quick 3-point teardown focused on what to adjust first for ${lead.businessName}. No hard pitch—just practical ideas you can use either way.\n\nWould it be useful if I shared that this week?\n\nBest,\n[Your Name]`;

  const voicemailScript = `Hey ${lead.contactName}, this is [Your Name]. I was reaching out after looking at ${lead.businessName} in ${lead.city}. We help ${lead.niche} operators ${valueProp}. A lot of teams I speak with are dealing with ${painPoint.toLowerCase()}, so I thought it might be relevant. If you want, I can send a short breakdown with a few practical wins for your team. You can call or text me back at [Your Number]. Again, this is [Your Name]. Thanks.`;

  const linkedinMessage = `Hi ${lead.contactName} — noticed ${lead.businessName} is active in ${lead.city}. I work with ${lead.niche} teams focused on ${painPoint.toLowerCase()}. Happy to share a quick idea on lifting conversions if helpful. Open to connect?`;

  return {
    emailSubject,
    emailBody,
    voicemailScript,
    linkedinMessage: linkedinMessage.slice(0, 300),
    bestFirstTouch: firstTouch as OutreachBundle['bestFirstTouch'],
  };
}
