// Admin side of Site media: saving slots and managing the media library.
// The public pages only read slots (src/marketing/useSiteMedia.ts).
import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { deleteStoredFile, safeFileName, uploadSiteMedia } from "../services/storage"; // path form matches the preview alias
import type { LibraryItem, SlotValue } from "../src/marketing/mediaSlots";
import { processImage } from "../src/features/admin/media/processImage";

export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

const clean = <T extends Record<string, any>>(o: T): T => {
  Object.keys(o).forEach((k) => (o[k] === undefined || o[k] === "") && delete o[k]);
  return o;
};

export const siteMedia = {
  async getSlots(): Promise<Record<string, SlotValue>> {
    const snap = await getDocs(collection(db, "siteMedia"));
    const out: Record<string, SlotValue> = {};
    snap.docs.forEach((d: any) => (out[d.id] = d.data() as SlotValue));
    return out;
  },

  async saveSlot(id: string, value: SlotValue) {
    await setDoc(
      doc(db, "siteMedia", id),
      clean({
        url: value.url,
        smUrl: value.smUrl,
        alt: String(value.alt || "").trim().slice(0, 300),
        kind: value.kind,
        width: value.width,
        height: value.height,
        libraryId: value.libraryId,
        updatedAt: Date.now(),
        updatedBy: auth.currentUser?.email || "admin",
      }),
    );
  },

  /** Back to the built-in default. The file stays in the library. */
  async resetSlot(id: string) {
    await deleteDoc(doc(db, "siteMedia", id));
  },

  async listLibrary(): Promise<LibraryItem[]> {
    const snap = await getDocs(collection(db, "mediaLibrary"));
    return snap.docs
      .map((d: any) => ({ id: d.id, ...(d.data() as any) }) as LibraryItem)
      .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  },

  /** Shrinks images, uploads, and records the file in the library. */
  async upload(file: File, onProgress?: (pct: number) => void): Promise<LibraryItem> {
    const isVideo = /^video\/(mp4|webm)$/.test(file.type);
    const isImage = /^image\/(png|jpe?g|webp|gif|svg\+xml|avif|heic|heif)$/.test(file.type);
    if (!isVideo && !isImage) throw new Error("Use a picture (JPG, PNG, WebP) or an MP4 / WebM video.");
    if (isVideo && file.size > MAX_VIDEO_BYTES) {
      throw new Error("Videos must be under 50 MB. For longer videos, upload to YouTube (unlisted) and paste the link.");
    }
    if (isImage && file.size > MAX_IMAGE_BYTES) throw new Error("That picture is too large (over 25 MB).");

    const stamp = Date.now();
    const base = safeFileName(file.name.replace(/\.[^.]+$/, "")) || "media";
    const id = `${stamp}_${Math.random().toString(36).slice(2, 7)}`;
    let item: LibraryItem;

    if (isVideo) {
      const up = await uploadSiteMedia(`${stamp}_${base}.${file.type === "video/webm" ? "webm" : "mp4"}`, file, file.type, onProgress);
      item = { id, name: file.name, kind: "video", url: up.url, path: up.path, size: file.size, contentType: file.type, createdAt: stamp };
    } else {
      let img;
      try {
        img = await processImage(file);
      } catch {
        throw new Error("This picture couldn't be opened here (iPhone HEIC photos often can't). Save it as JPG or PNG and try again.");
      }
      const large = await uploadSiteMedia(`${stamp}_${base}.${img.ext}`, img.large, img.contentType, (p) =>
        onProgress?.(Math.round(p * (img.small ? 0.8 : 1))),
      );
      const small = img.small
        ? await uploadSiteMedia(`${stamp}_${base}_sm.${img.ext}`, img.small, img.contentType, (p) => onProgress?.(80 + Math.round(p * 0.2)))
        : null;
      item = clean({
        id,
        name: file.name,
        kind: "image" as const,
        url: large.url,
        path: large.path,
        smUrl: small?.url,
        smPath: small?.path,
        width: img.width || undefined,
        height: img.height || undefined,
        size: img.large.size,
        contentType: img.contentType,
        createdAt: stamp,
      });
    }
    const { id: _ignored, ...data } = item;
    await setDoc(doc(db, "mediaLibrary", id), data);
    return item;
  },

  async remove(item: LibraryItem) {
    await Promise.all([deleteStoredFile(item.path), deleteStoredFile(item.smPath || "")]);
    await deleteDoc(doc(db, "mediaLibrary", item.id));
  },
};
