/**
 * Shrinks a photo in the browser before it's uploaded: a large WebP (up to
 * 1920 px on the long side) and a small one (up to 800 px) for phones.
 * A 5 MB phone photo usually ends up around 150–300 KB, so pages stay quick
 * on mobile data and Storage stays cheap.
 *
 * SVGs and GIFs are kept as they are (resizing would break them).
 */

export type ProcessedImage = {
  large: Blob;
  small?: Blob;
  width: number;
  height: number;
  contentType: string;
  ext: string;
};

const LARGE = 1920;
const SMALL = 800;
const QUALITY = 0.82;

const loadBitmap = async (file: Blob): Promise<{ draw: CanvasImageSource; width: number; height: number; close: () => void }> => {
  if ("createImageBitmap" in window) {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as any);
      return { draw: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      /* fall back to <img> below (older Safari) */
    }
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  await img.decode();
  return { draw: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
};

const encode = async (source: CanvasImageSource, w: number, h: number, type: string): Promise<Blob> => {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser can't resize images.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY));
  if (!blob) throw new Error("Couldn't prepare the image.");
  return blob;
};

const fit = (w: number, h: number, max: number) => {
  const scale = Math.min(1, max / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) };
};

export const processImage = async (file: File): Promise<ProcessedImage> => {
  if (/image\/(svg\+xml|gif)/.test(file.type)) {
    return { large: file, width: 0, height: 0, contentType: file.type, ext: file.type.includes("svg") ? "svg" : "gif" };
  }
  const bmp = await loadBitmap(file);
  try {
    // WebP where the browser can encode it (all current browsers), else JPEG.
    const probe = document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp");
    const type = probe ? "image/webp" : "image/jpeg";
    const big = fit(bmp.width, bmp.height, LARGE);
    const large = await encode(bmp.draw, big.w, big.h, type);
    const small = Math.max(bmp.width, bmp.height) > SMALL * 1.25
      ? await encode(bmp.draw, ...Object.values(fit(bmp.width, bmp.height, SMALL)) as [number, number], type)
      : undefined;
    return { large, small, width: big.w, height: big.h, contentType: type, ext: type === "image/webp" ? "webp" : "jpg" };
  } finally {
    bmp.close();
  }
};

export const formatBytes = (n: number) =>
  n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
