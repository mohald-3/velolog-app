import { MAX_GPX_FILE_BYTES, MAX_GPX_POINTS, parseGpxXml } from './gpx-xml';

describe('parseGpxXml dependency contract', () => {
  it('normalizes a namespaced GPX 1.1 track and keeps segments/points as arrays', () => {
    const parsed = parseGpxXml(`<?xml version="1.0"?>
      <gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1">
        <trk><name>Morning Ride</name><trkseg>
          <trkpt lat="59.1" lon="18.1"><ele>12.5</ele><time>2026-08-27T06:00:00Z</time></trkpt>
        </trkseg><trkseg>
          <trkpt lat="59.2" lon="18.2" />
        </trkseg></trk>
      </gpx>`);

    const gpx = parsed.gpx as { trk: { trkseg: { trkpt: Record<string, string>[] }[] }[] };
    expect(gpx.trk).toHaveLength(1);
    expect(gpx.trk[0].trkseg).toHaveLength(2);
    expect(gpx.trk[0].trkseg[0].trkpt[0]).toMatchObject({ lat: '59.1', lon: '18.1', ele: '12.5' });
  });

  it('supports GPX 1.0 route points without timestamps', () => {
    const parsed = parseGpxXml(`
      <gpx xmlns="http://www.topografix.com/GPX/1/0" version="1.0">
        <rte><rtept lat="59.1" lon="18.1"/><rtept lat="59.2" lon="18.2"/></rte>
      </gpx>`);
    const gpx = parsed.gpx as { rte: { rtept: Record<string, string>[] }[] };
    expect(gpx.rte[0].rtept).toHaveLength(2);
  });

  it('rejects malformed XML and documents bounded import limits', () => {
    expect(() => parseGpxXml('<gpx><trk></gpx>')).toThrow('Invalid GPX XML');
    expect(MAX_GPX_FILE_BYTES).toBe(10_485_760);
    expect(MAX_GPX_POINTS).toBe(100_000);
  });

  it('rejects valid XML whose root is not GPX', () => {
    expect(() => parseGpxXml('<not-gpx />')).toThrow('missing gpx root element');
  });
});
