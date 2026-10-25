// Firebase Storage, loaded only when something is uploaded.
import { app } from "./firebase";

export type UploadedFile = { url: string; path: string; name: string; contentType: string; size: number };

const safeName = (name: string) => name.replace(/[^\w.-]+/g, "_").slice(-80) || "file";

const upload = async (
  path: string,
  file: Blob & { name?: string },
  onProgress?: (pct: number) => void,
  contentType = file.type,
): Promise<UploadedFile> => {
  const { getStorage, ref, uploadBytesResumable, getDownloadURL } = await import("firebase/storage");
  const r = ref(getStorage(app), path);
  const task = uploadBytesResumable(r, file, { contentType, cacheControl: "public, max-age=31536000" });
  await new Promise<void>((resolve, reject) => {
    task.on("state_changed", (snap) => onProgress?.(Math.round((snap.bytesTransferred / Math.max(1, snap.totalBytes)) * 100)), reject, () => resolve());
  });
  return { url: await getDownloadURL(r), path, name: file.name || path.split("/").pop() || "file", contentType, size: file.size };
};

/** A screenshot for mentor chat (mentor-uploads/<uid>/...). */
export const uploadChatImage = (uid: string, file: File, onProgress?: (pct: number) => void) =>
  upload(`mentor-uploads/${uid}/${Date.now()}_${safeName(file.name)}`, file, onProgress);

/** A file Gideon attaches to a resource (resources/...). */
export const uploadResourceFile = (file: File, onProgress?: (pct: number) => void) =>
  upload(`resources/${Date.now()}_${safeName(file.name)}`, file, onProgress);

/** A picture or video for the public site (site-media/...). Admins only. */
export const uploadSiteMedia = (path: string, blob: Blob, contentType: string, onProgress?: (pct: number) => void) =>
  upload(`site-media/${path}`, blob, onProgress, contentType);

/** Removes a file from Storage. Missing files are ignored. */
export const deleteStoredFile = async (path: string) => {
  if (!path) return;
  const { getStorage, ref, deleteObject } = await import("firebase/storage");
  try {
    await deleteObject(ref(getStorage(app), path));
  } catch (err: any) {
    if (err?.code !== "storage/object-not-found") throw err;
  }
};

export const safeFileName = safeName;
