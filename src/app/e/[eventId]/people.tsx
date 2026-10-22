import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { contactUrl, introMessage, shortBio } from '@/core/outreach';
import { rankSpeakers, type SpeakerMatch } from '@/core/speakers';
import { dayKey, formatDay, formatTime } from '@/core/time';
import type { Profile } from '@/core/types';
import { usePlanner } from '@/lib/store';
import { usePlan, type PlanModel } from '@/lib/use-plan';
import { enter, haptic } from '@/ui/motion';
import { Button, IconButton, Kicker, Title } from '@/ui/primitives';
import { Screen } from '@/ui/screen';
import { C, F, initials, R } from '@/ui/theme';

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

  return (
    <Screen footer={<Button label="Back to planner" variant="link" onPress={() => router.back()} />}>
      <View style={styles.header}>
        <IconButton glyph="‹" label="Back" onPress={() => router.back()} />
        <View style={{ flex: 1, gap: 4 }}>
          <Kicker>{model.data.event.name.toUpperCase()}</Kicker>
          <Title size={28}>People to meet</Title>
        </View>
      </View>
      <Text style={styles.muted}>
        Speakers whose sessions and background match your profile and topics. Say hi after their session or reach out
        before the event.
      </Text>

      {matches.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.muted}>
            No strong matches yet. Add topics for this event or interests to your profile and check back.
          </Text>
          <Button
            label="Pick topics"
            variant="ghost"
            small
            onPress={() => router.push({ pathname: '/e/[eventId]/setup', params: { eventId } })}
          />
        </View>
      ) : null}

      {matches.map((m, i) => (
        <Animated.View key={`${m.speaker.name}|${m.speaker.company}`} entering={enter(i)}>
          <Person match={m} model={model} profile={profile} featured={i === 0} />
        </Animated.View>
      ))}
    </Screen>
  );
}

function Person({
  match: m,
  model,
  profile,
  featured,
}: {
  match: SpeakerMatch;
  model: PlanModel;
  profile: Profile;
  featured: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { tz } = model;
  const bio = m.speaker.bio;
  const brief = shortBio(bio);
  const role = [m.speaker.title, m.speaker.company].filter(Boolean).join(' · ');
  const session = m.sessions.find((s) => model.picked.has(s.id)) ?? m.sessions[0];

  const copyIntro = async () => {
    await Clipboard.setStringAsync(
      introMessage({ speaker: m.speaker, session, eventName: model.data.event.name, profile }),
    );
    haptic.success();
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <Animated.View layout={LinearTransition.springify().damping(20)} style={[styles.card, featured && styles.featured]}>
      <View style={styles.head}>
        <View style={[styles.avatar, featured && { backgroundColor: C.ink }]}>
          <Text style={[styles.initials, featured && { color: C.lime }]}>{initials(m.speaker.name)}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.name}>{m.speaker.name}</Text>
          {role ? <Text style={styles.role}>{role}</Text> : null}
        </View>
      </View>

      {brief ? (
        <Pressable
          onPress={() => bio !== brief && setExpanded((e) => !e)}
          accessibilityRole="button"
          accessibilityHint="Shows the full bio">
          <Text style={styles.bio}>
            {expanded ? bio : brief}
            {bio !== brief ? <Text style={styles.more}>{expanded ? '  Less' : '  More'}</Text> : null}
          </Text>
        </Pressable>
      ) : (
        <Text style={styles.noBio}>No bio on the agenda yet.</Text>
      )}

      <View style={styles.reasons}>
        {m.reasons.slice(0, 4).map((r) => (
          <Text key={r} style={[styles.reason, featured && { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
            {r}
          </Text>
        ))}
      </View>

      <View style={{ gap: 4 }}>
        {m.sessions.map((s) => (
          <Text key={s.id} style={styles.session}>
            {model.picked.has(s.id) ? '✓ ' : '· '}
            {formatDay(dayKey(s.start, tz))} {formatTime(s.start, tz)} · {s.title}
          </Text>
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          label={m.speaker.linkedIn ? 'Reach out' : 'Find on LinkedIn'}
          icon="↗"
          small
          onPress={() => Linking.openURL(contactUrl(m.speaker))}
        />
        <Button label={copied ? 'Copied ✓' : 'Copy intro'} variant="ghost" small onPress={copyIntro} />
      </View>
      {copied ? (
        <Animated.Text entering={FadeIn} style={styles.copied}>
          Intro message copied. Paste it into LinkedIn or email and make it yours.
        </Animated.Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  muted: { fontSize: 13, color: C.muted, lineHeight: 19 },
  empty: { gap: 12, alignItems: 'flex-start' },
  card: { backgroundColor: C.surface, borderRadius: R.lg, padding: 18, gap: 12 },
  featured: { backgroundColor: C.lime },
  head: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: C.ink, fontFamily: F.bold, fontSize: 16 },
  name: { fontSize: 17, fontFamily: F.semibold, color: C.ink, letterSpacing: -0.5 },
  role: { fontSize: 12, color: C.body, lineHeight: 17 },
  bio: { fontSize: 13, color: C.body, lineHeight: 19 },
  more: { fontFamily: F.semibold, color: C.ink },
  noBio: { fontSize: 12, color: C.muted, fontStyle: 'italic' },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  reason: {
    fontSize: 11,
    fontFamily: F.medium,
    color: C.ink,
    backgroundColor: C.bg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: R.pill,
    overflow: 'hidden',
  },
  session: { fontSize: 12, color: C.body, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  copied: { fontSize: 12, color: C.body },
});
