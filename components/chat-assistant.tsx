'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { NICHE_OPTIONS } from '@/lib/niches';
import { loadProfile } from '@/lib/storage';
import { LeadSearchInput, UserProfile } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  quickReplies?: string[];
  action?: ChatAction;
  ts: number;
}

interface ChatAction {
  type: 'generate' | 'navigate';
  payload?: LeadSearchInput | string;
}

type Step =
  | 'greeting'
  | 'ask_niche'
  | 'ask_city'
  | 'ask_state'
  | 'ask_purpose'
  | 'ask_count'
  | 'ask_tone'
  | 'confirm'
  | 'done';

interface Draft {
  niche?: string;
  city?: string;
  state?: string;
  purpose?: string;
  count?: number;
  tone?: 'Direct' | 'Friendly' | 'Formal';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const US_STATE_ABBRS: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO',
  montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND',
  ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI',
  'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX',
  utah: 'UT', vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV',
  wisconsin: 'WI', wyoming: 'WY',
};

function toStateAbbr(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  return US_STATE_ABBRS[trimmed] ?? input.trim().toUpperCase().slice(0, 2);
}

function detectNiche(text: string): string | null {
  const lower = text.toLowerCase();
  for (const niche of NICHE_OPTIONS) {
    if (lower.includes(niche.toLowerCase())) return niche;
    // fuzzy aliases
    const aliases: Record<string, string> = {
      'hvac': 'HVAC', 'air conditioning': 'HVAC', 'heating': 'HVAC', 'cooling': 'HVAC',
      'med spa': 'Med Spas', 'medspa': 'Med Spas', 'spa': 'Med Spas', 'aesthetics': 'Med Spas',
      'lawn': 'Landscaping', 'landscape': 'Landscaping', 'yard': 'Landscaping', 'gardening': 'Landscaping',
      'plumb': 'Plumbing', 'pipe': 'Plumbing',
      'roof': 'Roofing',
      'electric': 'Electrical Services', 'electrician': 'Electrical Services',
      'dental': 'Dental Practices', 'dentist': 'Dental Practices', 'orthodont': 'Dental Practices',
      'legal': 'Legal Services', 'lawyer': 'Legal Services', 'attorney': 'Legal Services', 'law firm': 'Legal Services',
      'real estate': 'Real Estate Agencies', 'realtor': 'Real Estate Agencies', 'broker': 'Real Estate Agencies',
      'clean': 'Home Cleaning', 'maid': 'Home Cleaning', 'janitorial': 'Home Cleaning',
      'auto': 'Auto Services', 'car': 'Auto Services', 'mechanic': 'Auto Services', 'garage': 'Auto Services',
    };
    for (const [alias, mapped] of Object.entries(aliases)) {
      if (lower.includes(alias)) return mapped;
    }
  }
  return null;
}

function extractStateFromCity(text: string): { city: string; state: string } | null {
  // "Chicago, IL" or "Chicago IL" or "Chicago, Illinois"
  const match = text.match(/^([a-z\s]+)[,\s]+([a-z\s]{2,})$/i);
  if (!match) return null;
  const city = match[1].trim();
  const stateRaw = match[2].trim();
  const state = toStateAbbr(stateRaw);
  return { city, state };
}

function newId() { return Math.random().toString(36).slice(2); }

function botMsg(text: string, quickReplies?: string[], action?: ChatAction): Message {
  return { id: newId(), role: 'assistant', text, quickReplies, action, ts: Date.now() };
}

