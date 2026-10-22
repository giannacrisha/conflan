import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { dayKey, formatDay } from '@/core/time';
import { usePlanner } from '@/lib/store';
import { usePlan, type PlanModel } from '@/lib/use-plan';
import { haptic, Progress, PressableScale } from '@/ui/motion';
import { Button, IconButton, Kicker, Title } from '@/ui/primitives';
import { SlotPicker } from '@/ui/slot-picker';
import { Timeline } from '@/ui/timeline';
import { F, LINKS, R, WIDE, type Theme } from '@/ui/theme';
import { useEventVariants, useStyles, useTheme } from '@/ui/theme-context';
import { ThemeSwitcher } from '@/ui/theme-switcher';

const plannedIn = (model: PlanModel, slots: PlanModel['days'][number]['slots']) =>
  slots.filter((s) => s.sessionIds.some((id) => model.picked.has(id))).length;

export default function Planner() {
  const C = useTheme();
  const styles = useStyles(makeStyles);
  const { eventId, picks: shared, from } = useLocalSearchParams<{ eventId: string; picks?: string; from?: string }>();
  const { model, loading, error } = usePlan(eventId);
  const hasColors = useEventVariants(eventId).variants.length > 1;
  const { width } = useWindowDimensions();
  const [dayIndex, setDayIndex] = useState<number | undefined>();
  const [openSlotId, setOpenSlotId] = useState<string | undefined>();

  // Links shared before the read-only view existed point here with ?picks=
  if (shared) {
    return <Redirect href={{ pathname: '/e/[eventId]/shared', params: { eventId, picks: shared, from } }} />;
  }

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
  const go = (screen: 'setup' | 'people' | 'export') =>
    router.push({ pathname: `/e/[eventId]/${screen}`, params: { eventId } });

  if (!day) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.muted}>This event has no sessions published yet.</Text>
      </SafeAreaView>
    );
  }
  const planned = plannedIn(model, slots);

  if (wide) {
    return (
      <View style={styles.split}>
        <Sidebar model={model} index={index} onSelectDay={selectDay} go={go} />
        <ScrollView style={styles.centerCol} contentContainerStyle={styles.centerContent}>
          <Kicker>{formatDay(day.day, 'long').toUpperCase()}</Kicker>
          <Title>Your day</Title>
          <Banners model={model} />
          <Timeline key={day.day} model={model} day={day} activeSlotId={activeSlot?.id} onOpenSlot={setOpenSlotId} />
        </ScrollView>
        <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
          {activeSlot ? (
            <Animated.View key={activeSlot.id} entering={FadeIn.duration(220)}>
              <SlotPicker model={model} slot={activeSlot} />
            </Animated.View>
          ) : (
            <Text style={styles.muted}>No choices on this day.</Text>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.mobileContent} stickyHeaderIndices={[2]}>
          <View style={styles.topRow}>
            <IconButton glyph="‹" label="Back to my events" onPress={() => router.replace('/')} />
            <Text style={styles.eventName} numberOfLines={1}>
              {model.data.event.name}
            </Text>
            {hasColors ? (
              <ThemeSwitcher eventId={eventId} compact />
            ) : (
              <IconButton glyph="?" label="Request a feature" onPress={() => Linking.openURL(LINKS.featureRequest)} />
            )}
          </View>

          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <Text style={styles.heroKicker}>{formatDay(day.day, 'long').toUpperCase()}</Text>
              <Text style={styles.heroCount}>
                {planned}/{slots.length}
              </Text>
            </View>
            <Text style={styles.heroTitle}>
              {planned === slots.length && slots.length ? 'Day planned' : 'Build your day'}
            </Text>
            <Progress value={slots.length ? planned / slots.length : 0} color={C.accent} track={C.ink2} />
            <Text style={styles.heroSub}>
              {slots.length - planned
                ? `${slots.length - planned} time blocks left to choose`
                : 'Every block has a pick. Share it with a friend.'}
            </Text>
          </View>

          <DayPills model={model} index={index} onSelect={selectDay} />

          <Banners model={model} />
          <Timeline key={day.day} model={model} day={day} onOpenSlot={setOpenSlotId} />
        </ScrollView>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={styles.navWrap} pointerEvents="box-none">
        <View style={styles.nav}>
          <NavItem label="Topics" onPress={() => go('setup')} />
          <NavItem label="People" onPress={() => go('people')} />
          <PressableScale
            onPress={() => {
              haptic.tap();
              go('export');
            }}
            accessibilityRole="button"
            style={styles.navCta}>
            <Text style={styles.navCtaText}>Share</Text>
            <View style={styles.navCtaIcon}>
              <Text style={styles.navCtaGlyph}>↗</Text>
            </View>
          </PressableScale>
        </View>
      </SafeAreaView>

      <Modal
        visible={!!activeSlot}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpenSlotId(undefined)}>
        <SafeAreaView style={styles.sheet}>
          <View style={styles.sheetBar}>
            <View style={styles.grabber} />
            <Button label="Done" small onPress={() => setOpenSlotId(undefined)} />
          </View>
          <ScrollView contentContainerStyle={styles.sheetContent}>
            {activeSlot ? <SlotPicker model={model} slot={activeSlot} /> : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function NavItem({ label, onPress }: { label: string; onPress: () => void }) {
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      accessibilityRole="button"
      style={styles.navItem}>
      <Text style={styles.navText}>{label}</Text>
    </Pressable>
  );
}

/** Day picker as tall pills: weekday over date, marigold when active, dot when fully planned */
function DayPills({ model, index, onSelect }: { model: PlanModel; index: number; onSelect: (i: number) => void }) {
  const C = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.pillsWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
        {model.days.map((d, i) => {
          const [weekday, date] = formatDay(d.day).split(' ');
          const active = i === index;
          const done = d.slots.length > 0 && plannedIn(model, d.slots) === d.slots.length;
          return (
            <PressableScale
              key={d.day}
              onPress={() => {
                haptic.tap();
                onSelect(i);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={formatDay(d.day, 'long')}
              style={[styles.pill, active && styles.pillActive]}>
              <Text style={[styles.pillDate, active && { color: C.onAccent }]}>{date}</Text>
              <Text style={[styles.pillDay, active && { color: C.onAccent }]}>{weekday}</Text>
              <View style={[styles.pillDot, done && { backgroundColor: C.ink }]} />
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

function Sidebar({
  model,
  index,
  onSelectDay,
  go,
}: {
  model: PlanModel;
  index: number;
  onSelectDay: (i: number) => void;
  go: (screen: 'setup' | 'people' | 'export') => void;
}) {
  const C = useTheme();
  const styles = useStyles(makeStyles);
  const profile = usePlanner((s) => s.profile);
  const tracks = usePlanner((s) => s.tracks[model.data.event.id]) ?? [];
  return (
    <ScrollView style={styles.sidebar} contentContainerStyle={styles.sidebarContent}>
      <View style={styles.topRow}>
        <IconButton glyph="‹" label="Back to my events" onPress={() => router.replace('/')} />
        <Text style={styles.sideTitle} numberOfLines={2}>
          {model.data.event.name}
        </Text>
      </View>
      <ThemeSwitcher eventId={model.data.event.id} />
      <PressableScale onPress={() => go('setup')} accessibilityRole="button" style={styles.profileCard}>
        <Text style={styles.profileName}>{profile.name || 'Your plan'}</Text>
        <Text style={styles.profileSub}>
          {tracks.length
            ? `${tracks.length} topics: ${tracks.slice(0, 2).join(', ')}${tracks.length > 2 ? '…' : ''}`
            : 'No topics picked'}
        </Text>
        <Text style={styles.editLink}>Edit topics ↗</Text>
      </PressableScale>
      <Kicker>YOUR DAYS</Kicker>
      {model.days.map((d, i) => {
        const done = plannedIn(model, d.slots);
        const active = i === index;
        return (
          <PressableScale
            key={d.day}
            onPress={() => {
              haptic.tap();
              onSelectDay(i);
            }}
            style={[styles.dayRow, active && { backgroundColor: C.ink }]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}>
            <View style={styles.dayRowTop}>
              <Text style={[styles.dayName, active && { color: C.white }]}>{formatDay(d.day)}</Text>
              <Text style={[styles.dayCount, active && { color: C.accent }]}>
                {done}/{d.slots.length}
              </Text>
            </View>
            <Progress
              value={d.slots.length ? done / d.slots.length : 0}
              color={active ? C.accent : C.ink}
              track={active ? C.ink2 : C.surfaceAlt}
              height={4}
            />
          </PressableScale>
        );
      })}
      <Button label="Share and export" icon="↗" onPress={() => go('export')} />
      <Button label="People to meet" variant="ghost" onPress={() => go('people')} />
      <Text style={styles.link} onPress={() => Linking.openURL(LINKS.featureRequest)}>
        Request a feature ↗
      </Text>
      <Text style={styles.link} onPress={() => Linking.openURL(LINKS.repo)}>
        Contribute on GitHub ↗
      </Text>
    </ScrollView>
  );
}

function Banners({ model }: { model: PlanModel }) {
  const C = useTheme();
  const styles = useStyles(makeStyles);
  const unpick = usePlanner((s) => s.unpick);
  const eventId = model.data.event.id;
  const cancelled = model.data.event.status === 'cancelled';
  return (
    <>
      {cancelled ? (
        <View style={[styles.banner, { backgroundColor: C.warnTint }]}>
          <Text style={[styles.bannerText, { color: C.warn }]}>
            This event was cancelled. Your plan is kept here for reference.
          </Text>
        </View>
      ) : null}
      {model.missing.length ? (
        <View style={[styles.banner, { backgroundColor: C.warnTint }]}>
          <Text style={[styles.bannerText, { color: C.warn }]}>
            {model.missing.length} session{model.missing.length > 1 ? 's' : ''} you picked{' '}
            {model.missing.length > 1 ? 'were' : 'was'} removed from the agenda.
          </Text>
          <Button
            label="Clear"
            variant="link"
            small
            onPress={() => model.missing.forEach((id) => unpick(eventId, id))}
          />
        </View>
      ) : null}
    </>
  );
}

const makeStyles = (C: Theme) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: C.bg, padding: 24 },
    muted: { fontSize: 13, color: C.muted, lineHeight: 19 },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    eventName: { flex: 1, fontSize: 14, fontFamily: F.semibold, color: C.ink, textAlign: 'center' },
    mobileContent: { padding: 16, gap: 14, paddingBottom: 120 },
    hero: { backgroundColor: C.ink, borderRadius: R.lg, padding: 20, gap: 10 },
    heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    heroKicker: { fontSize: 11, fontFamily: F.semibold, letterSpacing: 1.2, color: C.faint },
    heroCount: {
      fontSize: 13,
      fontFamily: F.semibold,
      color: C.onAccent,
      backgroundColor: C.accent,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: R.pill,
      overflow: 'hidden',
    },
    heroTitle: { fontSize: 28, fontFamily: F.semibold, color: C.white, letterSpacing: -0.6 },
    heroSub: { fontSize: 12, color: C.faint },
    pillsWrap: { backgroundColor: C.bg, marginHorizontal: -16, paddingVertical: 6 },
    pills: { gap: 8, paddingHorizontal: 16 },
    pill: {
      width: 60,
      paddingVertical: 12,
      borderRadius: R.pill,
      backgroundColor: C.surface,
      alignItems: 'center',
      gap: 2,
    },
    pillActive: { backgroundColor: C.accent },
    pillDate: { fontSize: 20, fontFamily: F.semibold, color: C.ink, letterSpacing: -0.4 },
    pillDay: { fontSize: 11, fontFamily: F.medium, color: C.body },
    pillDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4, backgroundColor: 'transparent' },
    navWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
    nav: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: C.ink,
      borderRadius: R.pill,
      padding: 6,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    navItem: { paddingHorizontal: 16, paddingVertical: 12 },
    navText: { fontSize: 13, fontFamily: F.medium, color: C.white },
    navCta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: C.accent,
      borderRadius: R.pill,
      paddingLeft: 16,
      paddingRight: 4,
      paddingVertical: 4,
    },
    navCtaText: { fontSize: 13, fontFamily: F.semibold, color: C.onAccent },
    navCtaIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: C.ink,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navCtaGlyph: { color: C.accent, fontSize: 16, fontFamily: F.bold },
    link: { fontSize: 13, fontFamily: F.medium, color: C.muted },
    sheet: { flex: 1, backgroundColor: C.bg },
    sheetBar: {
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 4,
      gap: 8,
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    grabber: {
      position: 'absolute',
      top: 6,
      left: '50%',
      marginLeft: -20,
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: C.faint,
    },
    sheetContent: { paddingHorizontal: 16, paddingBottom: 40 },
    split: { flex: 1, flexDirection: 'row', backgroundColor: C.bg },
    sidebar: { width: 300, flexGrow: 0 },
    sidebarContent: { padding: 20, gap: 12 },
    sideTitle: { flex: 1, fontSize: 18, fontFamily: F.semibold, color: C.ink, letterSpacing: -0.6 },
    profileCard: { backgroundColor: C.accent, borderRadius: R.md, padding: 16, gap: 4 },
    profileName: { fontSize: 16, fontFamily: F.semibold, color: C.onAccent },
    profileSub: { fontSize: 12, color: C.onAccent, lineHeight: 17, opacity: 0.85 },
    editLink: { fontSize: 12, fontFamily: F.semibold, color: C.onAccent, paddingTop: 4 },
    dayRow: { borderRadius: R.md, backgroundColor: C.surface, padding: 14, gap: 10 },
    dayRowTop: { flexDirection: 'row', justifyContent: 'space-between' },
    dayName: { fontSize: 13, fontFamily: F.semibold, color: C.ink },
    dayCount: { fontSize: 12, fontFamily: F.medium, color: C.muted },
    centerCol: { width: 500, flexGrow: 0 },
    centerContent: { padding: 28, gap: 14 },
    panel: {
      flex: 1,
      backgroundColor: C.surfaceAlt,
      borderTopLeftRadius: R.lg,
      borderBottomLeftRadius: R.lg,
      margin: 12,
      marginLeft: 0,
    },
    panelContent: { padding: 28, maxWidth: 760 },
    banner: { backgroundColor: C.accentTint, borderRadius: R.md, padding: 14, gap: 8 },
    bannerText: { fontSize: 13, color: C.ink, fontFamily: F.medium },
  });
