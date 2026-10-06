// Everything the attendee chooses, saved on the device. No accounts in v1.

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Profile } from '@/core/types';
import { storage } from './storage';

type PlannerState = {
  onboarded: boolean;
  profile: Profile;
  /** Event ids the attendee added, in the order they added them */
  myEvents: string[];
  /** Tracks chosen per event; `undefined` means setup hasn't been done */
  tracks: Record<string, string[] | undefined>;
  /** Picked session ids per event */
  picks: Record<string, string[]>;

  saveProfile: (profile: Profile) => void;
  addEvent: (eventId: string) => void;
  removeEvent: (eventId: string) => void;
  setTracks: (eventId: string, tracks: string[]) => void;
  /** Picks a session, replacing any other pick in the same slot */
  pick: (eventId: string, sessionId: string, sameSlot: string[]) => void;
  unpick: (eventId: string, sessionId: string) => void;
  importPicks: (eventId: string, sessionIds: string[]) => void;
};

export const usePlanner = create<PlannerState>()(
  persist(
    (set) => ({
      onboarded: false,
      profile: { interests: [] },
      myEvents: [],
      tracks: {},
      picks: {},

      saveProfile: (profile) => set({ profile, onboarded: true }),
      addEvent: (eventId) => set((s) => (s.myEvents.includes(eventId) ? s : { myEvents: [...s.myEvents, eventId] })),
      removeEvent: (eventId) => set((s) => ({ myEvents: s.myEvents.filter((id) => id !== eventId) })),
      setTracks: (eventId, tracks) => set((s) => ({ tracks: { ...s.tracks, [eventId]: tracks } })),
      pick: (eventId, sessionId, sameSlot) =>
        set((s) => {
          const others = (s.picks[eventId] ?? []).filter((id) => id !== sessionId && !sameSlot.includes(id));
          return { picks: { ...s.picks, [eventId]: [...others, sessionId] } };
        }),
      unpick: (eventId, sessionId) =>
        set((s) => ({ picks: { ...s.picks, [eventId]: (s.picks[eventId] ?? []).filter((id) => id !== sessionId) } })),
      importPicks: (eventId, sessionIds) =>
        set((s) => {
          const merged = [...new Set([...(s.picks[eventId] ?? []), ...sessionIds])];
          return {
            picks: { ...s.picks, [eventId]: merged },
            myEvents: s.myEvents.includes(eventId) ? s.myEvents : [...s.myEvents, eventId],
          };
        }),
    }),
    {
      name: 'conflan-planner',
      version: 1,
      storage: createJSONStorage(() => storage),
    },
  ),
);
