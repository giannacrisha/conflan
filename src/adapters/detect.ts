// Finds which agenda platform a conference uses from its URL or page HTML, so
// adding an event is one command instead of digging through page source.

import type { EventSource } from '../core/types';

export type Detected = Exclude<EventSource, { platform: 'manual' }>;

const SESSIONIZE = /sessionize\.com\/api\/v2\/([a-z0-9]+)\//i;
const WHOVA =
  /whova\.com\/(?:embedded\/event|xems\/apis\/[^"'\s]*event_id=)\/?([A-Za-z0-9%+/=_-]{20,}?)(?:\/|["'&\s]|$)/i;
const RF_PROFILE = /(?:apiToken|apiProfileId|rfApiProfileId|data-api-profile-id)["'\s:=]+["']?([A-Za-z0-9]{24,})/;
const RF_WIDGET = /(?:widgetId|rfWidgetId|data-widget-id)["'\s:=]+["']?([A-Za-z0-9]{24,})/;

/** Looks at the URL first, then the page HTML for an embedded agenda */
export function detectSource(url: string, html = ''): Detected | undefined {
  const haystack = `${url}\n${html}`;

  const sz = haystack.match(SESSIONIZE);
  if (sz) return { platform: 'sessionize', apiId: sz[1] };

  const wh = haystack.match(WHOVA);
  if (wh) return { platform: 'whova', eventId: decodeURIComponent(wh[1]) };

  const profile = html.match(RF_PROFILE);
  const widget = html.match(RF_WIDGET);
  if (profile && widget) {
    return { platform: 'rainfocus', apiProfileId: profile[1], widgetId: widget[1], days: [], catalogUrl: url };
  }
  return undefined;
}
