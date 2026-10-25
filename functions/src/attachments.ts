// Screenshots students attach to mentor chat. The browser uploads the image
// to Storage (mentor-uploads/<uid>/...) and sends the download link with the
// message; this checks the link really is one of their own uploads.

export type ChatAttachment = {
  url: string;
  path: string;
  name: string;
  contentType: string;
  size: number;
};

const MAX_ATTACHMENTS = 3;
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Keeps only valid image uploads from this student's own folder.
 * @param {string} uid The signed-in student.
 * @param {unknown} raw Attachments as sent by the browser.
 * @return {ChatAttachment[]} The ones that are safe to store.
 */
export const cleanAttachments = (uid: string, raw: unknown): ChatAttachment[] => {
  if (!Array.isArray(raw) || !uid) return [];
  const prefix = `mentor-uploads/${uid}/`;
  const out: ChatAttachment[] = [];
  for (const item of raw.slice(0, MAX_ATTACHMENTS)) {
    if (!item || typeof item !== "object") continue;
    const a = item as Record<string, unknown>;
    const path = String(a.path ?? "");
    const url = String(a.url ?? "");
    const contentType = String(a.contentType ?? "").toLowerCase();
    const size = Number(a.size ?? 0);
    if (!path.startsWith(prefix) || path.includes("..")) continue;
    if (!/^image\/(png|jpe?g|gif|webp)$/.test(contentType)) continue;
    if (!Number.isFinite(size) || size <= 0 || size > MAX_BYTES) continue;
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      continue;
    }
    // A Firebase Storage download link for exactly this object.
    if (parsed.protocol !== "https:" || parsed.hostname !== "firebasestorage.googleapis.com") continue;
    if (!decodeURIComponent(parsed.pathname).endsWith(`/o/${path}`)) continue;
    out.push({url, path, name: String(a.name ?? "screenshot").slice(0, 120), contentType, size: Math.round(size)});
  }
  return out;
};
