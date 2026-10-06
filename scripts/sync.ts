/// <reference types="node" />
// Imports every event in src/events.config.ts and writes static JSON to public/data/.
// Usage: npm run sync            (all events)
//        npm run sync -- ghc26   (one event)

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { loadEvent } from '../src/adapters';
import { buildDays } from '../src/core/slots';
import type { EventData } from '../src/core/types';
import { EVENTS } from '../src/events.config';

const OUT = 'public/data';

type IndexEntry = Omit<EventData['event'], 'trackGroups'> & { sessionCount: number };

async function readIndex(): Promise<IndexEntry[]> {
  try {
    return JSON.parse(await readFile(`${OUT}/index.json`, 'utf8'));
  } catch {
    return [];
  }
}

async function main() {
  const only = process.argv.slice(2);
  const targets = only.length ? EVENTS.filter((e) => only.includes(e.id)) : EVENTS;
  await mkdir(`${OUT}/events`, { recursive: true });

  const index = new Map((await readIndex()).map((e) => [e.id, e]));
  let failed = 0;

  for (const config of targets) {
    try {
      const data = await loadEvent(config);
      data.sessions.sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
      // Keep the previous timestamp when nothing changed, so scheduled syncs
      // don't commit a new file every run
      const path = `${OUT}/events/${config.id}.json`;
      const previous = await readFile(path, 'utf8')
        .then((raw) => JSON.parse(raw) as EventData)
        .catch(() => undefined);
      const comparable = (d: EventData) => JSON.stringify({ ...d, event: { ...d.event, updatedAt: '' } });
      if (previous && comparable(previous) === comparable(data)) data.event.updatedAt = previous.event.updatedAt;
      await writeFile(path, JSON.stringify(data, null, 2) + '\n');
      const { trackGroups, ...meta } = data.event;
      index.set(config.id, { ...meta, sessionCount: data.sessions.length });

      const days = buildDays(data.sessions, data.event.timezone);
      console.log(`✓ ${config.id}: ${data.sessions.length} sessions, ${trackGroups.length} track groups`);
      for (const d of days) {
        console.log(
          `    ${d.day}  ${d.slots.length} slots · ${d.fixed.length} fixed · ${d.background.length} background`,
        );
      }
    } catch (err) {
      failed++;
      console.error(`✗ ${config.id}: ${(err as Error).message}`);
    }
  }

  const sorted = [...index.values()].sort((a, b) => a.start.localeCompare(b.start));
  await writeFile(`${OUT}/index.json`, JSON.stringify(sorted, null, 2) + '\n');
  if (failed) process.exitCode = 1;
}

main();
