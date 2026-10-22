import type { EventConfig, EventData } from '../core/types';
import { loadManual } from './manual';
import { loadRainFocus } from './rainfocus';
import { loadSessionize } from './sessionize';
import { loadWhova } from './whova';

export function loadEvent(config: EventConfig): Promise<EventData> {
  switch (config.source.platform) {
    case 'rainfocus':
      return loadRainFocus(config);
    case 'whova':
      return loadWhova(config);
    case 'sessionize':
      return loadSessionize(config);
    case 'manual':
      return loadManual(config);
  }
}
