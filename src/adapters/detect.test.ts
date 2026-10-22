import { describe, expect, it } from 'vitest';
import { detectSource } from './detect';

describe('detectSource', () => {
  it('reads a Sessionize embed from page HTML', () => {
    const html = '<script src="https://sessionize.com/api/v2/abc123xy/view/GridSmart?under=True"></script>';
    expect(detectSource('https://devconf.example', html)).toEqual({ platform: 'sessionize', apiId: 'abc123xy' });
  });

  it('decodes a Whova embed id from the URL', () => {
    expect(detectSource('https://whova.com/embedded/event/wXgDwfNAQx29AWtlzgMbHAdZISvovGIh3eZI4wtyirQ%3D/')).toEqual({
      platform: 'whova',
      eventId: 'wXgDwfNAQx29AWtlzgMbHAdZISvovGIh3eZI4wtyirQ=',
    });
  });

  it('finds RainFocus widget ids in a catalog page', () => {
    const html = `rf.init({ apiToken: 'Xh5jjihi5L8EwEEjIplZkG9RmEmsmPEk', widgetId: "nZeaLE1j83n6gXiMHiTabDVB3jCLgG0P" })`;
    expect(detectSource('https://conf.example/catalog', html)).toEqual({
      platform: 'rainfocus',
      apiProfileId: 'Xh5jjihi5L8EwEEjIplZkG9RmEmsmPEk',
      widgetId: 'nZeaLE1j83n6gXiMHiTabDVB3jCLgG0P',
      days: [],
      catalogUrl: 'https://conf.example/catalog',
    });
  });

  it('returns undefined for pages without a known agenda', () => {
    expect(detectSource('https://example.com', '<html></html>')).toBeUndefined();
  });
});
