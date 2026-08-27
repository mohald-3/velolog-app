import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

import { deleteImportedTrackAsync, pickGpxImportAsync, writeImportedTrackAsync } from './gpxImport';

jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'import-id' }));
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///documents/',
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

const picker = jest.mocked(DocumentPicker.getDocumentAsync);
const getInfo = jest.mocked(FileSystem.getInfoAsync);
const readString = jest.mocked(FileSystem.readAsStringAsync);

beforeEach(() => jest.clearAllMocks());

describe('GPX import file service', () => {
  it('returns null without writing when selection is cancelled', async () => {
    picker.mockResolvedValue({ canceled: true, assets: null });
    await expect(pickGpxImportAsync()).resolves.toBeNull();
    expect(readString).not.toHaveBeenCalled();
  });

  it('rejects an oversized asset before reading its contents', async () => {
    picker.mockResolvedValue({
      canceled: false,
      assets: [{ name: 'huge.gpx', uri: 'file:///cache/huge.gpx', size: 10 * 1024 * 1024 + 1, lastModified: 0 }],
    });
    getInfo.mockResolvedValue({ exists: true, isDirectory: false, uri: 'file:///cache/huge.gpx', size: 1, modificationTime: 0 });
    await expect(pickGpxImportAsync()).rejects.toThrow('10 MiB');
    expect(readString).not.toHaveBeenCalled();
  });

  it('validates a selected document and returns a normalized draft', async () => {
    picker.mockResolvedValue({
      canceled: false,
      assets: [{ name: 'ride.gpx', uri: 'file:///cache/ride.gpx', size: 100, lastModified: 0 }],
    });
    getInfo.mockResolvedValue({ exists: true, isDirectory: false, uri: 'file:///cache/ride.gpx', size: 100, modificationTime: 0 });
    readString.mockResolvedValue('<gpx><rte><rtept lat="59" lon="18"/></rte></gpx>');
    await expect(pickGpxImportAsync()).resolves.toMatchObject({ filename: 'ride.gpx' });
  });

  it('writes canonical NDJSON and supports idempotent cleanup', async () => {
    getInfo.mockResolvedValue({ exists: false, isDirectory: false, uri: 'file:///documents/rides/' });
    await expect(writeImportedTrackAsync([
      { ts: 1, lat: 59, lon: 18, accuracyM: null, altitudeM: 10 },
    ])).resolves.toBe('file:///documents/rides/import-id.ndjson');
    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      'file:///documents/rides/import-id.ndjson',
      '{"ts":1,"lat":59,"lon":18,"accuracyM":null,"altitudeM":10}\n'
    );
    await deleteImportedTrackAsync('file:///documents/rides/import-id.ndjson');
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file:///documents/rides/import-id.ndjson', { idempotent: true });
  });
});
