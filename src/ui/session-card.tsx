import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatTime } from '@/core/time';
import type { Session, TrackGroup } from '@/core/types';
import { C, groupColor } from './theme';

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
  accent: string;
  reasons?: string[];
  forYou?: boolean;
  picked?: boolean;
  conflict?: boolean;
  /** Collapsed cards on the timeline open the picker instead of expanding */
  onPress?: () => void;
  onPick?: () => void;
  onUnpick?: () => void;
};

export function SessionCard({
  session,
  tz,
  trackGroups,
  accent,
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

  return (
    <View style={[styles.card, picked && { borderColor: accent, borderWidth: 2 }]}>
      <Pressable
        onPress={onPress ?? (() => setOpen((o) => !o))}
        accessibilityRole="button"
        accessibilityHint={onPress ? 'Opens the session picker' : 'Shows details'}
        style={styles.content}>
        <View style={styles.top}>
          {label ? (
            <>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={[styles.label, { color }]} numberOfLines={1}>
                {label}
              </Text>
            </>
          ) : null}
          {forYou ? (
            <View style={[styles.badge, { backgroundColor: accent }]}>
              <Text style={styles.badgeText}>★ For you</Text>
            </View>
          ) : null}
          {picked ? <Text style={[styles.picked, { color: accent }]}>✓ In your plan</Text> : null}
        </View>
        <Text style={styles.title}>{session.title}</Text>
        <Text style={styles.meta}>{meta}</Text>
        {why?.length ? <Text style={[styles.why, { color: accent }]}>Why: {why.join(' · ')}</Text> : null}
        {reasons?.some((r) => /only$/.test(r)) ? (
          <Text style={styles.warn}>{reasons.find((r) => /only$/.test(r))}</Text>
        ) : null}
        {conflict ? <Text style={styles.warn}>Overlaps another session in your plan</Text> : null}
      </Pressable>

      {open && !onPress ? (
        <View style={styles.details}>
          {session.abstract ? <Text style={styles.abstract}>{session.abstract}</Text> : null}
          {session.speakers.length ? (
            <Text style={styles.speakers}>
              {session.speakers.map((p) => [p.name, p.title, p.company].filter(Boolean).join(', ')).join('\n')}
            </Text>
          ) : null}
          {session.sourceUrl ? (
            <Pressable onPress={() => Linking.openURL(session.sourceUrl!)} accessibilityRole="link">
              <Text style={[styles.linkText, { color: accent }]}>Reserve or view in the official catalog ↗</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {onPick || onUnpick ? (
        <View style={styles.actions}>
          <Text style={styles.more} onPress={() => setOpen((o) => !o)}>
            {!onPress ? (open ? 'Less' : 'Details') : ''}
          </Text>
          {picked ? (
            <Pressable onPress={onUnpick} style={[styles.action, { borderColor: accent }]} accessibilityRole="button">
              <Text style={[styles.actionText, { color: accent }]}>Remove</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={onPick}
              style={[styles.action, { backgroundColor: accent, borderColor: accent }]}
              accessibilityRole="button">
              <Text style={[styles.actionText, { color: C.white }]}>Add to plan</Text>
            </Pressable>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  content: { gap: 6 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, flexShrink: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { color: C.white, fontSize: 10, fontWeight: '700' },
  picked: { fontSize: 11, fontWeight: '700' },
  title: { fontSize: 15, fontWeight: '600', color: C.ink, lineHeight: 20 },
  meta: { fontSize: 12, color: C.muted, lineHeight: 17 },
  why: { fontSize: 11, fontWeight: '500' },
  warn: { fontSize: 11, fontWeight: '600', color: C.warn },
  details: { gap: 8, paddingTop: 4 },
  abstract: { fontSize: 13, color: C.body, lineHeight: 19 },
  speakers: { fontSize: 12, color: C.muted, lineHeight: 18 },
  linkText: { fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  more: { fontSize: 12, color: C.muted, fontWeight: '600' },
  action: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  actionText: { fontSize: 13, fontWeight: '600' },
});
