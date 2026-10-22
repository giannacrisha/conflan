import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Platform, Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { shareQuery } from '@/core/compare';
import { toIcs } from '@/core/ics';
import { shareCardSvg } from '@/core/share-card';
import { formatDay, formatTime } from '@/core/time';
import { wallpaperSvg } from '@/core/wallpaper';
import { SITE_URL } from '@/lib/data';
import { canSaveImage, saveSvgAsPng, saveText, shareSvgAsPng } from '@/lib/download';
import { usePlanner } from '@/lib/store';
import { daySchedule, usePlan } from '@/lib/use-plan';
import { enter, haptic } from '@/ui/motion';
import { Button, Chip, IconButton, Kicker, Title } from '@/ui/primitives';
import { Screen } from '@/ui/screen';
import { C, F, R } from '@/ui/theme';

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const monthDay = (day: string) => formatDay(day, 'long').split(', ')[1];

export default function Export() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { model } = usePlan(eventId);
  const name = usePlanner((s) => s.profile.name);
  const [includeFixed, setIncludeFixed] = useState(true);
  const [status, setStatus] = useState<string>();

  const days = useMemo(
    () => model?.days.map((d) => ({ day: d, sessions: daySchedule(model, d, includeFixed) })) ?? [],
    [model, includeFixed],
  );

  const card = useMemo(() => {
    if (!model) return undefined;
    return shareCardSvg({
      eventName: model.data.event.name,
      owner: name ? `${name}'s plan` : undefined,
      dates: `${monthDay(model.data.event.start)} to ${monthDay(model.data.event.end)}`,
      days: model.days
        .map((day) => ({ day, sessions: daySchedule(model, day, false) }))
        .filter((d) => d.sessions.length)
        .map(({ day, sessions }) => ({
          label: formatDay(day.day, 'long'),
          items: sessions.map((s) => ({ time: formatTime(s.start, model.tz), title: s.title, room: s.room })),
        })),
    });
  }, [model, name]);

  if (!model || !card) {
    return (
      <Screen>
        <Text style={styles.muted}>Loading…</Text>
      </Screen>
    );
  }

  const { event } = model.data;
  const total = model.picked.size;

  const run = async (label: string, task: () => Promise<void>) => {
    try {
      await task();
      haptic.success();
      setStatus(label);
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  const exportIcs = (sessions = days.flatMap((d) => d.sessions), suffix = '') =>
    run('Calendar file ready. Open it to add the sessions to your calendar.', () =>
      saveText(`${slug(event.name)}${suffix}.ics`, toIcs(sessions, { calendarName: event.name }), 'text/calendar'),
    );

  const exportWallpaper = (i: number) => {
    const { day, sessions } = days[i];
    const svg = wallpaperSvg({
      eventName: event.name,
      dayLabel: formatDay(day.day, 'long'),
      accent: model.accent,
      items: sessions.map((s) => ({ time: formatTime(s.start, model.tz), title: s.title, room: s.room })),
    });
    return run('Wallpaper saved. Set it as your lock screen from Photos.', () =>
      saveSvgAsPng(`${slug(event.name)}-${day.day}.png`, svg, 1170, 2532),
    );
  };

  const shareUrl = `${SITE_URL}/e/${eventId}/shared?${shareQuery(model.picked, name)}`;
  const shareLink = () =>
    run('Link copied. Friends see your schedule and can compare it with theirs.', async () => {
      if (Platform.OS === 'web') await Clipboard.setStringAsync(shareUrl);
      else await Share.share({ message: `My ${event.name} plan: ${shareUrl}` });
    });

  const imageName = `${slug(event.name)}-plan.png`;
  const preview = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(card.svg)}`;

  return (
    <Screen footer={<Button label="Back to planner" variant="link" onPress={() => router.back()} />}>
      <View style={styles.header}>
        <IconButton glyph="‹" label="Back" onPress={() => router.back()} />
        <View style={{ flex: 1, gap: 4 }}>
          <Kicker>{event.name.toUpperCase()}</Kicker>
          <Title size={28}>Share your plan</Title>
        </View>
      </View>
      <Text style={styles.muted}>
        {total
          ? `${total} session${total === 1 ? '' : 's'} in your plan.`
          : 'Your plan is empty. Pick some sessions first.'}
      </Text>

      <Animated.View entering={enter(0)} style={styles.dark}>
        <Text style={styles.darkTitle}>One-page image</Text>
        <Text style={styles.darkBody}>Your whole schedule on one PNG. Post it or send it to friends.</Text>
        {Platform.OS === 'web' && total ? (
          <Animated.View entering={FadeIn.duration(300)} style={styles.previewWrap}>
            <Image
              source={{ uri: preview }}
              style={[styles.preview, { aspectRatio: card.width / card.height }]}
              contentFit="contain"
              accessibilityLabel="Preview of your schedule image"
            />
          </Animated.View>
        ) : null}
        <View style={styles.row}>
          <Button
            label="Share image"
            variant="lime"
            icon="↗"
            disabled={!total || !canSaveImage}
            onPress={() =>
              run('Image ready.', () => shareSvgAsPng(imageName, card.svg, card.width, card.height, shareUrl))
            }
          />
          <Button
            label="Download PNG"
            variant="ghostLight"
            disabled={!total || !canSaveImage}
            onPress={() => run('Image saved.', () => saveSvgAsPng(imageName, card.svg, card.width, card.height))}
          />
        </View>
        {!canSaveImage ? (
          <Text style={styles.darkBody}>Image export is web-only for now. Use the web version to make one.</Text>
        ) : null}
      </Animated.View>

      <Section
        index={1}
        title="Share link"
        body="Friends see your schedule only, then compare it with theirs to find sessions to attend together.">
        <Button
          label={Platform.OS === 'web' ? 'Copy share link' : 'Share link'}
          icon="↗"
          onPress={shareLink}
          disabled={!total}
        />
      </Section>

      <View style={styles.row}>
        <Chip
          label="Include plenaries, meals and other fixed blocks"
          selected={includeFixed}
          onPress={() => setIncludeFixed((v) => !v)}
        />
      </View>

      <Section
        index={2}
        title="Calendar"
        body="Works with Google Calendar, Apple Calendar and Outlook. Times stay correct in any time zone.">
        <Button label="All days (.ics)" onPress={() => exportIcs()} disabled={!total} />
        <View style={styles.row}>
          {days.map(({ day, sessions }) =>
            sessions.length ? (
              <Chip key={day.day} label={formatDay(day.day)} onPress={() => exportIcs(sessions, `-${day.day}`)} />
            ) : null,
          )}
        </View>
      </Section>

      <Section
        index={3}
        title="Lock screen wallpaper"
        body={
          canSaveImage
            ? 'One image per day, sized for phones.'
            : 'Coming with the App Store release. Use the web version to make one for now.'
        }>
        <View style={styles.row}>
          {days.map(({ day, sessions }, i) =>
            sessions.length ? (
              <Chip
                key={day.day}
                label={formatDay(day.day)}
                onPress={() => (canSaveImage ? exportWallpaper(i) : undefined)}
              />
            ) : null,
          )}
        </View>
      </Section>

      {status ? (
        <Animated.View entering={FadeIn} style={styles.status}>
          <Text style={styles.statusText}>{status}</Text>
        </Animated.View>
      ) : null}
    </Screen>
  );
}

function Section({
  title,
  body,
  index,
  children,
}: {
  title: string;
  body: string;
  index: number;
  children: ReactNode;
}) {
  return (
    <Animated.View entering={enter(index)} style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.muted}>{body}</Text>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  muted: { fontSize: 13, color: C.muted, lineHeight: 19 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dark: { backgroundColor: C.ink, borderRadius: R.lg, padding: 20, gap: 12 },
  darkTitle: { fontSize: 20, fontFamily: F.semibold, color: C.white, letterSpacing: -0.6 },
  darkBody: { fontSize: 13, color: C.faint, lineHeight: 19 },
  previewWrap: {
    borderRadius: R.md,
    overflow: 'hidden',
    backgroundColor: C.ink2,
    maxHeight: 520,
    alignItems: 'center',
  },
  preview: { width: '100%', maxWidth: 360, maxHeight: 520 },
  section: { backgroundColor: C.surface, borderRadius: R.lg, padding: 20, gap: 10 },
  sectionTitle: { fontSize: 17, fontFamily: F.semibold, color: C.ink, letterSpacing: -0.5 },
  status: { backgroundColor: C.lime, borderRadius: R.md, padding: 14 },
  statusText: { fontSize: 13, fontFamily: F.medium, color: C.ink },
});
