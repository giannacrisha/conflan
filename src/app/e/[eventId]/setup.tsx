import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useEventData } from '@/lib/data';
import { usePlanner } from '@/lib/store';
import { Button, Chip, Kicker, Title } from '@/ui/primitives';
import { Screen } from '@/ui/screen';
import { enter } from '@/ui/motion';
import { C, F, groupColor, R } from '@/ui/theme';

export default function EventSetup() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { data, error } = useEventData(eventId);
  const saved = usePlanner((s) => s.tracks[eventId]);
  const setTracks = usePlanner((s) => s.setTracks);
  const [chosen, setChosen] = useState<string[]>(saved ?? []);

  const done = (tracks: string[]) => {
    setTracks(eventId, tracks);
    router.replace({ pathname: '/e/[eventId]', params: { eventId } });
  };
  const toggle = (t: string) => setChosen((c) => (c.includes(t) ? c.filter((x) => x !== t) : [...c, t]));
  const groups = (data?.event.trackGroups ?? []).filter((g) => g.tracks.length);

  return (
    <Screen
      footer={
        <>
          <Button label="Skip" variant="link" onPress={() => done(saved ?? [])} />
          <Button
            label={chosen.length ? `Use ${chosen.length} topics` : 'Continue'}
            icon="→"
            onPress={() => done(chosen)}
          />
        </>
      }>
      <View style={{ gap: 8 }}>
        <Kicker>{data?.event.name.toUpperCase() ?? 'LOADING'}</Kicker>
        <Title size={30}>What do you want out of this event?</Title>
        <Text style={styles.lede}>
          Pick any topics from this event’s program. We rank sessions in every time slot using these plus your profile.
        </Text>
      </View>
      {error ? <Text style={styles.error}>Couldn’t load this event ({error}).</Text> : null}
      {groups.map((g, i) => {
        const color = groupColor(g.name, i);
        const count = g.tracks.filter((t) => chosen.includes(t)).length;
        return (
          <Animated.View key={g.name} entering={enter(i)} style={[styles.group, count ? { borderColor: color } : null]}>
            <View style={styles.groupHeader}>
              <View style={[styles.square, { backgroundColor: color }]} />
              <Text style={styles.groupName}>{g.name}</Text>
              <Text style={[styles.count, { color: count ? color : C.muted }]}>
                {count ? `${count} selected` : `${g.tracks.length} topics`}
              </Text>
            </View>
            <View style={styles.chips}>
              {g.tracks.map((t) => (
                <Chip key={t} label={t} selected={chosen.includes(t)} onPress={() => toggle(t)} />
              ))}
            </View>
          </Animated.View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lede: { fontSize: 15, lineHeight: 22, color: C.muted },
  error: { color: C.warn, fontSize: 13 },
  group: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: 2,
    borderColor: C.surface,
    padding: 18,
    gap: 14,
  },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  square: { width: 24, height: 24, borderRadius: 12 },
  groupName: { flex: 1, fontSize: 17, fontFamily: F.semibold, color: C.ink, letterSpacing: -0.5 },
  count: { fontSize: 12, fontFamily: F.medium },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
