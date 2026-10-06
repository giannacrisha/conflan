import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DayPlan, Slot } from '@/core/slots';
import { formatTime } from '@/core/time';
import type { Session } from '@/core/types';
import type { PlanModel } from '@/lib/use-plan';
import { usePlanner } from '@/lib/store';
import { SessionCard } from './session-card';
import { C } from './theme';

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
  const { tz, accent } = model;
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
          <Text style={styles.backgroundTitle}>Running all day</Text>
          {day.background.map((s) => {
            const on = model.picked.has(s.id);
            return (
              <Pressable
                key={s.id}
                onPress={() => (on ? unpick(eventId, s.id) : pick(eventId, s.id, []))}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                style={styles.backgroundRow}>
                <Text style={[styles.check, { color: accent }]}>{on ? '☑' : '☐'}</Text>
                <Text style={styles.backgroundText}>
                  {s.title} · {formatTime(s.start, tz)}–{formatTime(s.end, tz)}
                  {s.room ? ` · ${s.room}` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {rows.map((row) => {
        const active = row.kind === 'slot' && row.slot.id === activeSlotId;
        return (
          <View key={row.kind === 'slot' ? row.slot.id : row.session.id} style={styles.row}>
            <Text style={[styles.time, active && { color: accent }]}>
              {formatTime(row.start, tz).replace(' ', '\n')}
            </Text>
            <View style={styles.body}>
              {row.kind === 'fixed' ? (
                <View style={styles.fixed}>
                  <Text style={[styles.fixedTitle, { color: accent }]}>{row.session.title}</Text>
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
          </View>
        );
      })}
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
  const { tz, accent } = model;
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
              accent={accent}
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
    ranked.length === 1
      ? ranked[0].session.title
      : `${ranked.length} options${forYou ? ` · ★ ${forYou} picked for you` : ''}`;
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      style={[styles.open, { borderColor: accent }, active ? { backgroundColor: accent, borderStyle: 'solid' } : null]}>
      <Text style={[styles.openTitle, { color: active ? C.white : accent }]}>
        {ranked.length === 1 ? 'Optional' : 'Choose a session'}
      </Text>
      <Text style={[styles.openSub, active && { color: C.plumTint }]} numberOfLines={2}>
        {formatTime(slot.start, tz)}–{formatTime(slot.end, tz)} · {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  time: { width: 50, paddingTop: 12, fontSize: 11, fontWeight: '600', color: C.muted, lineHeight: 15 },
  body: { flex: 1 },
  fixed: { backgroundColor: C.fixed, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, gap: 2 },
  fixedTitle: { fontSize: 13, fontWeight: '600' },
  fixedSub: { fontSize: 11, color: C.muted },
  open: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 3,
    backgroundColor: C.white,
  },
  openTitle: { fontSize: 14, fontWeight: '600' },
  openSub: { fontSize: 12, color: C.muted },
  background: { backgroundColor: C.white, borderRadius: 10, borderWidth: 1, borderColor: C.line, padding: 12, gap: 6 },
  backgroundTitle: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 0.6 },
  backgroundRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  check: { fontSize: 15, lineHeight: 18 },
  backgroundText: { flex: 1, fontSize: 12, color: C.body, lineHeight: 18 },
});
