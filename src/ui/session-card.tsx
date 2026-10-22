import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition, ZoomIn } from 'react-native-reanimated';

import { formatTime } from '@/core/time';
import type { Session, TrackGroup } from '@/core/types';
import { haptic, PressableScale } from './motion';
import { C, F, groupColor, R } from './theme';

export function sessionLabel(session: Session, trackGroups: TrackGroup[]) {
  const index = trackGroups.findIndex((g) => session.tracks.some((t) => t === g.name || g.tracks.includes(t)));
  const group = trackGroups[index];
  // Single-group events (Whova "Tracks") label by the track itself
  const name = group && trackGroups.length > 1 ? group.name : session.tracks[0];
  const parts = [name, session.type !== name ? session.type : undefined].filter(Boolean);
  return {
    label: parts.join(' · ').toUpperCase(),
    color: name ? groupColor(group && trackGroups.length > 1 ? group.name : name, Math.max(index, 0)) : C.muted,
  };
}

export function speakerSummary(session: Session) {
  const [first, ...rest] = session.speakers;
  if (!first) return undefined;
  const who = first.company ? `${first.name} (${first.company})` : first.name;
  return rest.length ? `${who} +${rest.length}` : who;
}

type Props = {
  session: Session;
  tz: string;
  trackGroups: TrackGroup[];
  reasons?: string[];
  forYou?: boolean;
  picked?: boolean;
  conflict?: boolean;
  /** Collapsed cards on the timeline open the picker instead of expanding */
  onPress?: () => void;
  onPick?: () => void;
  onUnpick?: () => void;
};

/** Picked sessions render as ink cards with a lime check, choices as white cards */
export function SessionCard({
  session,
  tz,
  trackGroups,
  reasons,
  forYou,
  picked,
  conflict,
  onPress,
  onPick,
  onUnpick,
}: Props) {
  const [open, setOpen] = useState(false);
  const { label, color } = sessionLabel(session, trackGroups);
  const meta = [
    `${formatTime(session.start, tz)}–${formatTime(session.end, tz)}`,
    session.room,
    speakerSummary(session),
  ]
    .filter(Boolean)
    .join(' · ');
  const why = reasons?.filter((r) => !/only$/.test(r));
  const formatWarning = reasons?.find((r) => /only$/.test(r));
  const dark = !!picked;
  const fg = dark ? C.white : C.ink;
  const sub = dark ? C.faint : C.muted;

  return (
    <Animated.View layout={LinearTransition.springify().damping(20)} style={[styles.card, dark && styles.cardDark]}>
      <PressableScale
        scaleTo={0.98}
        onPress={onPress ?? (() => setOpen((o) => !o))}
        accessibilityRole="button"
        accessibilityHint={onPress ? 'Opens the session picker' : 'Shows details'}
        style={styles.content}>
        <View style={styles.top}>
          {label ? (
            <>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={[styles.label, { color: dark ? C.faint : color }]} numberOfLines={1}>
                {label}
              </Text>
            </>
          ) : null}
          {forYou ? (
            <View style={[styles.badge, { backgroundColor: dark ? C.ink2 : C.ink }]}>
              <Text style={styles.badgeText}>★ For you</Text>
            </View>
          ) : null}
          <View style={{ flex: 1 }} />
          {picked ? (
            <Animated.View entering={ZoomIn.springify()} style={styles.check}>
              <Text style={styles.checkText}>✓</Text>
            </Animated.View>
          ) : null}
        </View>
        <Text style={[styles.title, { color: fg }]}>{session.title}</Text>
        <Text style={[styles.meta, { color: sub }]}>{meta}</Text>
        {why?.length ? (
          <Text style={[styles.why, { color: dark ? C.lime : C.body }]}>Why: {why.join(' · ')}</Text>
        ) : null}
        {formatWarning ? <Text style={styles.warn}>{formatWarning}</Text> : null}
        {conflict ? <Text style={styles.warn}>⚠ Overlaps another session in your plan</Text> : null}
      </PressableScale>

      {open && !onPress ? (
        <Animated.View entering={FadeIn.duration(200)} style={styles.details}>
          {session.abstract ? (
            <Text style={[styles.abstract, { color: dark ? '#E5E5E5' : C.body }]}>{session.abstract}</Text>
          ) : null}
          {session.speakers.length ? (
            <Text style={[styles.speakers, { color: sub }]}>
              {session.speakers.map((p) => [p.name, p.title, p.company].filter(Boolean).join(', ')).join('\n')}
            </Text>
          ) : null}
          {session.sourceUrl ? (
            <Pressable onPress={() => Linking.openURL(session.sourceUrl!)} accessibilityRole="link">
              <Text style={[styles.linkText, { color: dark ? C.lime : C.ink }]}>
                Reserve or view in the official catalog ↗
              </Text>
            </Pressable>
          ) : null}
        </Animated.View>
      ) : null}

      {onPick || onUnpick ? (
        <View style={styles.actions}>
          <Text style={[styles.more, { color: sub }]} onPress={() => setOpen((o) => !o)}>
            {open ? 'Less' : 'Details'}
          </Text>
          {picked ? (
            <PressableScale
              onPress={() => {
                haptic.tap();
                onUnpick?.();
              }}
              style={[styles.action, styles.actionGhost]}
              accessibilityRole="button">
              <Text style={[styles.actionText, { color: C.white }]}>Remove</Text>
            </PressableScale>
          ) : (
            <PressableScale
              onPress={() => {
                haptic.success();
                onPick?.();
              }}
              style={[styles.action, { backgroundColor: C.lime }]}
              accessibilityRole="button">
              <Text style={styles.actionText}>Add to plan +</Text>
            </PressableScale>
          )}
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: R.md, paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  cardDark: { backgroundColor: C.ink },
  content: { gap: 6 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 24 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 10, fontFamily: F.semibold, letterSpacing: 0.6, flexShrink: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.pill },
  badgeText: { color: C.lime, fontSize: 10, fontFamily: F.semibold },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { color: C.ink, fontSize: 13, fontFamily: F.bold },
  title: { fontSize: 15, fontFamily: F.semibold, lineHeight: 20, letterSpacing: -0.4 },
  meta: { fontSize: 12, lineHeight: 17 },
  why: { fontSize: 11, fontFamily: F.medium },
  warn: { fontSize: 11, fontFamily: F.semibold, color: C.warn },
  details: { gap: 8, paddingTop: 4 },
  abstract: { fontSize: 13, lineHeight: 19 },
  speakers: { fontSize: 12, lineHeight: 18 },
  linkText: { fontSize: 13, fontFamily: F.semibold },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  more: { fontSize: 12, fontFamily: F.medium, padding: 4 },
  action: { borderRadius: R.pill, paddingHorizontal: 16, paddingVertical: 10 },
  actionGhost: { borderWidth: 1.5, borderColor: C.ink2, backgroundColor: C.ink2 },
  actionText: { fontSize: 13, fontFamily: F.semibold, color: C.ink },
});
