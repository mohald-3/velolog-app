import { serializeGpx } from './gpx';

describe('serializeGpx', () => {
  const point = { ts: Date.UTC(2026, 7, 27, 6), lat: 59.1, lon: 18.2, accuracyM: 4 };

  it('writes deterministic GPX 1.1 with UTC time and escaped metadata', () => {
    const xml = serializeGpx({ name: 'Morning & <ride>', description: 'A "good" ride', points: [point] });
    expect(xml).toContain('version="1.1" creator="VeloLog"');
    expect(xml).toContain('<name>Morning &amp; &lt;ride&gt;</name>');
    expect(xml).toContain('<desc>A &quot;good&quot; ride</desc>');
    expect(xml).toContain('<trkpt lat="59.1" lon="18.2"><time>2026-08-27T06:00:00.000Z</time></trkpt>');
    expect(xml.endsWith('\n')).toBe(true);
  });

  it('includes finite optional elevation and omits unavailable elevation', () => {
    const xml = serializeGpx({ name: 'Ride', points: [{ ...point, altitudeM: 12.5 }, { ...point, altitudeM: null }] });
    expect(xml.match(/<ele>/g)).toHaveLength(1);
    expect(xml).toContain('<ele>12.5</ele>');
  });

  it('rejects empty and invalid tracks', () => {
    expect(() => serializeGpx({ name: 'Ride', points: [] })).toThrow('empty');
    expect(() => serializeGpx({ name: 'Ride', points: [{ ...point, lat: Number.NaN }] })).toThrow('invalid');
  });
});
