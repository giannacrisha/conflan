import {
  GeistMono_400Regular,
  GeistMono_500Medium,
  GeistMono_600SemiBold,
  GeistMono_700Bold,
  useFonts,
} from '@expo-google-fonts/geist-mono';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { C } from '@/ui/theme';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    GeistMono_400Regular,
    GeistMono_500Medium,
    GeistMono_600SemiBold,
    GeistMono_700Bold,
  });
  // Fall back to system fonts if loading fails rather than blocking the app
  if (!loaded && !error) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: 'fade_from_bottom' }}
      />
    </>
  );
}
