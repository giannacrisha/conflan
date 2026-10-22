/// <reference types="node" />
// Detects a conference's agenda platform from its website and prints an entry
// to paste into src/events.config.ts.
// Usage: npm run add-event -- <url> [id] [timezone]

import { detectSource } from '../src/adapters/detect';

async function main() {
  const [url, id = 'new-event', timezone = 'America/Los_Angeles'] = process.argv.slice(2);
  if (!url) {
    console.error('Usage: npm run add-event -- <agenda or website url> [id] [timezone]');
    process.exitCode = 1;
    return;
  }
  const html = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 conplan-sync' } })
    .then((r) => r.text())
    .catch(() => '');
  const source = detectSource(url, html);
  if (!source) {
    console.error('No Whova, RainFocus or Sessionize agenda found on that page. Try the agenda page itself,');
    console.error('or use a manual JSON file (docs/manual-event.example.json).');
    process.exitCode = 1;
    return;
  }
  const entry = {
    id,
    name: html.match(/<title>([^<]+)<\/title>/i)?.[1].trim() ?? id,
    timezone,
    start: 'YYYY-MM-DD',
    end: 'YYYY-MM-DD',
    theme: { accent: '#111111' },
    source,
  };
  console.log(`Found a ${source.platform} agenda. Check the name, dates and time zone, then add to EVENTS:\n`);
  console.log(JSON.stringify(entry, null, 2));
  if (source.platform === 'rainfocus') console.log('\nRainFocus also needs `days` (YYYYMMDD tabs from the catalog).');
}

main();
