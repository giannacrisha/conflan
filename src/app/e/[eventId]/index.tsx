import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { dayKey, formatDay } from '@/core/time';
import { usePlanner } from '@/lib/store';
import { usePlan, type PlanModel } from '@/lib/use-plan';
import { Button, Kicker, Title } from '@/ui/primitives';
import { SlotPicker } from '@/ui/slot-picker';
import { Timeline } from '@/ui/timeline';
import { C, LINKS, serif, WIDE } from '@/ui/theme';

export default function Planner() {
  const { eventId, picks: shared } = useLocalSearchParams<{ eventId: string; picks?: string }>();
  const { model, loading, error } = usePlan(eventId);
  const { width } = useWindowDimensions();
  const [dayIndex, setDayIndex] = useState<number | undefined>();
  const [openSlotId, setOpenSlotId] = useState<string | undefined>();

  if (!model) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.muted}>{loading ? 'Loading agenda…' : `Couldn’t load this event (${error}).`}</Text>
        <Button label="Back to my events" variant="link" onPress={() => router.replace('/')} />
      </SafeAreaView>
    );
  }

  const today = dayKey(new Date().toISOString(), model.tz);
  const defaultDay = Math.max(
    0,
    model.days.findIndex((d) => d.day === today),
  );
  const index = Math.min(dayIndex ?? defaultDay, model.days.length - 1);
  const day = model.days[index];
  const slots = day?.slots ?? [];
  const wide = width >= WIDE;
  const activeSlot =
    slots.find((s) => s.id === openSlotId) ??
    // On wide screens the picker panel is always open: start at the first real choice still to make
    (wide
      ? (slots.find((s) => s.sessionIds.length > 1 && !s.sessionIds.some((id) => model.picked.has(id))) ?? slots[0])
      : undefined);

  const selectDay = (i: number) => {
    setDayIndex(i);
    setOpenSlotId(undefined);
  };
  const banners = <Banners model={model} shared={shared} />;

  if (!day) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.muted}>This event has no sessions published yet.</Text>
      </SafeAreaView>
    );
  }

  if (wide) {
    return (
      <View style={styles.split}>
        <Sidebar model={model} index={index} onSelectDay={selectDay} />
        <ScrollView style={styles.center_col} contentContainerStyle={styles.centerContent}>
          <Kicker color={model.accent}>{formatDay(day.day, 'long').toUpperCase()}</Kicker>
          <Title>Your day</Title>
          {banners}
          <Timeline model={model} day={day} activeSlotId={activeSlot?.id} onOpenSlot={setOpenSlotId} />
        </ScrollView>
        <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
          {activeSlot ? (
            <SlotPicker model={model} slot={activeSlot} />
          ) : (
            <Text style={styles.muted}>No choices on this day.</Text>
          )}
        </ScrollView>
      </View>
    );
  }

  const planned = slots.filter((s) => s.sessionIds.some((id) => model.picked.has(id))).length;
  return (
    <View style={styles.flex}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: model.accent }}>
        <View style={styles.appBar}>
          <Text style={styles.back} onPress={() => router.replace('/')}>
            ‹ My events
          </Text>
          <Text style={styles.appKicker}>
            {model.data.event.name.toUpperCase()} · {planned} OF {slots.length} SLOTS PLANNED
          </Text>
          <Text style={styles.appTitle}>{formatDay(day.day, 'long')}</Text>
        </View>
      </SafeAreaView>
      <DayTabs model={model} index={index} onSelect={selectDay} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.mobileContent}>
        {banners}
        <Timeline model={model} day={day} onOpenSlot={setOpenSlotId} />
      </ScrollView>
      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <View style={styles.bottomRow}>
          <Text style={styles.link} onPress={() => Linking.openURL(LINKS.featureRequest)}>
            💡 Feature
          </Text>
          <Text
            style={styles.link}
            onPress={() => router.push({ pathname: '/e/[eventId]/setup', params: { eventId } })}>
            Topics
          </Text>
          <Button
            label="Export ⤓"
            accent={model.accent}
            onPress={() => router.push({ pathname: '/e/[eventId]/export', params: { eventId } })}
          />
        </View>
      </SafeAreaView>

      <Modal
        visible={!!activeSlot}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpenSlotId(undefined)}>
        <SafeAreaView style={styles.sheet}>
          <View style={styles.sheetBar}>
            <Text style={[styles.link, { color: model.accent }]} onPress={() => setOpenSlotId(undefined)}>
              Done
            </Text>
          </View>
          <ScrollView contentContainerStyle={styles.sheetContent}>
            {activeSlot ? <SlotPicker model={model} slot={activeSlot} /> : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function DayTabs({ model, index, onSelect }: { model: PlanModel; index: number; onSelect: (i: number) => void }) {
  return (
    <View style={styles.tabsWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {model.days.map((d, i) => (
          <Pressable
            key={d.day}
            onPress={() => onSelect(i)}
            accessibilityRole="tab"
            accessibilityState={{ selected: i === index }}
            style={[styles.tab, i === index && { backgroundColor: model.accent }]}>
            <Text style={[styles.tabText, i === index && { color: C.white }]}>{formatDay(d.day)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function Sidebar({ model, index, onSelectDay }: { model: PlanModel; index: number; onSelectDay: (i: number) => void }) {
  const profile = usePlanner((s) => s.profile);
  const tracks = usePlanner((s) => s.tracks[model.data.event.id]) ?? [];
  const eventId = model.data.event.id;
  return (
    <ScrollView style={styles.sidebar} contentContainerStyle={styles.sidebarContent}>
      <Text style={[styles.back, { color: C.muted }]} onPress={() => router.replace('/')}>
        ‹ My events
      </Text>
      <Text style={[styles.sideTitle, { color: model.accent }]}>{model.data.event.name}</Text>
      <Pressable
        style={styles.profileCard}
        onPress={() => router.push({ pathname: '/e/[eventId]/setup', params: { eventId } })}
        accessibilityRole="button">
        <Text style={styles.profileName}>{profile.name || 'Your plan'}</Text>
        <Text style={styles.muted}>
          {tracks.length
            ? `${tracks.length} topics: ${tracks.slice(0, 2).join(', ')}${tracks.length > 2 ? '…' : ''}`
            : 'No topics picked'}
        </Text>
        <Text style={[styles.editLink, { color: model.accent }]}>Edit topics</Text>
      </Pressable>
      <Text style={styles.sideKicker}>YOUR DAYS</Text>
      {model.days.map((d, i) => {
        const done = d.slots.filter((s) => s.sessionIds.some((id) => model.picked.has(id))).length;
        const active = i === index;
        return (
          <Pressable
            key={d.day}
            onPress={() => onSelectDay(i)}
            style={[styles.dayRow, active && { backgroundColor: model.accent, borderColor: model.accent }]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}>
            <View style={styles.dayRowTop}>
              <Text style={[styles.dayName, active && { color: C.white }]}>{formatDay(d.day)}</Text>
              <Text style={[styles.dayCount, active && { color: C.plumTint }]}>
                {done} of {d.slots.length} slots
              </Text>
            </View>
            <View style={[styles.track, active && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${d.slots.length ? (100 * done) / d.slots.length : 0}%`,
                    backgroundColor: active ? C.white : model.accent,
                  },
                ]}
              />
            </View>
          </Pressable>
        );
      })}
      <Button
        label="Export ⤓"
        accent={model.accent}
        onPress={() => router.push({ pathname: '/e/[eventId]/export', params: { eventId } })}
      />
      <Text style={styles.link} onPress={() => Linking.openURL(LINKS.featureRequest)}>
        💡 Request a feature
      </Text>
      <Text style={styles.link} onPress={() => Linking.openURL(LINKS.repo)}>
        ★ Contribute on GitHub
      </Text>
    </ScrollView>
  );
}

function Banners({ model, shared }: { model: PlanModel; shared?: string }) {
  const importPicks = usePlanner((s) => s.importPicks);
  const unpick = usePlanner((s) => s.unpick);
  const [dismissed, setDismissed] = useState(false);
  const eventId = model.data.event.id;
  const incoming = (shared ?? '').split(',').filter((id) => model.byId.has(id) && !model.picked.has(id));

  return (
    <>
      {incoming.length && !dismissed ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Someone shared {incoming.length} sessions with you.</Text>
          <View style={styles.bannerActions}>
            <Button label="Not now" variant="link" onPress={() => setDismissed(true)} />
            <Button
              label="Add to my plan"
              accent={model.accent}
              onPress={() => {
                importPicks(eventId, incoming);
                setDismissed(true);
              }}
            />
          </View>
        </View>
      ) : null}
      {model.missing.length ? (
        <View style={[styles.banner, { backgroundColor: C.warnTint }]}>
          <Text style={[styles.bannerText, { color: C.warn }]}>
            {model.missing.length} session{model.missing.length > 1 ? 's' : ''} you picked{' '}
            {model.missing.length > 1 ? 'were' : 'was'} removed from the agenda.
          </Text>
          <Button label="Clear" variant="link" onPress={() => model.missing.forEach((id) => unpick(eventId, id))} />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: C.bg, padding: 24 },
  muted: { fontSize: 13, color: C.muted, lineHeight: 19 },
  appBar: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 4 },
  back: { fontSize: 13, fontWeight: '600', color: C.plumTint, opacity: 0.9, marginBottom: 6 },
  appKicker: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8, color: '#E6D8E4' },
  appTitle: { fontFamily: serif, fontSize: 24, fontWeight: '700', color: C.white },
  tabsWrap: { backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.line },
  tabs: { gap: 6, paddingHorizontal: 16, paddingVertical: 12 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: C.bg },
  tabText: { fontSize: 12, fontWeight: '600', color: C.muted },
  mobileContent: { padding: 16, gap: 12, paddingBottom: 32 },
  bottomBar: { backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.line },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  link: { fontSize: 13, fontWeight: '600', color: C.muted },
  sheet: { flex: 1, backgroundColor: C.bg },
  sheetBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingVertical: 12 },
  sheetContent: { paddingHorizontal: 16, paddingBottom: 40 },
  split: { flex: 1, flexDirection: 'row', backgroundColor: C.bg },
  sidebar: { width: 290, flexGrow: 0, backgroundColor: C.white, borderRightWidth: 1, borderRightColor: C.line },
  sidebarContent: { padding: 22, gap: 14 },
  sideTitle: { fontFamily: serif, fontSize: 20, fontWeight: '700' },
  profileCard: { backgroundColor: C.plumTint, borderRadius: 12, padding: 14, gap: 4 },
  profileName: { fontSize: 15, fontWeight: '700', color: C.ink },
  editLink: { fontSize: 12, fontWeight: '700', paddingTop: 2 },
  sideKicker: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 0.8, paddingTop: 6 },
  dayRow: { borderRadius: 10, borderWidth: 1, borderColor: C.line, padding: 12, gap: 8 },
  dayRowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  dayName: { fontSize: 13, fontWeight: '600', color: C.ink },
  dayCount: { fontSize: 11, color: C.muted },
  track: { height: 4, borderRadius: 2, backgroundColor: C.plumTint, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
  center_col: { width: 480, flexGrow: 0 },
  centerContent: { padding: 28, gap: 12 },
  panel: { flex: 1, backgroundColor: C.white, borderLeftWidth: 1, borderLeftColor: C.line },
  panelContent: { padding: 28, maxWidth: 760 },
  banner: { backgroundColor: C.plumTint, borderRadius: 12, padding: 14, gap: 8 },
  bannerText: { fontSize: 13, color: C.plum, fontWeight: '600' },
  bannerActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
