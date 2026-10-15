'use client';

import { useSyncExternalStore } from 'react';
import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  setThemePreference,
  subscribeTheme,
  type ThemePreference,
} from '@/lib/theme';

/** Both navigation instances share one small external store. */
export function ThemeSwitcher() {
  const { preference, ready } = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  return (
    <div className="theme-switcher">
      {ready && (
        <svg
          className="theme-switcher-icon"
          viewBox="0 0 16 16"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 2a6 6 0 0 0 0 12Z" fill="currentColor" />
        </svg>
      )}
      <select
        aria-label="Color theme"
        value={preference}
        hidden={!ready}
        disabled={!ready}
        onChange={(event) => setThemePreference(event.currentTarget.value as ThemePreference)}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}
