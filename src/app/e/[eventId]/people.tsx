import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { rankSpeakers } from '@/core/speakers';
import { formatDay, formatTime, dayKey } from '@/core/time';
import { usePlanner } from '@/lib/store';
import { usePlan } from '@/lib/use-plan';
import { Button, Kicker, Title } from '@/ui/primitives';
import { Screen } from '@/ui/screen';
import { C } from '@/ui/theme';

export default function People() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { model } = usePlan(eventId);
  const profile = usePlanner((s) => s.profile);
  const tracks = usePlanner((s) => s.tracks[eventId]);

  const matches = useMemo(
    () =>
      model
        ? rankSpeakers(
            model.data.sessions,
            { profile, prefs: { tracks: tracks ?? [] }, trackGroups: model.data.event.trackGroups },
            { picked: model.picked },
          )
        : [],
    [model, profile, tracks],
  );

  if (!model) {
    return (
      <Screen>
        <Text style={styles.muted}>Loading…</Text>
      </Screen>
    );
  }
  const { accent, tz } = model;

  return (
    <Screen footer={<Button label="‹ Back to planner" variant="link" onPress={() => router.back()} />}>
      <View style={{ gap: 8 }}>
        <Kicker color={accent}>{model.data.event.name.toUpperCase()}</Kicker>
        <Title size={28}>People to meet</Title>
        <Text style={styles.muted}>
          Speakers whose sessions and background match your profile and topics. Catch them after their session or reach
          out before the event.
        </Text>
      </View>

      {matches.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.muted}>
            No strong matches yet. Add topics for this event or interests to your profile and check back.
          </Text>
          <Button
            label="Pick topics"
            variant="ghost"
            accent={accent}
            onPress={() => router.push({ pathname: '/e/[eventId]/setup', params: { eventId } })}
          />
        </View>
      ) : null}

      {matches.map((m) => (
        <View key={`${m.speaker.name}|${m.speaker.company}`} style={styles.card}>
          <View style={styles.head}>
            <View style={[styles.avatar, { backgroundColor: accent }]}>
              <Text style={styles.initials}>
                {m.speaker.name
                  .split(/\s+/)
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.name}>{m.speaker.name}</Text>
              <Text style={styles.muted}>{[m.speaker.title, m.speaker.company].filter(Boolean).join(', ')}</Text>
            </View>
          </View>
          <Text style={[styles.why, { color: accent }]}>Why: {m.reasons.join(' · ')}</Text>
          {m.speaker.bio ? (
            <Text style={styles.bio} numberOfLines={3}>
              {m.speaker.bio}
            </Text>
          ) : null}
          {m.sessions.map((s) => (
            <Text key={s.id} style={styles.session}>
              {model.picked.has(s.id) ? '✓ ' : '• '}
              {formatDay(dayKey(s.start, tz))} {formatTime(s.start, tz)} · {s.title}
            </Text>
          ))}
          {m.speaker.linkedIn ? (
            <Pressable onPress={() => Linking.openURL(m.speaker.linkedIn!)} accessibilityRole="link">
              <Text style={[styles.link, { color: accent }]}>LinkedIn ↗</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { fontSize: 13, color: C.muted, lineHeight: 19 },
  empty: { gap: 12, alignItems: 'flex-start' },
  card: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.line, padding: 16, gap: 8 },
  head: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  initials: { color: C.white, fontWeight: '700', fontSize: 14 },
  name: { fontSize: 16, fontWeight: '700', color: C.ink },
  why: { fontSize: 12, fontWeight: '500' },
  bio: { fontSize: 13, color: C.body, lineHeight: 19 },
  session: { fontSize: 12, color: C.body, lineHeight: 18 },
  link: { fontSize: 13, fontWeight: '700' },
});
