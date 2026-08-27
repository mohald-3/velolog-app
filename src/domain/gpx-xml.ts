import { XMLParser, XMLValidator } from 'fast-xml-parser';

/** Import guardrails: generous for multi-hour rides while bounding whole-document parsing memory. */
export const MAX_GPX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_GPX_POINTS = 100_000;

const ARRAY_PATHS = new Set([
  'gpx.trk',
  'gpx.trk.trkseg',
  'gpx.trk.trkseg.trkpt',
  'gpx.rte',
  'gpx.rte.rtept',
]);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  removeNSPrefix: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  isArray: (_tagName, path) => typeof path === 'string' && ARRAY_PATHS.has(path),
});

/**
 * Validates and parses GPX XML into a namespace-neutral tree. Point/segment containers are always
 * arrays, which keeps the later GPX normalization logic independent of document cardinality.
 */
export function parseGpxXml(xml: string): Record<string, unknown> {
  const validation = XMLValidator.validate(xml);
  if (validation !== true) {
    throw new Error(`Invalid GPX XML: ${validation.err.msg}`);
  }

  const parsed: unknown = parser.parse(xml);
  if (typeof parsed !== 'object' || parsed === null || !('gpx' in parsed)) {
    throw new Error('Invalid GPX XML: missing gpx root element');
  }
  return parsed as Record<string, unknown>;
}
