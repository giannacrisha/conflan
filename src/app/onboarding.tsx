import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import type { CareerLevel, Profile } from '@/core/types';
import { usePlanner } from '@/lib/store';
import { Button, Chip, Field, Kicker, Segmented, Title } from '@/ui/primitives';
import { Screen } from '@/ui/screen';
import { C } from '@/ui/theme';

const LEVELS: { value: CareerLevel; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'early', label: 'Early' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
];

const SUGGESTED = ['AI', 'Accessibility', 'Data', 'Security', 'Product', 'Leadership', 'Startups', 'Interviewing'];

export default function Onboarding() {
  const saved = usePlanner((s) => s.profile);
  const saveProfile = usePlanner((s) => s.saveProfile);
  const [profile, setProfile] = useState<Profile>(saved);
  const [draft, setDraft] = useState('');

  const toggleInterest = (word: string) =>
    setProfile((p) => ({
      ...p,
      interests: p.interests.includes(word) ? p.interests.filter((w) => w !== word) : [...p.interests, word],
    }));

  const addDraft = () => {
    const words = draft
      .split(',')
      .map((w) => w.trim())
      .filter((w) => w && !profile.interests.includes(w));
    if (words.length) setProfile((p) => ({ ...p, interests: [...p.interests, ...words] }));
    setDraft('');
  };

  const finish = (p: Profile) => {
    saveProfile(p);
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <Screen
      footer={
        <>
          <Button label="Skip for now" variant="link" onPress={() => finish(saved)} />
          <Button label="Save profile" onPress={() => finish(profile)} />
        </>
      }>
      <View style={{ gap: 8 }}>
        <Kicker>CONFLAN</Kicker>
        <Title size={28}>Plan any conference in minutes</Title>
        <Text style={styles.lede}>
          Tell us a bit about you once. Every event you add gets sessions ranked by how well they fit. You can skip this
          and still build a schedule.
        </Text>
      </View>

      <Field label="Name">
        <TextInput
          value={profile.name ?? ''}
          onChangeText={(name) => setProfile((p) => ({ ...p, name }))}
          placeholder="What should we call you?"
          placeholderTextColor={C.muted}
          style={styles.input}
          autoComplete="given-name"
        />
      </Field>

      <Field label="Career level">
        <Segmented
          options={LEVELS}
          value={profile.careerLevel}
          onChange={(careerLevel) => setProfile((p) => ({ ...p, careerLevel }))}
        />
      </Field>

      <Field label="How are you attending?">
        <Segmented
          options={[
            { value: 'in-person', label: 'In person' },
            { value: 'virtual', label: 'Virtual' },
          ]}
          value={profile.format}
          onChange={(format) => setProfile((p) => ({ ...p, format }))}
        />
      </Field>

      <Field label="Topics you care about (used at every event)">
        <View style={styles.chips}>
          {[...new Set([...SUGGESTED, ...profile.interests])].map((w) => (
            <Chip key={w} label={w} selected={profile.interests.includes(w)} onPress={() => toggleInterest(w)} />
          ))}
        </View>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={addDraft}
          onBlur={addDraft}
          placeholder="Add your own, separated by commas"
          placeholderTextColor={C.muted}
          style={styles.input}
          returnKeyType="done"
        />
      </Field>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lede: { fontSize: 15, lineHeight: 22, color: C.muted },
  input: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.ink,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
