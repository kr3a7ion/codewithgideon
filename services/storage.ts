// Firebase Storage, loaded only when something is uploaded.
import { app } from "./firebase";

export type UploadedFile = { url: string; path: string; name: string; contentType: string; size: number };

const safeName = (name: string) => name.replace(/[^\w.-]+/g, "_").slice(-80) || "file";

const upload = async (path: string, file: File, onProgress?: (pct: number) => void): Promise<UploadedFile> => {
  const { getStorage, ref, uploadBytesResumable, getDownloadURL } = await import("firebase/storage");
  const r = ref(getStorage(app), path);
  const task = uploadBytesResumable(r, file, { contentType: file.type });
  await new Promise<void>((resolve, reject) => {
    task.on("state_changed", (snap) => onProgress?.(Math.round((snap.bytesTransferred / Math.max(1, snap.totalBytes)) * 100)), reject, () => resolve());
  });
  return { url: await getDownloadURL(r), path, name: file.name, contentType: file.type, size: file.size };
};

/** A screenshot for mentor chat (mentor-uploads/<uid>/...). */
export const uploadChatImage = (uid: string, file: File, onProgress?: (pct: number) => void) =>
  upload(`mentor-uploads/${uid}/${Date.now()}_${safeName(file.name)}`, file, onProgress);

/** A file Gideon attaches to a resource (resources/...). */
export const uploadResourceFile = (file: File, onProgress?: (pct: number) => void) =>
  upload(`resources/${Date.now()}_${safeName(file.name)}`, file, onProgress);
