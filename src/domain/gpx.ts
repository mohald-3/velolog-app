import type { RawGpsPoint } from './gps-filter';

export interface GpxExportInput {
  name: string;
  description?: string | null;
  points: RawGpsPoint[];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Serializes an immutable VeloLog track as deterministic, standards-compatible GPX 1.1. */
export function serializeGpx({ name, description, points }: GpxExportInput): string {
  if (points.length === 0) throw new Error('Cannot export an empty GPX track');

  const trackPoints = points.map((point) => {
    if (![point.lat, point.lon, point.ts].every(Number.isFinite)) {
      throw new Error('Cannot export a GPX track containing invalid points');
    }
    const elevation = Number.isFinite(point.altitudeM) ? `<ele>${point.altitudeM}</ele>` : '';
    return `      <trkpt lat="${point.lat}" lon="${point.lon}">${elevation}<time>${new Date(point.ts).toISOString()}</time></trkpt>`;
  });
  const descriptionXml = description ? `\n    <desc>${escapeXml(description)}</desc>` : '';

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="VeloLog" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">',
    '  <trk>',
    `    <name>${escapeXml(name)}</name>${descriptionXml}`,
    '    <trkseg>',
    ...trackPoints,
    '    </trkseg>',
    '  </trk>',
    '</gpx>',
    '',
  ].join('\n');
}
