import { Redirect, router } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { formatDay } from '@/core/time';
import { useEventIndex, type EventIndexEntry } from '@/lib/data';
import { usePlanner } from '@/lib/store';
import { enter, PressableScale } from '@/ui/motion';
import { Button, Kicker, Title } from '@/ui/primitives';
import { Screen } from '@/ui/screen';
import { C, F, initials, LINKS, R } from '@/ui/theme';

const LEVEL: Record<string, string> = {
  student: 'Student',
  early: 'Early career',
  mid: 'Mid-career',
  senior: 'Senior/Executive',
};

const monthDay = (day: string) => formatDay(day, 'long').split(', ')[1];

function dates(e: EventIndexEntry) {
  return `${monthDay(e.start)} to ${monthDay(e.end)}`;
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
  const available = (events ?? []).filter((e) => !myEvents.includes(e.id) && e.status !== 'cancelled');
  const open = (id: string) =>
    router.push(
      tracks[id] === undefined
        ? { pathname: '/e/[eventId]/setup', params: { eventId: id } }
        : { pathname: '/e/[eventId]', params: { eventId: id } },
    );
  const about = [
    profile.careerLevel && LEVEL[profile.careerLevel],
    profile.format === 'virtual' ? 'Virtual' : profile.format ? 'In person' : undefined,
    ...profile.interests.slice(0, 3),
  ].filter((x): x is string => !!x);

  return (
    <Screen
      footer={
        <>
          <Button label="Request a feature" variant="link" onPress={() => Linking.openURL(LINKS.featureRequest)} />
          <Button label="Contribute" icon="↗" small onPress={() => Linking.openURL(LINKS.repo)} />
        </>
      }>
      <Animated.View entering={enter(0)} style={styles.header}>
        <View style={{ flex: 1, gap: 4 }}>
          <Kicker>CONPLAN · YOUR CONFERENCE PLANNER</Kicker>
          <Title size={32}>{profile.name ? `Hi, ${profile.name}` : 'Your events'}</Title>
        </View>
        <PressableScale
          onPress={() => router.push('/onboarding')}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
          style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.name ? initials(profile.name) : '☺'}</Text>
        </PressableScale>
      </Animated.View>

      <Animated.View entering={enter(1)}>
        <PressableScale onPress={() => router.push('/onboarding')} accessibilityRole="button" style={styles.profile}>
          {about.length ? (
            <View style={styles.tags}>
              {about.map((t) => (
                <Text key={t} style={styles.tag}>
                  {t}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.profileText}>No profile yet. Add one for recommendations.</Text>
          )}
          <Text style={styles.edit}>Edit ↗</Text>
        </PressableScale>
      </Animated.View>

      {mine.length ? (
        <View style={styles.section}>
          <Kicker>MY EVENTS</Kicker>
          {mine.map((e, i) => {
            const cancelled = e.status === 'cancelled';
            const count = (picks[e.id] ?? []).length;
            const hero = i === 0 && !cancelled;
            return (
              <Animated.View key={e.id} entering={enter(i + 2)}>
                <PressableScale
                  onPress={() => open(e.id)}
                  accessibilityRole="button"
                  style={[styles.eventCard, hero && { backgroundColor: C.accent }, cancelled && styles.cancelled]}>
                  <View style={styles.eventTop}>
                    <View style={[styles.dot, { backgroundColor: e.theme.accent }]} />
                    <Text style={styles.datePill}>{dates(e)}</Text>
                    {cancelled ? <Text style={styles.cancelTag}>Cancelled</Text> : null}
                  </View>
                  <Text style={styles.eventName}>{e.name}</Text>
                  <View style={styles.eventBottom}>
                    <Text style={styles.big}>{count}</Text>
                    <Text style={styles.bigLabel}>{count === 1 ? 'session\nplanned' : 'sessions\nplanned'}</Text>
                    <View style={{ flex: 1 }} />
                    <View style={styles.arrow}>
                      <Text style={styles.arrowText}>↗</Text>
                    </View>
                  </View>
                </PressableScale>
                <Pressable
                  onPress={() => removeEvent(e.id)}
                  hitSlop={8}
                  style={styles.removeWrap}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${e.name}`}>
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      ) : null}

      <View style={styles.section}>
        <Kicker>ADD AN EVENT</Kicker>
        {loading && !events ? <Text style={styles.meta}>Loading events…</Text> : null}
        {error ? (
          <Text style={styles.error}>Couldn’t load events ({error}). Check your connection and reopen the app.</Text>
        ) : null}
        {available.map((e, i) => (
          <Animated.View key={e.id} entering={enter(mine.length + i + 2)}>
            <PressableScale
              onPress={() => {
                addEvent(e.id);
                open(e.id);
              }}
              style={styles.addCard}
              accessibilityRole="button"
              accessibilityLabel={`Add ${e.name}`}>
              <View style={[styles.swatch, { backgroundColor: e.theme.accent }]} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.addName}>{e.name}</Text>
                <Text style={styles.meta}>
                  {dates(e)} · {e.sessionCount} sessions
                </Text>
              </View>
              <View style={styles.plus}>
                <Text style={styles.plusText}>+</Text>
              </View>
            </PressableScale>
          </Animated.View>
        ))}
        {events && !available.length ? <Text style={styles.meta}>You’ve added every event we have.</Text> : null}
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: C.accent, fontFamily: F.bold, fontSize: 16 },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.surface,
    borderRadius: R.md,
    padding: 14,
  },
  tags: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    fontSize: 12,
    fontFamily: F.medium,
    color: C.ink,
    backgroundColor: C.bg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: R.pill,
    overflow: 'hidden',
  },
  profileText: { flex: 1, fontSize: 13, color: C.muted, lineHeight: 19 },
  edit: { fontSize: 12, fontFamily: F.semibold, color: C.ink },
  section: { gap: 10 },
  eventCard: { backgroundColor: C.surface, borderRadius: R.lg, padding: 20, gap: 12 },
  cancelled: { backgroundColor: C.surfaceAlt },
  eventTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  datePill: {
    fontSize: 11,
    fontFamily: F.medium,
    color: C.ink,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: R.pill,
    overflow: 'hidden',
  },
  cancelTag: {
    fontSize: 11,
    fontFamily: F.semibold,
    color: C.white,
    backgroundColor: C.warn,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: R.pill,
    overflow: 'hidden',
  },
  eventName: { fontSize: 24, lineHeight: 28, fontFamily: F.semibold, color: C.ink, letterSpacing: -0.5 },
  eventBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  big: { fontSize: 40, fontFamily: F.semibold, color: C.ink, letterSpacing: -1 },
  bigLabel: { fontSize: 11, fontFamily: F.medium, color: C.body, lineHeight: 14 },
  removeWrap: { position: 'absolute', right: 76, bottom: 32 },
  remove: { fontSize: 12, fontFamily: F.medium, color: C.muted, textDecorationLine: 'underline', padding: 6 },
  arrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { color: C.accent, fontSize: 18, fontFamily: F.bold },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.surface,
    borderRadius: R.md,
    padding: 14,
  },
  swatch: { width: 44, height: 44, borderRadius: 14 },
  addName: { fontSize: 15, fontFamily: F.semibold, color: C.ink, letterSpacing: -0.4 },
  plus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: { fontSize: 20, fontFamily: F.semibold, color: C.ink },
  meta: { fontSize: 12, color: C.muted },
  error: { fontSize: 13, color: C.warn },
  request: { fontSize: 13, fontFamily: F.semibold, color: C.ink, paddingVertical: 4 },
  disclaimer: { fontSize: 11, color: C.muted, lineHeight: 16 },
});
