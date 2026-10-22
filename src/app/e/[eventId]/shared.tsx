// A friend's shared plan: read-only by default, with a compare view that shows
// what you'd attend together, what fits your plan and what clashes with it.

import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { compareSchedules, parsePicks, type CompareRow } from '@/core/compare';
import { dayKey, formatDay, formatTime } from '@/core/time';
import type { Session } from '@/core/types';
import { usePlanner } from '@/lib/store';
import { usePlan, type PlanModel } from '@/lib/use-plan';
import { enter, haptic, PressableScale } from '@/ui/motion';
import { Button, IconButton, Kicker, Segmented, Stat, Title } from '@/ui/primitives';
import { Screen } from '@/ui/screen';
import { C, F, R } from '@/ui/theme';

type View_ = 'theirs' | 'compare';

export default function Shared() {
  const { eventId, picks, from } = useLocalSearchParams<{ eventId: string; picks?: string; from?: string }>();
  const { model, loading, error } = usePlan(eventId);
  const pick = usePlanner((s) => s.pick);
  const unpick = usePlanner((s) => s.unpick);
  const importPicks = usePlanner((s) => s.importPicks);
  const [view, setView] = useState<View_>('theirs');

  const theirs = useMemo(
    () =>
      model
        ? parsePicks(picks)
            .map((id) => model.byId.get(id))
            .filter((s): s is Session => !!s)
        : [],
    [model, picks],
  );
  const compare = useMemo(
    () =>
      model
        ? compareSchedules(
            theirs,
            [...model.picked].map((id) => model.byId.get(id)!),
          )
        : undefined,
    [model, theirs],
  );

  if (!model || !compare) {
    return (
      <Screen>
        <Text style={styles.muted}>{loading ? 'Loading their plan…' : `Couldn’t load this event (${error}).`}</Text>
      </Screen>
    );
  }

  const who = from?.trim() ? from.trim() : 'Someone';
  const mine = model.picked.size;
  const fits = compare.rows.filter((r) => r.status === 'free').map((r) => r.session.id);
  const openPlanner = () => router.replace({ pathname: '/e/[eventId]', params: { eventId } });

  const add = (row: CompareRow) => {
    haptic.success();
    // Swapping in a clashing session drops the picks it overlaps
    row.clashesWith.forEach((s) => unpick(eventId, s.id));
    pick(eventId, row.session.id, []);
  };

  return (
    <Screen
      footer={
        <>
          <Button label="My planner" variant="link" onPress={openPlanner} />
          {view === 'compare' && fits.length ? (
            <Button
              label={`Add ${fits.length} that fit`}
              variant="accent"
              icon="+"
              onPress={() => {
                haptic.success();
                importPicks(eventId, fits);
              }}
            />
          ) : (
            <Button label="Compare with mine" icon="⇄" onPress={() => setView('compare')} />
          )}
        </>
      }>
      <View style={styles.header}>
        <IconButton glyph="‹" label="Home" onPress={() => router.replace('/')} />
        <View style={{ flex: 1, gap: 4 }}>
          <Kicker>{model.data.event.name.toUpperCase()}</Kicker>
          <Title size={28}>{from?.trim() ? `${who}’s plan` : 'A shared plan'}</Title>
        </View>
      </View>

      <Segmented<View_>
        options={[
          { value: 'theirs', label: 'Their schedule' },
          { value: 'compare', label: 'Compare with mine' },
        ]}
        value={view}
        onChange={setView}
      />

      {theirs.length === 0 ? (
        <Text style={styles.muted}>This link has no sessions that are still on the agenda.</Text>
      ) : view === 'theirs' ? (
        <Days model={model} rows={compare.rows} showStatus={false} onAdd={add} />
      ) : (
        <Animated.View entering={FadeIn.duration(220)} style={{ gap: 16 }}>
          <View style={styles.stats}>
            <Stat value={compare.both} label="Together" tone="dark" />
            <Stat value={compare.free} label="Fit your plan" />
            <Stat value={compare.clash} label="Clash" />
          </View>
          {mine === 0 ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                You haven’t planned this event yet, so everything fits. Add their picks as a starting point, or build
                your own.
              </Text>
              <Button label="Start my own plan" small onPress={openPlanner} />
            </View>
          ) : null}
          <Days model={model} rows={compare.rows} showStatus onAdd={add} />
        </Animated.View>
      )}
    </Screen>
  );
}

