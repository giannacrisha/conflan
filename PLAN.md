# Conflan: plan (v2, multi-event, Expo)

Working name: **Conflan**. The local folder is still `ghc-planner`.

## Context
Every conference and hackathon ships its own single-use app. This project is one native app where attendees set up a profile once, add any event, and build a schedule one time block at a time, with sessions recommended for them. Organizers get their branding (including a Duolingo-style alternate app icon) without having to build an app. Analytics for organizers come later.

**First two events (hard deadlines):**
- 2026 IA National Gathering (Whova): Fri Oct 23 to Sun Oct 25
- Grace Hopper Celebration 2026 (RainFocus): Mon Oct 26 (virtual) and Tue Oct 27 to Fri Oct 30 (in person)

**Target:** a working web build of the planner by **Oct 21**. iOS and Android follow from the same codebase.

## Design (decided)
- **Mobile:** Option A (day timeline with a slot picker sheet). **Desktop/web:** Option E (split view).
- Mockups: https://www.figma.com/design/7FonOJXT2j6YSaFEFhikyX
- Each event can override the accent color, logo and name. App icons come in Phase 3.

## Stack
- **Expo (React Native) + TypeScript + Expo Router.** One codebase builds iOS, Android and web.
- **EAS Build** for cloud builds and signing, so contributors don't need Xcode to help. **EAS Update** pushes fixes straight to installed apps during a conference, skipping App Store review.
- **State:** Zustand (small, standard), saved on the device with `expo-sqlite/kv-store`. No accounts in v1.
- **Tests:** Vitest for the pure logic in `src/core`.
- Dependencies stay minimal. Each one added has to justify itself in its PR.

## Data: one schema, many platform adapters
Each event platform gets an **adapter** that converts its agenda into one shared format:

```ts
type Session = {
  id: string; eventId: string; title: string; abstract?: string;
  start: string; end: string;            // ISO 8601 with UTC offset
  room?: string; format?: 'in-person' | 'virtual' | 'hybrid';
  type?: string;                          // Workshop, Panel, Mainstage...
  tracks: string[];                       // e.g. "Hire: Job Search & Interview Readiness"
  levels: string[];                       // career levels, if the event tags them
  speakers: { name: string; title?: string; company?: string }[];
  isFixed: boolean;                       // registration, meals, plenaries
  sourceUrl?: string;                     // link back to the official catalog
}
type Event = { id; name; timezone; start; end; theme: { accent; logo? }; tracks: TrackGroup[]; source: { platform; ref } }
```

| Adapter | Source | Notes |
|---|---|---|
| `rainfocus` | `POST events.rainfocus.com/api/sessions` with the public widget headers from the catalog page, per day, paginated | GHC. Has pillars, sub-tracks, career level, format and speakers. Page 1 is nested in `sectionList`; later pages return `items` flat |
| `whova` | `GET whova.com/xems/apis/event_webpage/agenda/public/get_agendas/?event_id=…` | Returns the whole agenda in one call, with timezone, tracks, tags, speakers and subsessions |
| `manual` | CSV/JSON template | Fallback for any other event, and the starting point for organizer uploads |

**Pipeline:** `scripts/sync.ts` runs every adapter on a schedule (a GitHub Action every 6 hours) and writes `data/events/<id>.json` plus `data/index.json`. Those files are published as static files on GitHub Pages. The app downloads them and **caches them for offline use**, since venue Wi-Fi is unreliable.

## Profile and recommendations
- **Global profile (set once):** name, career level, in-person or virtual, general interests.
- **Per-event interests:** when you add an event, you choose from *that event's* tracks. GHC shows the Train/Hire/Advance/Fund sub-topics; the IA Gathering shows its own tracks. Skipping is allowed, and the planner still works without ranking.
- **Score (pure function in `src/core/score.ts`):** track match ×3, career-level match ×2, keyword match between your interests and the title/abstract ×1, and a big penalty when the format doesn't match. Every score comes with a "Why this" reason string, and the top 1 or 2 in each slot get a "For you" badge.
- **Slots (`src/core/slots.ts`):** group overlapping non-fixed sessions into time blocks; fixed sessions become locked blocks on the timeline.
- Phase 3: speaker matching using speaker title and company.

