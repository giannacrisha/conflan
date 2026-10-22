import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import type { Scored } from '@/core/score';
import type { Slot } from '@/core/slots';
import { formatDay, formatTime } from '@/core/time';
import type { PlanModel } from '@/lib/use-plan';
import { usePlanner } from '@/lib/store';
import { enter } from './motion';
import { Chip, Kicker, Title } from './primitives';
import { SessionCard } from './session-card';
import { type Theme } from './theme';
import { useStyles } from './theme-context';

type Filter = 'for-you' | 'all' | string;

export function SlotPicker({ model, slot }: { model: PlanModel; slot: Slot }) {
  const styles = useStyles(makeStyles);
  const ranked = model.ranked.get(slot.id) ?? [];
  const forYouCount = ranked.filter((r) => r.forYou).length;
  const [filter, setFilter] = useState<Filter>('all');
  const pick = usePlanner((s) => s.pick);
  const unpick = usePlanner((s) => s.unpick);
  const eventId = model.data.event.id;
  const { tz } = model;

  const types = [...new Set(ranked.map((r) => r.session.type).filter((t): t is string => !!t))].slice(0, 4);
  const visible: Scored[] =
    filter === 'all'
      ? ranked
      : filter === 'for-you'
        ? ranked.filter((r) => r.forYou)
        : ranked.filter((r) => r.session.type === filter);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Kicker>
          {formatDay(slot.day, 'long').toUpperCase()} · {formatTime(slot.start, tz)}–{formatTime(slot.end, tz)}
        </Kicker>
        <Title size={24}>{ranked.length === 1 ? 'One session in this slot' : `Choose one of ${ranked.length}`}</Title>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {forYouCount ? (
            <Chip
              label={`★ For you ${forYouCount}`}
              selected={filter === 'for-you'}
              onPress={() => setFilter('for-you')}
              dark
            />
          ) : null}
          <Chip label={`All ${ranked.length}`} selected={filter === 'all'} onPress={() => setFilter('all')} dark />
          {types.length > 1
            ? types.map((t) => <Chip key={t} label={t} selected={filter === t} onPress={() => setFilter(t)} dark />)
            : null}
        </ScrollView>
        {!model.hasProfile ? (
          <Text style={styles.hint}>Add your interests to get recommendations ranked for you.</Text>
        ) : null}
      </View>
      <View style={styles.list}>
        {visible.map((r, i) => (
          <Animated.View key={`${filter}:${r.session.id}`} entering={enter(i)}>
            <SessionCard
              session={r.session}
              tz={tz}
              trackGroups={model.data.event.trackGroups}
              reasons={r.reasons}
              forYou={r.forYou}
              picked={model.picked.has(r.session.id)}
              conflict={model.conflicts.has(r.session.id)}
              onPick={() => pick(eventId, r.session.id, slot.sessionIds)}
              onUnpick={() => unpick(eventId, r.session.id)}
            />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (C: Theme) =>
  StyleSheet.create({
    wrap: { gap: 14 },
    header: { gap: 10 },
    filters: { gap: 6, paddingVertical: 4 },
    hint: { fontSize: 12, color: C.muted },
    list: { gap: 10 },
  });
