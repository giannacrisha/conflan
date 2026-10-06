import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useEventData } from '@/lib/data';
import { usePlanner } from '@/lib/store';
import { Button, Chip, Kicker, Title } from '@/ui/primitives';
import { Screen } from '@/ui/screen';
import { C, groupColor } from '@/ui/theme';

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
  const accent = data?.event.theme.accent ?? C.plum;
  const groups = (data?.event.trackGroups ?? []).filter((g) => g.tracks.length);

  return (
    <Screen
      footer={
        <>
          <Button label="Skip" variant="link" onPress={() => done(saved ?? [])} />
          <Button
            label={chosen.length ? `Use ${chosen.length} topics` : 'Continue'}
            accent={accent}
            onPress={() => done(chosen)}
          />
        </>
      }>
      <View style={{ gap: 8 }}>
        <Kicker color={accent}>{data?.event.name.toUpperCase() ?? 'LOADING'}</Kicker>
        <Title size={28}>What do you want out of this event?</Title>
        <Text style={styles.lede}>
          Pick any topics from this event’s program. We rank sessions in every time slot using these plus your profile.
        </Text>
      </View>
      {error ? <Text style={styles.error}>Couldn’t load this event ({error}).</Text> : null}
      {groups.map((g, i) => {
        const color = groupColor(g.name, i);
        const count = g.tracks.filter((t) => chosen.includes(t)).length;
        return (
          <View key={g.name} style={[styles.group, count ? { borderColor: color } : null]}>
            <View style={styles.groupHeader}>
              <View style={[styles.square, { backgroundColor: color }]} />
              <Text style={styles.groupName}>{g.name}</Text>
              <Text style={[styles.count, { color: count ? color : C.muted }]}>
                {count ? `${count} selected` : `${g.tracks.length} topics`}
              </Text>
            </View>
            <View style={styles.chips}>
              {g.tracks.map((t) => (
                <Chip key={t} label={t} selected={chosen.includes(t)} onPress={() => toggle(t)} accent={accent} />
              ))}
            </View>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lede: { fontSize: 15, lineHeight: 22, color: C.muted },
  error: { color: C.warn, fontSize: 13 },
  group: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.line, padding: 14, gap: 12 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  square: { width: 22, height: 22, borderRadius: 6 },
  groupName: { flex: 1, fontSize: 16, fontWeight: '700', color: C.ink },
  count: { fontSize: 12, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