## Screens (Expo Router)
- `/` My events: added events, plus "Add event" (pick from the list, or paste a Whova/RainFocus link).
- `/onboarding`: global profile, shown once and skippable.
- `/e/[eventId]/setup`: per-event interests.
- `/e/[eventId]`: the planner. Timeline A on narrow screens, split view E on wide ones. Day tabs, slot picker sheet or panel, conflict flags.
- `/e/[eventId]/export`: calendar, wallpaper, share link.
- On every screen: a **Request a feature** link that opens a GitHub issue form.

## Export
- **Native:** `expo-calendar` writes events straight into the phone's calendar.
- **Web:** download a `.ics` file (hand-written generator, about 40 lines, in `src/core/ics.ts`). This works with Google Calendar, Apple Calendar and Outlook.
- **Wallpaper:** render the day as a phone-sized image with `react-native-view-shot`, then save it with `expo-media-library` (download on web).

## Repo layout
```
src/app/             Expo Router screens
src/core/            pure TS: schema, slots, score, ics (no React, fully tested)
src/adapters/        rainfocus.ts, whova.ts, manual.ts
src/ui/              components: SessionCard, SlotSheet, Timeline, Chip, Button
scripts/sync.ts      runs adapters, writes data/
data/                generated event JSON (committed by CI)
.github/             workflows (sync, web deploy), issue + PR templates
```
`src/core` and `src/adapters` contain no UI code. Contributors can add an adapter or improve scoring without touching the app.

## Phases
**Phase 1: core and data (Oct 6-9)** ✅ done Oct 6
1. Scaffold the Expo app with TypeScript, Expo Router, Zustand and Vitest.
2. Write the schema and the `rainfocus` and `whova` adapters, then `sync.ts`. Check the session counts against each source.
3. Write `slots.ts`, `score.ts` and `ics.ts`, with unit tests.

**Phase 2: web MVP (Oct 10-21)** ✅ done Oct 6, live at https://giannacrisha.github.io/conflan
4. Onboarding, My events, per-event setup.
5. Planner: timeline (A) and split view (E), day tabs, slot picker, conflict flags, fixed blocks.
6. Export to .ics and wallpaper; share link (picked IDs in the URL).
7. Deploy the web build to GitHub Pages and test it on both events.
8. Stretch goal: a TestFlight build for personal use at the events (the `testflight-takeoff` skill covers this).

**Phase 3: after the events**
9. App Store and Play Store release, using `expo-calendar` export.
10. Alternate app icons per event theme (the `expo-alternate-app-icons` config plugin). Icons are bundled at build time, so new event icons ship with app updates.
11. Organizer side: upload agendas, set the theme, see analytics (session interest before the event, topic demand, comparisons across events). Analytics needs a backend and attendee consent, so it gets planned separately.
12. Speaker matching. ✅ done Oct 6 ("People to meet", ranked by session fit, bio keywords and shared sessions)

## Contributors
- `CONTRIBUTING.md`: **claim an issue by commenting before you start.** Claims expire after 7 days with no activity. Unclaimed PRs for claimed issues won't be merged.
- A public GitHub Project board (Ideas → Ready → In progress → Done). Issues are labeled `good first issue`, `adapter`, `core` or `ui`.
- "Add an adapter for platform X" is the standard first contribution, with a template file and a test fixture.
- An `AGENTS.md`/`CLAUDE.md` with project conventions, for contributors who use AI tools.
- License: MIT.
- Disclaimer in the app and README: unofficial, not affiliated with AnitaB.org, Whova or RainFocus. Seats still have to be reserved in the official app.

## Verification
- `npm run sync`: about 470 GHC sessions, with per-day counts matching RainFocus `tabCounts`; IA Gathering sessions match the Whova embed.
- `npm test`: slots group overlapping sessions correctly, scores rank the expected session first for sample profiles, and the .ics output passes a validator.
- `npx expo start --web`: go through onboarding, add both events and pick a session in each slot, check the conflict flag, export the .ics and import it into Google Calendar (times correct in PT).
- iOS Simulator: the same flow on Option A, and the wallpaper saves to Photos.
