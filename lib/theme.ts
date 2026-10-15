export type ThemePreference = 'system' | 'light' | 'dark';
export type ColorTheme = 'light' | 'dark';
type ThemeSnapshot = Readonly<{ preference: ThemePreference; ready: boolean }>;

export const THEME_STORAGE_KEY = 'kurisu-theme';
const systemThemeQuery = '(prefers-color-scheme: dark)';
const serverSnapshot: ThemeSnapshot = { preference: 'system', ready: false };
let snapshot: ThemeSnapshot = serverSnapshot;
let initialized = false;
let systemTheme: MediaQueryList | null = null;
let stopListening: (() => void) | null = null;
const listeners = new Set<() => void>();

function preferenceFrom(value: string | null): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}

function systemIsDark() {
  try {
    return systemTheme?.matches ?? window.matchMedia(systemThemeQuery).matches;
  } catch {
    return false;
  }
}

function applyPreference(preference: ThemePreference) {
  const resolved: ColorTheme =
    preference === 'system' ? (systemIsDark() ? 'dark' : 'light') : preference;
  document.documentElement.dataset.theme = resolved;
}

function publish(preference: ThemePreference) {
  applyPreference(preference);
  if (snapshot.ready && snapshot.preference === preference) return;
  snapshot = { preference, ready: true };
  listeners.forEach((listener) => listener());
}

function startListening() {
  if (stopListening || typeof window === 'undefined') return;
  let preference = snapshot.preference;
  if (!initialized) {
    initialized = true;
    try {
      preference = preferenceFrom(window.localStorage.getItem(THEME_STORAGE_KEY));
    } catch {
      // Storage can be unavailable; the preference still works in this document.
    }
  }
  try {
    systemTheme = window.matchMedia(systemThemeQuery);
  } catch {
    systemTheme = null;
  }
  const onSystemChange = () => {
    if (snapshot.preference === 'system') applyPreference('system');
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
    try {
      if (event.storageArea && event.storageArea !== window.localStorage) return;
    } catch {
      // A blocked storage getter must not break a valid external preference update.
    }
    publish(preferenceFrom(event.key === null ? null : event.newValue));
  };
  systemTheme?.addEventListener('change', onSystemChange);
  window.addEventListener('storage', onStorage);
  stopListening = () => {
    systemTheme?.removeEventListener('change', onSystemChange);
    systemTheme = null;
    window.removeEventListener('storage', onStorage);
    stopListening = null;
  };
  publish(preference);
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  startListening();
  return () => {
    listeners.delete(listener);
    if (!listeners.size) stopListening?.();
  };
}

export function getThemeSnapshot() {
  return snapshot;
}

export function getServerThemeSnapshot() {
  return serverSnapshot;
}

export function setThemePreference(preference: ThemePreference) {
  if (typeof window === 'undefined') return;
  try {
    if (preference === 'system') window.localStorage.removeItem(THEME_STORAGE_KEY);
    else window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Retain the in-memory selection when browser storage is blocked or full.
  }
  publish(preference);
}

/** Run early in <head>; CSS also follows the system when JavaScript is disabled. */
export const themeBootstrapScript = `(function(){var p='system',d=false;try{var s=localStorage.getItem('${THEME_STORAGE_KEY}');if(s==='light'||s==='dark')p=s;}catch(e){}try{d=matchMedia('${systemThemeQuery}').matches;}catch(e){}document.documentElement.dataset.theme=p==='system'?(d?'dark':'light'):p;})();`;