function userMsg(text: string): Message {
  return { id: newId(), role: 'user', text, ts: Date.now() };
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ChatAssistantProps {
  onGenerate?: (input: LeadSearchInput) => void;
}

export function ChatAssistant({ onGenerate }: ChatAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [step, setStep] = useState<Step>('greeting');
  const [draft, setDraft] = useState<Draft>({});
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load profile
  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Init greeting when opened for first time
  useEffect(() => {
    if (open && messages.length === 0) {
      startConversation();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const addBot = (msg: Message) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, msg]);
    }, 600 + Math.random() * 400);
  };

  const startConversation = () => {
    const profileName = profile?.fullName?.split(' ')[0];
    const greeting = profileName
      ? `Hey ${profileName}! 👋 I'm your Sparkline AI assistant. I'll help you find leads fast.`
      : `Hey! 👋 I'm your Sparkline AI assistant. I'll help you find the right leads.`;

    const quickReplies: string[] = profile?.targetNiches?.length
      ? profile.targetNiches.slice(0, 4)
      : ['HVAC', 'Roofing', 'Med Spas', 'Dental Practices'];

    setMessages([
      botMsg(greeting),
    ]);

    setTimeout(() => {
      addBot(botMsg(
        `Which industry are you targeting? ${profile?.targetNiches?.length ? "I see you've set some favorites 👇" : 'Here are some popular niches:'}`,
        [...quickReplies, '🔍 Search all niches'],
      ));
      setStep('ask_niche');
    }, 800);
  };

  const reset = () => {
    setMessages([]);
    setDraft({});
    setStep('greeting');
    setInput('');
    setTimeout(() => startConversation(), 100);
  };

  const handleQuickReply = (text: string) => {
    handleSend(text);
  };

  const handleSend = (rawText?: string) => {
    const text = (rawText ?? input).trim();
    if (!text) return;
    setInput('');
    const msg = userMsg(text);
    setMessages((prev) => [...prev, msg]);
    processStep(text);
  };

  const processStep = (text: string) => {
    const lower = text.toLowerCase();

    switch (step) {
      case 'greeting':
      case 'ask_niche': {
        if (lower.includes('all niche') || lower.includes('search all')) {
          addBot(botMsg(
            'No problem! Pick any niche from the list:',
            NICHE_OPTIONS as unknown as string[],
          ));
          return;
        }

        const detected = detectNiche(text);
        if (!detected) {
          addBot(botMsg(
            `Hmm, I couldn't match that to a supported niche. Try one of these:`,
            NICHE_OPTIONS.slice(0, 5) as unknown as string[],
          ));
          return;
        }

        const newDraft = { ...draft, niche: detected };
        setDraft(newDraft);

        // Check if profile has cities
        if (profile?.targetCities?.length) {
          const citySuggestions = profile.targetCities.slice(0, 4).map((c) => `${c.city}, ${c.state}`);
          addBot(botMsg(
            `Great — targeting **${detected}**. Which city? Your saved markets:`,
            [...citySuggestions, '📍 Enter a different city'],
          ));
        } else {
          addBot(botMsg(
            `Great — targeting **${detected}**! What city should I search in? (e.g. "Chicago, IL" or just "Chicago")`,
          ));
        }
        setStep('ask_city');
        break;
      }

      case 'ask_city': {
        if (lower.includes('different') || lower.includes('other')) {
          addBot(botMsg(`Sure! Type a city and state, like "Atlanta, GA" or "Los Angeles, CA"`));
          return;
        }

        // Try to parse "City, ST" format
        const parsed = extractStateFromCity(text);
        if (parsed) {
          const newDraft = { ...draft, city: parsed.city, state: parsed.state };
          setDraft(newDraft);
          addBot(botMsg(
            `Got it — **${parsed.city}, ${parsed.state}**. Now, what do you sell or what's your reason for reaching out?`,
            profile?.productService ? [profile.productService] : undefined,
          ));
          setStep('ask_purpose');
        } else {
          // Just a city name — ask for state
          const newDraft = { ...draft, city: text };
          setDraft(newDraft);
          addBot(botMsg(`What state is ${text} in? (e.g. IL, TX, CA)`));
          setStep('ask_state');
        }
        break;
      }

      case 'ask_state': {
        const state = toStateAbbr(text);
        const newDraft = { ...draft, state };
        setDraft(newDraft);
        addBot(botMsg(
          `Got it — **${draft.city}, ${state}**. What do you sell or why are you reaching out?`,
          profile?.productService ? [profile.productService] : undefined,
        ));
        setStep('ask_purpose');
        break;
      }

      case 'ask_purpose': {
        const purpose = text === profile?.productService ? profile.productService : text;
        const newDraft = { ...draft, purpose };
        setDraft(newDraft);
        addBot(botMsg(
          `Perfect. How many leads do you need? I recommend starting with 10–15.`,
          ['5', '10', '15', '20', '25'],
        ));
        setStep('ask_count');
        break;
      }

      case 'ask_count': {
        const count = Math.min(25, Math.max(5, parseInt(lower) || 10));
        const newDraft = { ...draft, count };
        setDraft(newDraft);
        const defaultTone = profile?.defaultTone ?? 'Friendly';
        addBot(botMsg(
          `Nice. What outreach tone fits this niche best?`,
          ['Direct', 'Friendly', 'Formal', `Use my default (${defaultTone})`],
        ));
        setStep('ask_tone');
        break;
      }

      case 'ask_tone': {
        let tone: 'Direct' | 'Friendly' | 'Formal' = profile?.defaultTone ?? 'Friendly';
        if (lower.includes('direct')) tone = 'Direct';
        else if (lower.includes('friendly')) tone = 'Friendly';
        else if (lower.includes('formal')) tone = 'Formal';

        const newDraft = { ...draft, tone };
        setDraft(newDraft);

        // Show summary and confirm
        addBot(botMsg(
          `Here's your search:\n\n🏢 **Niche:** ${newDraft.niche}\n📍 **Location:** ${newDraft.city}, ${newDraft.state}\n🎯 **Purpose:** ${newDraft.purpose}\n📊 **Leads:** ${newDraft.count}\n🗣️ **Tone:** ${tone}\n\nReady to generate?`,
          ['🚀 Generate leads!', '✏️ Start over'],
        ));
        setStep('confirm');
        break;
      }

      case 'confirm': {
        if (lower.includes('start over') || lower.includes('reset') || lower.includes('no')) {
          reset();
          return;
        }

        // Fire generation
        const finalInput: LeadSearchInput = {
          niche: draft.niche ?? '',
          city: draft.city ?? '',
          state: draft.state ?? '',
          purpose: draft.purpose ?? '',
          count: draft.count ?? 10,
          tone: draft.tone ?? 'Friendly',
        };

        addBot(botMsg(`🔍 Searching for ${finalInput.count} ${finalInput.niche} leads in ${finalInput.city}, ${finalInput.state}...`));

        // Navigate to home first if not already there, then fire event
        if (onGenerate) {
          onGenerate(finalInput);
        }
        if (pathname !== '/') {
          // Store in sessionStorage so home page can pick it up on mount
          sessionStorage.setItem('sparkline_pending_search', JSON.stringify(finalInput));
          router.push('/');
        } else {
          // Already on home page — fire immediately
          window.dispatchEvent(new CustomEvent('sparkline:generate', { detail: finalInput }));
        }

        setTimeout(() => {
          addBot(botMsg(
            `✅ Done! Your leads should be loading now. Need another search?`,
            ['🔄 New search', '✅ Close chat'],
          ));
          setStep('done');
        }, 1200);
        break;
      }

      case 'done': {
        if (lower.includes('new search') || lower.includes('another') || lower.includes('more')) {
          reset();
        } else if (lower.includes('close') || lower.includes('done') || lower.includes('thanks')) {
          setOpen(false);
        } else {
          addBot(botMsg(`Want to run another search?`, ['🔄 New search', '✅ Close chat']));
        }
        break;
      }
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'AI';

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        aria-label="Open AI assistant"
      >
        {open ? (
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex w-[360px] max-w-[calc(100vw-40px)] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          {/* Header */}
          <div
            className="flex items-center gap-3 rounded-t-2xl px-4 py-3"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
              {initials}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Sparkline Assistant</p>
              <p className="text-xs text-purple-200">AI-powered lead coach</p>
            </div>
            <button onClick={reset} className="text-xs text-purple-200 hover:text-white" title="Reset conversation">
              ↺ Reset
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex max-h-[380px] flex-col gap-3 overflow-y-auto p-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-br-sm bg-brand-500 text-white'
                      : 'rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                  }`}
                >
                  {/* Render **bold** and newlines */}
                  {msg.text.split('\n').map((line, li) => (
                    <span key={li}>
                      {li > 0 && <br />}
                      {line.split(/(\*\*[^*]+\*\*)/).map((part, pi) =>
                        part.startsWith('**') && part.endsWith('**')
                          ? <strong key={pi}>{part.slice(2, -2)}</strong>
                          : <span key={pi}>{part}</span>
                      )}
                    </span>
                  ))}
                </div>
                {msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.quickReplies.map((r) => (
                      <button
                        key={r}
                        onClick={() => handleQuickReply(r)}
                        className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start">
                <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-2 dark:bg-slate-800">
                  <span className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 rounded-b-2xl border-t border-slate-200 p-3 dark:border-slate-700">
            <input
              ref={inputRef}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Type here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600 disabled:opacity-40"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