function Days({
  model,
  rows,
  showStatus,
  onAdd,
}: {
  model: PlanModel;
  rows: CompareRow[];
  showStatus: boolean;
  onAdd: (row: CompareRow) => void;
}) {
  const byDay = new Map<string, CompareRow[]>();
  for (const r of rows) {
    const key = dayKey(r.session.start, model.tz);
    byDay.set(key, [...(byDay.get(key) ?? []), r]);
  }
  let i = 0;
  return (
    <View style={{ gap: 18 }}>
      {[...byDay.entries()].map(([day, list]) => (
        <View key={day} style={{ gap: 8 }}>
          <View style={styles.dayHead}>
            <Text style={styles.dayPill}>{formatDay(day, 'long')}</Text>
            <Text style={styles.muted}>{list.length}</Text>
          </View>
          {list.map((r) => (
            <Animated.View key={r.session.id} entering={enter(i++)} layout={LinearTransition}>
              <Row model={model} row={r} showStatus={showStatus} onAdd={() => onAdd(r)} />
            </Animated.View>
          ))}
        </View>
      ))}
    </View>
  );
}

function Row({
  model,
  row,
  showStatus,
  onAdd,
}: {
  model: PlanModel;
  row: CompareRow;
  showStatus: boolean;
  onAdd: () => void;
}) {
  const { session: s, status } = row;
  const together = showStatus && status === 'both';
  return (
    <View style={[styles.row, together && styles.rowTogether]}>
      <Text style={[styles.time, together && { color: C.faint }]}>
        {formatTime(s.start, model.tz)}
        {'\n'}
        {formatTime(s.end, model.tz)}
      </Text>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[styles.title, together && { color: C.white }]}>{s.title}</Text>
        {s.room ? <Text style={[styles.muted, together && { color: C.faint }]}>{s.room}</Text> : null}
        {showStatus ? (
          status === 'both' ? (
            <Text style={[styles.tag, { backgroundColor: C.accent }]}>✓ You’re both going</Text>
          ) : status === 'clash' ? (
            <Text style={[styles.tag, styles.clash]} numberOfLines={2}>
              Clashes with your {row.clashesWith.map((c) => formatTime(c.start, model.tz)).join(' and ')} pick
            </Text>
          ) : (
            <Text style={[styles.tag, { backgroundColor: C.surfaceAlt }]}>Fits your plan</Text>
          )
        ) : null}
      </View>
      {showStatus && status !== 'both' ? (
        <PressableScale
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel={status === 'clash' ? `Swap in ${s.title}` : `Add ${s.title}`}
          style={[styles.add, status === 'clash' && { backgroundColor: C.ink }]}>
          <Text style={[styles.addText, status === 'clash' && { color: C.accent }]}>
            {status === 'clash' ? '⇄' : '+'}
          </Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  muted: { fontSize: 12, color: C.muted, lineHeight: 17 },
  stats: { flexDirection: 'row', gap: 8 },
  notice: { backgroundColor: C.accentTint, borderRadius: R.md, padding: 16, gap: 10, alignItems: 'flex-start' },
  noticeText: { fontSize: 13, color: C.ink, lineHeight: 19 },
  dayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayPill: {
    fontSize: 12,
    fontFamily: F.semibold,
    color: C.accent,
    backgroundColor: C.ink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: R.pill,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: C.surface,
    borderRadius: R.md,
    padding: 14,
    alignItems: 'center',
  },
  rowTogether: { backgroundColor: C.ink },
  time: { width: 64, fontSize: 11, fontFamily: F.semibold, color: C.muted, lineHeight: 16 },
  title: { fontSize: 14, fontFamily: F.semibold, color: C.ink, lineHeight: 19, letterSpacing: -0.3 },
  tag: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontFamily: F.medium,
    color: C.ink,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: R.pill,
    overflow: 'hidden',
  },
  clash: { backgroundColor: C.warnTint, color: C.warn, borderRadius: 10 },
  add: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { fontSize: 18, fontFamily: F.semibold, color: C.ink },
});
