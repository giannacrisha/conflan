// Events the sync script imports. To add one, append an entry here and,
// if its platform is new, add an adapter in src/adapters/. `npm run add-event -- <url>`
// detects the platform and ids from the event's website.

import type { EventConfig } from './core/types';

export const EVENTS: EventConfig[] = [
  {
    id: 'ia-gathering-26',
    name: '2026 IA National Gathering',
    timezone: 'America/Los_Angeles',
    start: '2026-10-23',
    end: '2026-10-25',
    // From the "Tides of Transition" banner: teal headline, magenta, hummingbird
    // mint, coral-bean red and gold on a pale sky background
    theme: {
      accent: '#0B6B5E',
      variants: [
        { name: 'Tides', ink: '#0B6B5E', accent: '#F4A6C8', bg: '#E4EDF2' },
        { name: 'Hummingbird', ink: '#A3285F', accent: '#7FD8C3', bg: '#E4EDF2' },
        { name: 'Coral bean', ink: '#B3282C', accent: '#E9C25A', bg: '#F1ECE6' },
      ],
    },
    source: { platform: 'whova', eventId: 'wXgDwfNAQx29AWtlzgMbHAdZISvovGIh3eZI4wtyirQ=' },
  },
  {
    id: 'ghc26',
    name: 'Grace Hopper Celebration 2026',
    timezone: 'America/Los_Angeles',
    start: '2026-10-26',
    end: '2026-10-30',
    theme: { accent: '#41263F' },
    status: 'cancelled',
    source: {
      platform: 'rainfocus',
      // Public ids from the catalog page source (apiToken, widgetId)
      apiProfileId: 'Xh5jjihi5L8EwEEjIplZkG9RmEmsmPEk',
      widgetId: 'nZeaLE1j83n6gXiMHiTabDVB3jCLgG0P',
      days: ['20261027', '20261028', '20261029', '20261030'],
      catalogUrl: 'https://ghc.anitab.org/session-catalog',
      groupOrder: ['Train', 'Hire', 'Advance', 'Fund'],
    },
  },
];
