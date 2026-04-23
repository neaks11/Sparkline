import { isMedSpaNiche } from '@/lib/niches';
import { Lead, OutreachBundle } from '@/lib/types';

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function buildOutreach(lead: Lead, purpose?: string): OutreachBundle {
  const medSpaValueProps = [
    'tighten consultation booking flow so more inquiries actually schedule',
    'set up missed-call text-back so front desk never loses hot leads',
    'add chatbot + FAQ guidance for treatment questions after-hours',
    'improve review reactivation and return-visit prompts',
  ];

  const genericValueProps = [
    'tighten response time so fewer inquiries go cold',
    'lift booked appointments from existing traffic',
    'improve follow-up consistency without adding headcount',
    'help your team convert high-intent leads faster',
  ];

  const isMedSpa = isMedSpaNiche(lead.niche);
  const firstTouch = lead.leadScore >= 85 ? 'Email' : pick(['Voicemail', 'LinkedIn', 'Email']);
  const valueProp = pick(isMedSpa ? medSpaValueProps : genericValueProps);
  const painPoint = lead.painPoints[0] ?? `converting more local ${lead.niche} demand`;
  const hook = lead.personalizationHook;
  const purposeLine = purpose ? `I kept your offer angle in mind (${purpose}). ` : '';

  const emailSubject = isMedSpa
    ? `${lead.city} med spa growth idea for ${lead.businessName}`
    : `${lead.city} growth idea for ${lead.businessName}`;

  const emailBody = `Hi ${lead.contactName},\n\nI help ${isMedSpa ? 'med spas' : lead.niche} in ${lead.city} improve lead capture and follow-up without making the front desk workflow heavier. I noticed ${hook.toLowerCase()}, and it stood out because teams in your space often mention ${painPoint.toLowerCase()}. ${purposeLine}A common win is to ${valueProp}.\n\nIf useful, I can send a short teardown with 3 quick recommendations tailored to ${lead.businessName}. No hard sell — just practical ideas your team can use right away.\n\nWould it be helpful if I sent that over this week?\n\nBest,\n[Your Name]`;

  const voicemailScript = `Hey ${lead.contactName}, this is [Your Name]. I was reaching out after looking at ${lead.businessName} in ${lead.city}. ${isMedSpa ? 'We help med spas tighten consultation booking and front desk follow-up.' : `We help ${lead.niche} operators ${valueProp}.`} I thought this might be relevant since teams often run into ${painPoint.toLowerCase()}. If it helps, I can send a short breakdown with a few quick conversion wins. You can call or text me back at [Your Number]. Again, this is [Your Name]. Thanks.`;

  const linkedinMessage = `Hi ${lead.contactName} — noticed ${lead.businessName} in ${lead.city}. I work with ${isMedSpa ? 'med spas focused on consultation bookings + missed-call follow-up' : `${lead.niche} teams improving conversion flow`}. Happy to share a quick idea if useful. Open to connect?`;

  return {
    emailSubject,
    emailBody,
    voicemailScript,
    linkedinMessage: linkedinMessage.slice(0, 300),
    bestFirstTouch: firstTouch as OutreachBundle['bestFirstTouch'],
  };
}
