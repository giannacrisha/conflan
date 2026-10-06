// Events the sync script imports. To add one, append an entry here and,
// if its platform is new, add an adapter in src/adapters/.

import type { EventConfig } from './core/types';

export const EVENTS: EventConfig[] = [
  {
    id: 'ia-gathering-26',
    name: '2026 IA National Gathering',
    timezone: 'America/Los_Angeles',
    start: '2026-10-23',
    end: '2026-10-25',
    theme: { accent: '#1F6F5C' },
    source: { platform: 'whova', eventId: 'wXgDwfNAQx29AWtlzgMbHAdZISvovGIh3eZI4wtyirQ=' },
  },
  {
    id: 'ghc26',
    name: 'Grace Hopper Celebration 2026',
    timezone: 'America/Los_Angeles',
    start: '2026-10-26',
    end: '2026-10-30',
    theme: { accent: '#41263F' },
    source: {
      platform: 'rainfocus',
      // Public ids from the catalog page source (apiToken, widgetId)
      apiProfileId: 'Xh5jjihi5L8EwEEjIplZkG9RmEmsmPEk',
      widgetId: 'nZeaLE1j83n6gXiMHiTabDVB3jCLgG0P',
      days: ['20261027', '20261028', '20261029', '20261030'],
      catalogUrl: 'https://ghc.anitab.org/session-catalog',
    },
  },
];
