// Preview stand-in: "uploads" become local object URLs.
export type UploadedFile = { url: string; path: string; name: string; contentType: string; size: number };
const fake = async (path: string, file: File, onProgress?: (pct: number) => void): Promise<UploadedFile> => {
  for (const p of [30, 70, 100]) {
    await new Promise((r) => setTimeout(r, 150));
    onProgress?.(p);
  }
  return { url: URL.createObjectURL(file), path, name: file.name, contentType: file.type, size: file.size };
};
export const uploadChatImage = (uid: string, file: File, onProgress?: (pct: number) => void) => fake(`mentor-uploads/${uid}/${file.name}`, file, onProgress);
export const uploadResourceFile = (file: File, onProgress?: (pct: number) => void) => fake(`resources/${file.name}`, file, onProgress);
export const uploadSiteMedia = async (path: string, blob: Blob, contentType: string, onProgress?: (pct: number) => void) => {
  for (const p of [25, 60, 100]) {
    await new Promise((r) => setTimeout(r, 120));
    onProgress?.(p);
  }
  return { url: URL.createObjectURL(blob), path: `site-media/${path}`, name: path, contentType, size: blob.size };
};
export const deleteStoredFile = async () => undefined;
export const safeFileName = (name: string) => name.replace(/[^\w.-]+/g, "_").slice(-80) || "file";
