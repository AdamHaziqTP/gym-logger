/*
 * M06-T01: dependency-free app icon generator.
 *
 * Emits valid RGBA PNGs (zlib from the Node standard library, hand-built
 * chunks) so the PWA ships real local icons without any image dependency or
 * binary blob in the repo history. Re-run with `node scripts/generate-icons.mjs`
 * whenever the glyph changes; output is byte-deterministic for a given input
 * size (no timestamps, no randomness).
 *
 * Glyph: a minimal blue barbell on the near-black app background — enough to
 * read as a training log tile at 60 px, restrained enough to match spec §22.
 */

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ICONS_DIR = path.resolve(ROOT, "public/icons");

const BACKGROUND = [0, 0, 0, 255]; // #000000 — matches --bg / theme-color
const ACCENT = [10, 132, 255, 255]; // #0a84ff — matches --accent

/** Normalized glyph rectangles in 0..1 canvas coordinates (x0, y0, x1, y1). */
const GLYPH_RECTS = [
  // Left weight plate.
  [0.16, 0.28, 0.3, 0.72],
  // Right weight plate.
  [0.7, 0.28, 0.84, 0.72],
  // Bar between the plates.
  [0.3, 0.46, 0.7, 0.54],
];

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

/** Renders one size. `pixelColor(xNorm, yNorm)` decides the RGBA sample. */
function renderPng(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let offset = 0;
  for (let y = 0; y < size; y += 1) {
    raw[offset] = 0; // Filter type None per scanline.
    offset += 1;
    for (let x = 0; x < size; x += 1) {
      const xn = (x + 0.5) / size;
      const yn = (y + 0.5) / size;
      const inside = GLYPH_RECTS.some(
        ([x0, y0, x1, y1]) => xn >= x0 && xn < x1 && yn >= y0 && yn < y1,
      );
      const color = inside ? ACCENT : BACKGROUND;
      raw[offset] = color[0];
      raw[offset + 1] = color[1];
      raw[offset + 2] = color[2];
      raw[offset + 3] = color[3];
      offset += 4;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // Bit depth.
  ihdr[9] = 6; // Color type RGBA.
  ihdr[10] = 0; // Compression.
  ihdr[11] = 0; // Filter.
  ihdr[12] = 0; // Interlace.

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

const OUTPUTS = [
  { file: path.join(ROOT, "public/apple-touch-icon.png"), size: 180 },
  { file: path.join(ICONS_DIR, "icon-192.png"), size: 192 },
  { file: path.join(ICONS_DIR, "icon-512.png"), size: 512 },
];

mkdirSync(ICONS_DIR, { recursive: true });
for (const { file, size } of OUTPUTS) {
  writeFileSync(file, renderPng(size));
  console.log(`wrote ${path.relative(ROOT, file)} (${size}x${size})`);
}
