import { parseGpx, serializeGpx } from './gpx';

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

describe('parseGpx', () => {
  it('normalizes namespaced GPX 1.1 tracks and preserves segment boundaries', () => {
    const parsed = parseGpx(`<?xml version="1.0"?>
      <gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1"><trk><name> Tour </name>
        <trkseg><trkpt lat="59.1" lon="18.1"><ele>12.5</ele><time>2026-08-27T06:00:00Z</time></trkpt></trkseg>
        <trkseg><trkpt lat="59.2" lon="18.2"/></trkseg>
      </trk></gpx>`);
    expect(parsed.name).toBe('Tour');
    expect(parsed.segments).toHaveLength(2);
    expect(parsed.segments[0][0]).toEqual({
      lat: 59.1,
      lon: 18.1,
      altitudeM: 12.5,
      timestampMs: Date.parse('2026-08-27T06:00:00Z'),
    });
    expect(parsed.segments[1][0].timestampMs).toBeNull();
  });

  it('supports GPX 1.0 routes and optional fields', () => {
    const parsed = parseGpx(`<gpx xmlns="http://www.topografix.com/GPX/1/0" version="1.0">
      <rte><name>Route</name><rtept lat="59" lon="18"/><rtept lat="59.1" lon="18.1"/></rte>
    </gpx>`);
    expect(parsed.name).toBe('Route');
    expect(parsed.segments[0]).toHaveLength(2);
    expect(parsed.segments[0][0].altitudeM).toBeNull();
  });

  it.each([
    ['empty geometry', '<gpx version="1.1"><trk><trkseg/></trk></gpx>', 'no track or route points'],
    ['bad latitude', '<gpx><rte><rtept lat="91" lon="18"/></rte></gpx>', 'latitude'],
    ['bad longitude', '<gpx><rte><rtept lat="59" lon="oops"/></rte></gpx>', 'longitude'],
    ['bad time', '<gpx><rte><rtept lat="59" lon="18"><time>later</time></rtept></rte></gpx>', 'timestamp'],
  ])('rejects %s', (_case, xml, message) => {
    expect(() => parseGpx(xml)).toThrow(message);
  });
});
