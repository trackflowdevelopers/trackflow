export interface Codec8Record {
  ts: number;
  lat: number;
  lng: number;
  alt: number;
  heading: number;
  sat: number;
  speed: number;
  io: Map<number, number>;
}

const PREAMBLE = 0x00000000;
const CODEC8_ID = 0x08;

function crc16ibm(buf: Buffer, start: number, end: number): number {
  let crc = 0;
  for (let i = start; i < end; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xa001 : crc >>> 1;
    }
  }
  return crc & 0xffff;
}

function readIoGroup(buf: Buffer, offset: number, valueSize: number): [Map<number, number>, number] {
  const count = buf.readUInt8(offset);
  offset += 1;
  const io = new Map<number, number>();
  for (let i = 0; i < count; i++) {
    const id = buf.readUInt8(offset);
    offset += 1;
    let val: number;
    if (valueSize === 1) val = buf.readUInt8(offset);
    else if (valueSize === 2) val = buf.readUInt16BE(offset);
    else val = buf.readUInt32BE(offset);
    offset += valueSize;
    io.set(id, val);
  }
  return [io, offset];
}

export function decodeCodec8(buf: Buffer): Codec8Record[] | null {
  try {
    let offset = 0;

    if (buf.length < 12) return null;

    if (buf.readUInt32BE(0) === PREAMBLE) {
      offset = 4;
    }

    const dataFieldLength = buf.readUInt32BE(offset);
    offset += 4;

    const dataStart = offset;
    const codecId = buf.readUInt8(offset);
    offset += 1;

    if (codecId !== CODEC8_ID) return null;

    const numRecords = buf.readUInt8(offset);
    offset += 1;

    const records: Codec8Record[] = [];

    for (let r = 0; r < numRecords; r++) {
      if (offset + 24 > buf.length) return null;

      const tsHigh = buf.readUInt32BE(offset);
      const tsLow = buf.readUInt32BE(offset + 4);
      const ts = tsHigh * 0x100000000 + tsLow;
      offset += 8;

      offset += 1; // priority

      const lng = buf.readInt32BE(offset) / 10_000_000;
      offset += 4;
      const lat = buf.readInt32BE(offset) / 10_000_000;
      offset += 4;
      const alt = buf.readUInt16BE(offset);
      offset += 2;
      const heading = buf.readUInt16BE(offset);
      offset += 2;
      const sat = buf.readUInt8(offset);
      offset += 1;
      const speed = buf.readUInt16BE(offset);
      offset += 2;

      offset += 1; // event IO ID
      offset += 1; // N of total IO

      const io = new Map<number, number>();
      let group: Map<number, number>;

      [group, offset] = readIoGroup(buf, offset, 1);
      group.forEach((v, k) => io.set(k, v));

      [group, offset] = readIoGroup(buf, offset, 2);
      group.forEach((v, k) => io.set(k, v));

      [group, offset] = readIoGroup(buf, offset, 4);
      group.forEach((v, k) => io.set(k, v));

      // 8-byte IO: store only if value fits in safe integer (hi word = 0)
      const n8 = buf.readUInt8(offset);
      offset += 1;
      for (let i = 0; i < n8; i++) {
        const id = buf.readUInt8(offset);
        offset += 1;
        const hi = buf.readUInt32BE(offset);
        const lo = buf.readUInt32BE(offset + 4);
        offset += 8;
        if (hi === 0) io.set(id, lo);
      }

      if (lat !== 0 || lng !== 0) {
        records.push({ ts, lat, lng, alt, heading, sat, speed, io });
      }
    }

    if (offset < buf.length) {
      offset += 1; // num records 2
      if (offset + 4 <= buf.length) {
        const expectedCrc = buf.readUInt32BE(offset) & 0xffff;
        const actualCrc = crc16ibm(buf, dataStart, offset);
        if (expectedCrc !== actualCrc) return null;
      }
    }

    return records.length > 0 ? records : null;
  } catch {
    return null;
  }
}

export const IO_IGNITION = 239;
export const IO_MOVEMENT = 240;
export const IO_ODOMETER = 16;
export const IO_DALLAS_TEMP_1 = 72;
export const IO_ANALOG_1 = 9;
