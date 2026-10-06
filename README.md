# Conflan

One schedule planner for every conference and hackathon. Set up your profile once, add an event, and build your schedule one time block at a time, with sessions recommended for you. Export to your calendar or a phone wallpaper.

Unofficial and open source. Not affiliated with AnitaB.org, Whova, RainFocus or any event listed here. If an event needs seat reservations, make them in the official app.

**Status:** Phase 1 (data and core logic) is done. See [PLAN.md](PLAN.md) for the roadmap.

## Events

| Event | Dates | Platform |
|---|---|---|
| 2026 IA National Gathering | Oct 23-25, 2026 | Whova |
| Grace Hopper Celebration 2026 | Oct 26-30, 2026 | RainFocus |

Want another one? [Open an "Add an event" issue](../../issues/new?template=new_event.yml).

## Run it

```bash
npm install
npm run sync      # download agendas into data/
npm test
npx expo start    # press w for web, i for iOS simulator
```

## How it works

```
src/adapters/   one file per agenda platform -> shared Session format
src/core/       pure TypeScript: time zones, slots, recommendations, .ics export
src/app/        screens (Expo Router)
scripts/sync.ts runs adapters, writes data/events/<id>.json
```

- **Slots:** overlapping sessions are grouped into time blocks (`src/core/slots.ts`). Each block closes at the typical end time of its sessions, so one long session can't swallow the next block.
- **Recommendations:** each session gets a score and a "Why this" explanation from your tracks, career level and interests (`src/core/score.ts`). No AI involved, so every recommendation can be explained.
- **Data refresh:** a GitHub Action runs `npm run sync` every 6 hours and commits any agenda changes.

## Contributing

Yes please. Read [CONTRIBUTING.md](CONTRIBUTING.md) first, especially the part about claiming issues.
