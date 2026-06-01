import fs from "node:fs";
import path from "node:path";

const uploadsDir = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const ALLOWED_MIMES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "text/plain": "txt",
  "application/zip": "zip",
  "video/mp4": "mp4",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function parseFileDataUrl(dataUrl: string): { buffer: Buffer; ext: string; mime: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) return null;

  const mime = match[1].toLowerCase();
  const ext = ALLOWED_MIMES[mime];
  if (!ext) return null;

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_FILE_SIZE) return null;

  return { buffer, ext, mime };
}

export function saveUploadedFile(prefix: string, dataUrl: string, originalName?: string): {
  url: string;
  name: string;
  mime: string;
} | null {
  const parsed = parseFileDataUrl(dataUrl);
  if (!parsed) return null;

  const safeName = (originalName ?? `file.${parsed.ext}`)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 120);

  const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${parsed.ext}`;
  fs.writeFileSync(path.join(uploadsDir, fileName), parsed.buffer);

  return {
    url: `/api/uploads/${fileName}`,
    name: safeName,
    mime: parsed.mime,
  };
}

export { MAX_FILE_SIZE, ALLOWED_MIMES };
