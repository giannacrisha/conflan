import { describe, expect, it } from 'vitest';
import { contactUrl, introMessage, shortBio } from './outreach';
import { makeSession } from './test-utils';

describe('contactUrl', () => {
  it('prefers LinkedIn and falls back to a people search', () => {
    expect(contactUrl({ name: 'Ada', linkedIn: 'https://linkedin.com/in/ada' })).toBe('https://linkedin.com/in/ada');
    expect(contactUrl({ name: 'Ada Lovelace', company: 'Analytical' })).toBe(
      'https://www.linkedin.com/search/results/people/?keywords=Ada%20Lovelace%20Analytical',
    );
  });
});

describe('introMessage', () => {
  it('mentions the session and interests when known', () => {
    const msg = introMessage({
      speaker: { name: 'Ada Lovelace' },
      session: makeSession({ id: 's', title: 'Engines' }),
      eventName: 'IA Gathering',
      profile: { name: 'Gi', interests: ['AI', 'Design', 'Data'] },
    });
    expect(msg).toBe(
      "Hi Ada, I'm Gi and I'll be at IA Gathering. I'm planning to attend \"Engines\". I'm interested in AI and Design and would love to hear your perspective. Would you be open to a quick chat during the event?",
    );
  });

  it('reads naturally with an empty profile', () => {
    const msg = introMessage({ speaker: { name: 'Ada' }, eventName: 'X', profile: { interests: [] } });
    expect(msg).toBe("Hi Ada, I'll be at X. Would you be open to a quick chat during the event?");
  });
});

describe('shortBio', () => {
  it('keeps whole sentences under the limit', () => {
    expect(shortBio('First one. Second one is longer. Third.', 30)).toBe('First one.');
    expect(shortBio('Short.', 30)).toBe('Short.');
    expect(shortBio('no punctuation at all here', 16)).toBe('no punctuation…');
    expect(shortBio(undefined)).toBeUndefined();
  });
});
