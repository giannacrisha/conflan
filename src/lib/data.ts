// Loads event JSON published by `npm run sync`. Every response is cached on the
// device so the planner keeps working on bad venue Wi-Fi.

import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import type { ConferenceEvent, EventData } from '@/core/types';
import { storage } from './storage';

export const SITE_URL = 'https://giannacrisha.github.io/conflan';

export type EventIndexEntry = Omit<ConferenceEvent, 'trackGroups'> & { sessionCount: number };

function dataUrl(path: string) {
  if (Platform.OS === 'web') {
    // Same origin as the web app. The dev server serves public/ at the root;
    // the exported site lives under its GitHub Pages base path.
    const base = __DEV__ ? '' : (Constants.expoConfig?.experiments?.baseUrl ?? '').replace(/\/$/, '');
    return `${base}/data/${path}`;
  }
  return `${SITE_URL}/data/${path}`;
}

const memory = new Map<string, unknown>();

function cached<T>(path: string): T | undefined {
  if (memory.has(path)) return memory.get(path) as T;
  const raw = storage.getItem(`cache:${path}`);
  if (!raw) return undefined;
  try {
    const value = JSON.parse(raw) as T;
    memory.set(path, value);
    return value;
  } catch {
    return undefined;
  }
}

export type Loadable<T> = { data?: T; loading: boolean; error?: string };

function useJson<T>(path: string | undefined): Loadable<T> {
  const [state, setState] = useState<Loadable<T> & { path?: string }>(() => ({
    path,
    data: path ? cached<T>(path) : undefined,
    loading: !!path,
  }));

  useEffect(() => {
    if (!path) return;
    let alive = true;
    fetch(dataUrl(path))
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<T>;
      })
      .then((data) => {
        memory.set(path, data);
        storage.setItem(`cache:${path}`, JSON.stringify(data));
        if (alive) setState({ path, data, loading: false });
      })
      .catch((err: Error) => {
        // Offline with a cached copy is fine; only surface errors with nothing to show
        const data = cached<T>(path);
        if (alive) setState({ path, data, loading: false, error: data ? undefined : err.message });
      });
    return () => {
      alive = false;
    };
  }, [path]);

  // When the path changes, show the cached copy until the fetch lands
  if (state.path !== path) return { data: path ? cached<T>(path) : undefined, loading: !!path };
  return state;
}

export const useEventIndex = () => useJson<EventIndexEntry[]>('index.json');
export const useEventData = (eventId: string | undefined) =>
  useJson<EventData>(eventId ? `events/${eventId}.json` : undefined);
