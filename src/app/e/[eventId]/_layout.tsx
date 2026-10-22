import { Stack, useLocalSearchParams } from 'expo-router';

import { ThemeProvider, useEventTheme } from '@/ui/theme-context';

/** Every event screen uses the event's own colors */
export default function EventLayout() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const theme = useEventTheme(eventId);
  return (
    <ThemeProvider value={theme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
          animation: 'fade_from_bottom',
        }}
      />
    </ThemeProvider>
  );
}
