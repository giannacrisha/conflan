import { Redirect, router } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDay } from '@/core/time';
import { useEventIndex, type EventIndexEntry } from '@/lib/data';
import { usePlanner } from '@/lib/store';
import { Button, Kicker, Title } from '@/ui/primitives';
import { Screen } from '@/ui/screen';
import { C, LINKS } from '@/ui/theme';

const LEVEL: Record<string, string> = {
  student: 'Student',
  early: 'Early career',
  mid: 'Mid-career',
  senior: 'Senior/Executive',
};

function dates(e: EventIndexEntry) {
  return `${formatDay(e.start, 'long')} – ${formatDay(e.end, 'long').replace(/^\w+, /, '')}`;
}

export default function Home() {
  const { data: events, loading, error } = useEventIndex();
  const onboarded = usePlanner((s) => s.onboarded);
  const profile = usePlanner((s) => s.profile);
  const myEvents = usePlanner((s) => s.myEvents);
  const picks = usePlanner((s) => s.picks);
  const tracks = usePlanner((s) => s.tracks);
  const addEvent = usePlanner((s) => s.addEvent);
  const removeEvent = usePlanner((s) => s.removeEvent);

  if (!onboarded && myEvents.length === 0) return <Redirect href="/onboarding" />;

  const mine = myEvents.map((id) => events?.find((e) => e.id === id)).filter((e): e is EventIndexEntry => !!e);
  const available = (events ?? []).filter((e) => !myEvents.includes(e.id));
  const open = (id: string) =>
    router.push(
      tracks[id] === undefined
        ? { pathname: '/e/[eventId]/setup', params: { eventId: id } }
        : { pathname: '/e/[eventId]', params: { eventId: id } },
    );

  return (
    <Screen
      footer={
        <>
          <Button label="💡 Request a feature" variant="link" onPress={() => Linking.openURL(LINKS.featureRequest)} />
          <Button label="Contribute ↗" variant="ghost" onPress={() => Linking.openURL(LINKS.repo)} />
        </>
      }>
      <View style={{ gap: 6 }}>
        <Kicker>CONFLAN</Kicker>
        <Title size={30}>{profile.name ? `Hi, ${profile.name}` : 'Your events'}</Title>
      </View>

      <Pressable style={styles.profile} onPress={() => router.push('/onboarding')} accessibilityRole="button">
        <Text style={styles.profileText}>
          {[
            profile.careerLevel && LEVEL[profile.careerLevel],
            profile.format === 'virtual' ? 'Virtual' : profile.format ? 'In person' : undefined,
            profile.interests.slice(0, 3).join(', '),
          ]
            .filter(Boolean)
            .join(' · ') || 'No profile yet. Add one for recommendations.'}
        </Text>
        <Text style={styles.edit}>Edit</Text>
      </Pressable>

      {mine.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MY EVENTS</Text>
          {mine.map((e) => (
            <View key={e.id} style={[styles.card, styles.mineCard, { borderLeftColor: e.theme.accent }]}>
              <Pressable onPress={() => open(e.id)} style={{ flex: 1, gap: 4 }} accessibilityRole="button">
                <Text style={styles.name}>{e.name}</Text>
                <Text style={styles.meta}>
                  {dates(e)} · {(picks[e.id] ?? []).length} sessions planned
                </Text>
              </Pressable>
              <Pressable
                onPress={() => removeEvent(e.id)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${e.name}`}>
                <Text style={styles.remove}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ADD AN EVENT</Text>
        {loading && !events ? <Text style={styles.meta}>Loading events…</Text> : null}
        {error ? (
          <Text style={styles.error}>Couldn’t load events ({error}). Check your connection and reopen the app.</Text>
        ) : null}
        {available.map((e) => (
          <Pressable
            key={e.id}
            onPress={() => {
              addEvent(e.id);
              open(e.id);
            }}
            style={[styles.card, styles.addCard]}
            accessibilityRole="button">
            <View style={[styles.swatch, { backgroundColor: e.theme.accent }]} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.name}>{e.name}</Text>
              <Text style={styles.meta}>
                {dates(e)} · {e.sessionCount} sessions
              </Text>
            </View>
            <Text style={[styles.plus, { color: e.theme.accent }]}>＋</Text>
          </Pressable>
        ))}
        <Text style={styles.request} onPress={() => Linking.openURL(LINKS.addEvent)}>
          Don’t see your event? Request it ↗
        </Text>
      </View>

      <Text style={styles.disclaimer}>
        Unofficial and open source. Not affiliated with any event or agenda platform. Reserve seats in each event’s
        official app.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.plumTint,
    borderRadius: 12,
    padding: 14,
  },
  profileText: { flex: 1, fontSize: 13, color: C.plum, lineHeight: 19 },
  edit: { fontSize: 13, fontWeight: '700', color: C.plum },
  section: { gap: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 0.8 },
  card: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    borderLeftWidth: 5,
    padding: 16,
    gap: 4,
  },
  addCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderLeftWidth: 1 },
  swatch: { width: 32, height: 32, borderRadius: 8 },
  plus: { fontSize: 24, fontWeight: '600' },
  name: { fontSize: 16, fontWeight: '600', color: C.ink },
  meta: { fontSize: 13, color: C.muted },
  mineCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  remove: { fontSize: 12, color: C.muted, textDecorationLine: 'underline' },
  error: { fontSize: 13, color: C.warn },
  request: { fontSize: 13, color: C.plum, fontWeight: '600' },
  disclaimer: { fontSize: 11, color: C.muted, lineHeight: 16 },
});
