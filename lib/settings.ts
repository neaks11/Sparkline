import { MED_SPA_NICHE, STANDARD_NICHES } from '@/lib/niches';
import { AppSettings, FocusMode } from '@/lib/types';

const SETTINGS_KEY = 'sparkline_settings';

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function getDefaultSettings(): AppSettings {
  const availableNiches = [...STANDARD_NICHES];
  const defaultNiche = availableNiches.includes(MED_SPA_NICHE) ? MED_SPA_NICHE : availableNiches[0];

  return {
    availableNiches,
    activeNiches: [...availableNiches],
    defaultNiche,
    focusMode: 'multi-niche',
  };
}

function isFocusMode(value: unknown): value is FocusMode {
  return value === 'multi-niche' || value === 'med-spa-only';
}

export function normalizeSettings(raw: Partial<AppSettings> | null | undefined): AppSettings {
  const fallback = getDefaultSettings();
  const availableNiches = dedupe(raw?.availableNiches ?? fallback.availableNiches);
  const mergedAvailable = dedupe([...fallback.availableNiches, ...availableNiches]);
  const activeSeed = dedupe(raw?.activeNiches ?? fallback.activeNiches).filter((niche) => mergedAvailable.includes(niche));
  const fallbackActive = activeSeed.length > 0 ? activeSeed : [fallback.defaultNiche];
  const defaultNiche = mergedAvailable.includes(raw?.defaultNiche ?? '') ? (raw?.defaultNiche as string) : (fallbackActive[0] ?? fallback.defaultNiche);
  const focusMode: FocusMode = isFocusMode(raw?.focusMode) ? raw.focusMode : fallback.focusMode;

  if (focusMode === 'med-spa-only') {
    const medSpaAvailable = mergedAvailable.includes(MED_SPA_NICHE) ? mergedAvailable : [...mergedAvailable, MED_SPA_NICHE];
    return {
      availableNiches: medSpaAvailable,
      activeNiches: [MED_SPA_NICHE],
      defaultNiche: MED_SPA_NICHE,
      focusMode,
    };
  }

  const guaranteedActive = fallbackActive.includes(defaultNiche) ? fallbackActive : dedupe([defaultNiche, ...fallbackActive]);

  return {
    availableNiches: mergedAvailable,
    activeNiches: guaranteedActive,
    defaultNiche,
    focusMode,
  };
}

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return getDefaultSettings();
  const raw = window.localStorage.getItem(SETTINGS_KEY);
  if (!raw) return getDefaultSettings();

  try {
    return normalizeSettings(JSON.parse(raw) as Partial<AppSettings>);
  } catch {
    return getDefaultSettings();
  }
}

export function saveSettings(settings: AppSettings): AppSettings {
  const normalized = normalizeSettings(settings);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

export function resetSettings(): AppSettings {
  const defaults = getDefaultSettings();
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaults));
  }
  return defaults;
}
