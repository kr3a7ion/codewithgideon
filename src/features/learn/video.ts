// Recording links → something the class page can play inline.
//
// Recordings are YouTube (unlisted) links. Google Drive previews and plain
// video files also play inline; anything else falls back to a link.

export type VideoSource =
  | { kind: "youtube"; id: string; start: number }
  | { kind: "drive"; id: string }
  | { kind: "file"; url: string }
  | { kind: "link"; url: string };

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

/** "1h2m3s", "90", "1:30" → seconds. */
const parseStart = (raw: string | null): number => {
  if (!raw) return 0;
  const v = raw.trim();
  if (/^\d+$/.test(v)) return Number(v);
  const hms = v.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (hms && (hms[1] || hms[2] || hms[3])) return Number(hms[1] || 0) * 3600 + Number(hms[2] || 0) * 60 + Number(hms[3] || 0);
  return 0;
};

export const parseVideo = (raw: string | undefined | null): VideoSource | null => {
  const text = String(raw || "").trim();
  if (!text) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "").toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);

  if (host === "youtu.be" && parts[0] && YT_ID.test(parts[0])) {
    return { kind: "youtube", id: parts[0], start: parseStart(url.searchParams.get("t")) };
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "music.youtube.com") {
    const v = url.searchParams.get("v");
    const start = parseStart(url.searchParams.get("t") || url.searchParams.get("start"));
    if (v && YT_ID.test(v)) return { kind: "youtube", id: v, start };
    if (["embed", "shorts", "live", "v"].includes(parts[0]) && parts[1] && YT_ID.test(parts[1])) return { kind: "youtube", id: parts[1], start };
  }
  if (host === "drive.google.com") {
    const id = parts[0] === "file" && parts[1] === "d" ? parts[2] : url.searchParams.get("id");
    if (id) return { kind: "drive", id };
  }
  if (/\.(mp4|webm|m4v|mov)$/i.test(url.pathname)) return { kind: "file", url: url.toString() };
  return { kind: "link", url: url.toString() };
};

export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export const thumbFor = (raw: string | undefined | null) => {
  const v = parseVideo(raw);
  return v?.kind === "youtube" ? youtubeThumb(v.id) : "";
};

/** 754 → "12:34", 3723 → "1:02:03". */
export const clock = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
};
