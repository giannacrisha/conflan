# Contributing

Thanks for helping. A few rules keep many people from building the same thing twice.

## Claim before you build

1. Find an issue on the project board, or open one with the feature request template.
2. **Comment "I'd like to take this" and wait to be assigned.** Assigned issues get the `in progress` label.
3. If an assigned issue has no activity for 7 days, the claim lapses and someone else can take it.
4. PRs for issues assigned to someone else won't be merged, so check first.

Small fixes (typos, obvious bugs under ~20 lines) can skip the claim step.

## Good first contributions

- **Add an adapter** for a new agenda platform (Sched, Sessionize, Luma...). Copy `src/adapters/whova.ts`, map the platform's response to `Session` (`src/core/types.ts`), add a test with a trimmed real response like `whova.test.ts`, then register it in `src/adapters/index.ts`.
- **Add an event** on a platform we already support: one entry in `src/events.config.ts`, then run `npm run sync`.
- Issues labeled `good first issue`.

## Ground rules

- `src/core/` stays pure TypeScript with no React or Expo imports, so it stays easy to test.
- Install packages with `npx expo install <pkg>`, and explain in the PR why a new dependency is needed.
- Before opening a PR: `npm run typecheck`, `npx expo lint`, `npm test`.
- Keep PRs focused on one issue and link it with `Closes #123`.
- Using AI tools is fine. Read [AGENTS.md](AGENTS.md) and review what they write before submitting.
