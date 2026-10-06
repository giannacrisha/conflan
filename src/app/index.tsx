// Placeholder until Phase 2: lists the synced events to prove the data loads
// in the app. The real "My events" screen replaces this.

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import events from '../../data/index.json';

export default function Home() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>CONFLAN</Text>
        <Text style={styles.title}>Your events</Text>
        {events.map((e) => (
          <View key={e.id} style={[styles.card, { borderLeftColor: e.theme.accent }]}>
            <Text style={styles.name}>{e.name}</Text>
            <Text style={styles.meta}>
              {e.start} to {e.end} · {e.sessionCount} sessions
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F9' },
  content: { padding: 24, gap: 12 },
  kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: '#41263F' },
  title: { fontSize: 28, fontWeight: '700', color: '#222222', marginBottom: 8 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderLeftWidth: 4, gap: 4 },
  name: { fontSize: 16, fontWeight: '600', color: '#222222' },
  meta: { fontSize: 13, color: '#6B6470' },
});
