import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import type { DayPlan, Slot } from '@/core/slots';
import { formatTime } from '@/core/time';
import type { Session } from '@/core/types';
import type { PlanModel } from '@/lib/use-plan';
import { usePlanner } from '@/lib/store';
import { enter, haptic, PressableScale } from './motion';
import { SessionCard } from './session-card';
import { F, R, type Theme } from './theme';
import { useStyles, useTheme } from './theme-context';

type Row = { kind: 'fixed'; start: string; session: Session } | { kind: 'slot'; start: string; slot: Slot };

export function Timeline({
  model,
  day,
  activeSlotId,
  onOpenSlot,
}: {
  model: PlanModel;
  day: DayPlan;
  activeSlotId?: string;
  onOpenSlot: (slotId: string) => void;
}) {
  const C = useTheme();
  const styles = useStyles(makeStyles);
  const { tz } = model;
  const pick = usePlanner((s) => s.pick);
  const unpick = usePlanner((s) => s.unpick);
  const eventId = model.data.event.id;

  const rows: Row[] = [
    ...day.fixed.map((s) => ({ kind: 'fixed' as const, start: s.start, session: s })),
    ...day.slots.map((slot) => ({ kind: 'slot' as const, start: slot.start, slot })),
  ].sort((a, b) => a.start.localeCompare(b.start));

  return (
    <View style={styles.wrap}>
      {day.background.length ? (
        <View style={styles.background}>
          <Text style={styles.backgroundTitle}>RUNNING ALL DAY</Text>
          {day.background.map((s) => {
            const on = model.picked.has(s.id);
            return (
              <Pressable
                key={s.id}
                onPress={() => {
                  haptic.tap();
                  if (on) unpick(eventId, s.id);
                  else pick(eventId, s.id, []);
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                style={styles.backgroundRow}>
                <View style={[styles.box, on && styles.boxOn]}>
                  {on ? <Text style={styles.boxCheck}>✓</Text> : null}
                </View>
                <Text style={styles.backgroundText}>
                  {s.title} · {formatTime(s.start, tz)}–{formatTime(s.end, tz)}
                  {s.room ? ` · ${s.room}` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View>
        {/* The spine that connects every block, like a task timeline */}
        <View style={styles.spine} />
        {rows.map((row, i) => {
          const active = row.kind === 'slot' && row.slot.id === activeSlotId;
          const done = row.kind === 'slot' && row.slot.sessionIds.some((id) => model.picked.has(id));
          return (
            <Animated.View
              key={row.kind === 'slot' ? row.slot.id : row.session.id}
              entering={enter(i)}
              style={styles.row}>
              <View style={styles.rail}>
                <View
                  style={[styles.node, (done || row.kind === 'fixed') && styles.nodeOn, active && styles.nodeActive]}
                />
                <Text style={[styles.time, active && { color: C.ink }]}>{formatTime(row.start, tz)}</Text>
              </View>
              <View style={styles.body}>
                {row.kind === 'fixed' ? (
                  <View style={styles.fixed}>
                    <Text style={styles.fixedTitle}>{row.session.title}</Text>
                    <Text style={styles.fixedSub}>
                      {[`${formatTime(row.session.start, tz)}–${formatTime(row.session.end, tz)}`, row.session.room]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                ) : (
                  <SlotRow model={model} slot={row.slot} active={active} onOpen={() => onOpenSlot(row.slot.id)} />
                )}
              </View>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

function SlotRow({
  model,
  slot,
  active,
  onOpen,
}: {
  model: PlanModel;
  slot: Slot;
  active: boolean;
  onOpen: () => void;
}) {
  const C = useTheme();
  const styles = useStyles(makeStyles);
  const { tz } = model;
  const pickedHere = slot.sessionIds.filter((id) => model.picked.has(id));
  const ranked = model.ranked.get(slot.id) ?? [];

  if (pickedHere.length) {
    return (
      <View style={{ gap: 6 }}>
        {pickedHere.map((id) => {
          const r = ranked.find((x) => x.session.id === id);
          return (
            <SessionCard
              key={id}
              session={model.byId.get(id)!}
              tz={tz}
              trackGroups={model.data.event.trackGroups}
              reasons={r?.reasons}
              forYou={r?.forYou}
              picked
              conflict={model.conflicts.has(id)}
              onPress={onOpen}
            />
          );
        })}
      </View>
    );
  }

  const forYou = ranked.filter((r) => r.forYou).length;
  const label =
    ranked.length === 1 ? ranked[0].session.title : `${ranked.length} options${forYou ? ` · ★ ${forYou} for you` : ''}`;
  return (
    <PressableScale
      onPress={() => {
        haptic.tap();
        onOpen();
      }}
      accessibilityRole="button"
      style={[styles.open, active && styles.openActive]}>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.openTitle, active && { color: C.onAccent }]}>
          {ranked.length === 1 ? 'Optional' : 'Choose a session'}
        </Text>
        <Text style={[styles.openSub, active && { color: C.onAccent }]} numberOfLines={2}>
          {formatTime(slot.start, tz)}–{formatTime(slot.end, tz)} · {label}
        </Text>
      </View>
      <View style={[styles.plus, active && { backgroundColor: C.ink }]}>
        <Text style={[styles.plusText, active && { color: C.accent }]}>+</Text>
      </View>
    </PressableScale>
  );
}

const RAIL = 80;

const makeStyles = (C: Theme) =>
  StyleSheet.create({
    wrap: { gap: 14 },
    spine: { position: 'absolute', left: 5, top: 14, bottom: 14, width: 2, backgroundColor: C.line },
    row: { flexDirection: 'row', gap: 8, paddingBottom: 10 },
    rail: { width: RAIL, flexDirection: 'row', gap: 8, paddingTop: 14 },
    node: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: C.bg,
      borderWidth: 2,
      borderColor: C.faint,
      marginTop: 1,
    },
    nodeOn: { backgroundColor: C.ink, borderColor: C.ink },
    nodeActive: { backgroundColor: C.accent, borderColor: C.ink },
    time: { flex: 1, fontSize: 10, fontFamily: F.semibold, color: C.muted, lineHeight: 14 },
    body: { flex: 1 },
    fixed: { backgroundColor: C.surfaceAlt, borderRadius: R.md, paddingHorizontal: 16, paddingVertical: 12, gap: 2 },
    fixedTitle: { fontSize: 13, fontFamily: F.semibold, color: C.ink },
    fixedSub: { fontSize: 11, color: C.muted },
    open: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: R.md,
      paddingLeft: 16,
      paddingRight: 10,
      paddingVertical: 12,
      backgroundColor: C.surface,
    },
    openActive: { backgroundColor: C.accent },
    openTitle: { fontSize: 14, fontFamily: F.semibold, color: C.ink, letterSpacing: -0.3 },
    openSub: { fontSize: 12, color: C.muted },
    plus: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: C.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    plusText: { fontSize: 18, fontFamily: F.semibold, color: C.onAccent },
    background: { backgroundColor: C.surface, borderRadius: R.md, padding: 14, gap: 8 },
    backgroundTitle: { fontSize: 10, fontFamily: F.semibold, color: C.muted, letterSpacing: 1 },
    backgroundRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
    box: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: C.faint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    boxOn: { backgroundColor: C.ink, borderColor: C.ink },
    boxCheck: { color: C.accent, fontSize: 11, fontFamily: F.bold },
    backgroundText: { flex: 1, fontSize: 12, color: C.body, lineHeight: 18 },
  });
