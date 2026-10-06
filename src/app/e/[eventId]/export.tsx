import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Share, StyleSheet, Text, View } from 'react-native';

import { toIcs } from '@/core/ics';
import { formatDay, formatTime } from '@/core/time';
import { wallpaperSvg } from '@/core/wallpaper';
import { SITE_URL } from '@/lib/data';
import { canSaveImage, saveSvgAsPng, saveText } from '@/lib/download';
import { daySchedule, usePlan } from '@/lib/use-plan';
import { Button, Chip, Kicker, Title } from '@/ui/primitives';
import { Screen } from '@/ui/screen';
import { C } from '@/ui/theme';

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export default function Export() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { model } = usePlan(eventId);
  const [includeFixed, setIncludeFixed] = useState(true);
  const [status, setStatus] = useState<string>();

  if (!model) {
    return (
      <Screen>
        <Text style={styles.muted}>Loading…</Text>
      </Screen>
    );
  }

  const { event } = model.data;
  const days = model.days.map((d) => ({ day: d, sessions: daySchedule(model, d, includeFixed) }));
  const total = model.picked.size;

  const run = async (label: string, task: () => Promise<void>) => {
    try {
      await task();
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

  const shareUrl = `${SITE_URL}/e/${eventId}?picks=${[...model.picked].join(',')}`;
  const shareLink = () =>
    run('Link copied. Anyone who opens it can add your sessions to their plan.', async () => {
      if (Platform.OS === 'web') await Clipboard.setStringAsync(shareUrl);
      else await Share.share({ message: `My ${event.name} plan: ${shareUrl}` });
    });

  return (
    <Screen footer={<Button label="‹ Back to planner" variant="link" onPress={() => router.back()} />}>
      <View style={{ gap: 8 }}>
        <Kicker color={model.accent}>{event.name.toUpperCase()}</Kicker>
        <Title size={28}>Take your plan with you</Title>
        <Text style={styles.muted}>
          {total ? `${total} sessions in your plan.` : 'Your plan is empty. Pick some sessions first.'}
        </Text>
      </View>

      <View style={styles.row}>
        <Chip
          label="Include plenaries, meals and other fixed blocks"
          selected={includeFixed}
          onPress={() => setIncludeFixed((v) => !v)}
          accent={model.accent}
        />
      </View>

      <Section
        title="Calendar"
        body="Works with Google Calendar, Apple Calendar and Outlook. Times stay correct in any time zone.">
        <Button label="All days (.ics)" accent={model.accent} onPress={() => exportIcs()} disabled={!total} />
        <View style={styles.row}>
          {days.map(({ day, sessions }) =>
            sessions.length ? (
              <Button
                key={day.day}
                label={formatDay(day.day)}
                variant="ghost"
                accent={model.accent}
                onPress={() => exportIcs(sessions, `-${day.day}`)}
              />
            ) : null,
          )}
        </View>
      </Section>

      <Section
        title="Lock screen wallpaper"
        body={
          canSaveImage
            ? 'One image per day, sized for phones.'
            : 'Coming with the App Store release. Use the web version to make one for now.'
        }>
        <View style={styles.row}>
          {days.map(({ day, sessions }, i) =>
            sessions.length ? (
              <Button
                key={day.day}
                label={formatDay(day.day)}
                variant="ghost"
                accent={model.accent}
                disabled={!canSaveImage}
                onPress={() => exportWallpaper(i)}
              />
            ) : null,
          )}
        </View>
      </Section>

      <Section
        title="Share"
        body="Send your picks to a friend or teammate. Opening the link lets them add your sessions to their own plan.">
        <Button
          label={Platform.OS === 'web' ? 'Copy share link' : 'Share link'}
          variant="ghost"
          accent={model.accent}
          onPress={shareLink}
          disabled={!total}
        />
      </Section>

      {status ? <Text style={[styles.status, { color: model.accent }]}>{status}</Text> : null}
    </Screen>
  );
}

function Section({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.muted}>{body}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  muted: { fontSize: 13, color: C.muted, lineHeight: 19 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  section: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.line, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.ink },
  status: { fontSize: 13, fontWeight: '600' },
});
