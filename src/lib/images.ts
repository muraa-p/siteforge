/**
 * Client-side image handling. Everything stays on-device: the file is scaled
 * down and re-encoded as JPEG so data URLs stay small enough for localStorage
 * and for embedding directly in the exported static site.
 */

const MAX_DIM = 1280;
const QUALITY = 0.82;

export interface ProcessedImage {
  dataUrl: string;
  width: number;
  height: number;
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the image."));
    img.src = src;
  });
}

/** Downscale and re-encode an image file into a compact data URL. */
export async function processImageFile(file: File): Promise<ProcessedImage> {
  const src = await readAsDataURL(file);
  const img = await loadImage(src);
  const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return { dataUrl: canvas.toDataURL("image/jpeg", QUALITY), width, height };
}

/** Is this a pasteable web URL (http/https) rather than a data URL? */
export function isWebUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}