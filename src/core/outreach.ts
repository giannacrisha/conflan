// "Reach out" for People to meet: where to contact a speaker and a short,
// editable intro message that references why they matched.

import { clip } from './text';
import type { Profile, Session, Speaker } from './types';

/** Their LinkedIn if the agenda lists it, otherwise a LinkedIn people search */
export function contactUrl(speaker: Speaker): string {
  if (speaker.linkedIn) return speaker.linkedIn;
  const q = [speaker.name, speaker.company].filter(Boolean).join(' ');
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(q)}`;
}

export function introMessage({
  speaker,
  session,
  eventName,
  profile,
}: {
  speaker: Speaker;
  session?: Session;
  eventName: string;
  profile: Pick<Profile, 'name' | 'interests'>;
}): string {
  const first = speaker.name.split(/\s+/)[0];
  const me = profile.name?.trim() ? `I'm ${profile.name.trim()} and I'll` : "I'll";
  const talk = session ? ` I'm planning to attend "${session.title}".` : '';
  const topics = profile.interests.slice(0, 2);
  const why = topics.length
    ? ` I'm interested in ${topics.join(' and ')} and would love to hear your perspective.`
    : '';
  return `Hi ${first}, ${me} be at ${eventName}.${talk}${why} Would you be open to a quick chat during the event?`;
}

/** First sentence or two of a bio, up to `max` characters */
export function shortBio(bio: string | undefined, max = 180): string | undefined {
  if (!bio) return undefined;
  const text = bio.replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
  let out = '';
  for (const s of sentences) {
    if ((out + s).length > max) break;
    out += s;
  }
  return out.trim() || clip(text, max);
}
