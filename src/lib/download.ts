// Native exports: write the file to the cache folder and open the share sheet,
// so the attendee can send it to Calendar, Files, Mail, etc.

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function saveText(filename: string, text: string, mimeType: string) {
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(text);
  await Sharing.shareAsync(file.uri, {
    mimeType,
    UTI: mimeType === 'text/calendar' ? 'com.apple.ical.ics' : undefined,
  });
}

// Wallpaper rendering on native ships with the app store release (Phase 3)
export const canSaveImage = false;

export async function saveSvgAsPng(_filename: string, _svg: string, _width: number, _height: number) {
  throw new Error('Image export is only available on the web for now');
}

export type PngSource = { filename: string; svg: string; width: number; height: number };

export async function savePngs(_images: PngSource[]) {
  throw new Error('Image export is only available on the web for now');
}

export async function sharePngs(_images: PngSource[], _text?: string) {
  throw new Error('Image export is only available on the web for now');
}
