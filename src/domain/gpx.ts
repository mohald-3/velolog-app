import type { RawGpsPoint } from './gps-filter';
import { MAX_GPX_POINTS, parseGpxXml } from './gpx-xml';

export interface GpxExportInput {
  name: string;
  description?: string | null;
  points: RawGpsPoint[];
}

export interface GpxImportPoint {
  lat: number;
  lon: number;
  altitudeM: number | null;
  timestampMs: number | null;
}

export interface ParsedGpx {
  name: string | null;
  segments: GpxImportPoint[][];
}

type XmlNode = Record<string, unknown>;

function asNode(value: unknown): XmlNode | null {
  return typeof value === 'object' && value !== null ? (value as XmlNode) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : value == null ? [] : [value];
}

function optionalFiniteNumber(value: unknown, label: string): number | null {
  if (value == null || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`Invalid GPX ${label}`);
  return number;
}

function normalizeImportPoint(value: unknown): GpxImportPoint {
  const point = asNode(value);
  if (!point) throw new Error('Invalid GPX point');
  const lat = optionalFiniteNumber(point.lat, 'latitude');
  const lon = optionalFiniteNumber(point.lon, 'longitude');
  if (lat == null || lat < -90 || lat > 90) throw new Error('Invalid GPX latitude');
  if (lon == null || lon < -180 || lon > 180) throw new Error('Invalid GPX longitude');

  let timestampMs: number | null = null;
  if (point.time != null && point.time !== '') {
    timestampMs = Date.parse(String(point.time));
    if (!Number.isFinite(timestampMs)) throw new Error('Invalid GPX timestamp');
  }
  return {
    lat,
    lon,
    altitudeM: optionalFiniteNumber(point.ele, 'elevation'),
    timestampMs,
  };
}

/** Normalizes GPX 1.0/1.1 tracks and routes while preserving segment boundaries. */
export function parseGpx(xml: string): ParsedGpx {
  const root = asNode(parseGpxXml(xml).gpx);
  if (!root) throw new Error('Invalid GPX root element');

  const segments: GpxImportPoint[][] = [];
  let name: string | null = null;
  for (const trackValue of asArray(root.trk)) {
    const track = asNode(trackValue);
    if (!track) continue;
    if (name == null && typeof track.name === 'string' && track.name.trim()) name = track.name.trim();
    for (const segmentValue of asArray(track.trkseg)) {
      const segment = asNode(segmentValue);
      const points = asArray(segment?.trkpt).map(normalizeImportPoint);
      if (points.length > 0) segments.push(points);
    }
  }
  for (const routeValue of asArray(root.rte)) {
    const route = asNode(routeValue);
    if (!route) continue;
    if (name == null && typeof route.name === 'string' && route.name.trim()) name = route.name.trim();
    const points = asArray(route.rtept).map(normalizeImportPoint);
    if (points.length > 0) segments.push(points);
  }

  const pointCount = segments.reduce((total, segment) => total + segment.length, 0);
  if (pointCount === 0) throw new Error('GPX contains no track or route points');
  if (pointCount > MAX_GPX_POINTS) throw new Error(`GPX exceeds the ${MAX_GPX_POINTS} point limit`);
  return { name, segments };
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
