/**
 * Images and videos on the public site that Gideon can change from
 * Admin → Site media. Each slot has a built-in default, so a page never shows
 * a broken image: if nothing is uploaded (or the upload is removed), the
 * default is used.
 *
 * To make a new spot editable: add a slot here, then read it on the page with
 * useMediaSlot("<id>").
 */
import { IMAGES } from "../../assets/images";

export type MediaKind = "image" | "video";

export type MediaSlot = {
  id: string;
  page: "Home" | "Hire" | "About" | "Learn";
  label: string;
  /** Where it shows, in plain words. */
  where: string;
  kind: MediaKind;
  /** Width / height, used for the preview box and the upload hint. */
  aspect: number;
  /** Suggested upload size, e.g. "1600 × 1000". */
  hint: string;
  /** Built-in image (empty for optional slots such as a video). */
  defaultSrc: string;
  defaultSrcSet?: string;
  defaultAlt: string;
  optional?: boolean;
};

export const MEDIA_SLOTS: MediaSlot[] = [
  {
    id: "home.hero",
    page: "Home",
    label: "Home: main picture",
    where: "Top of the home page, next to the headline.",
    kind: "image",
    aspect: 16 / 10,
    hint: "1600 × 1000",
    defaultSrc: "/work/itura-cover.webp",
    defaultSrcSet: "/work/itura-cover-960.webp 960w, /work/itura-cover.webp 1600w",
    defaultAlt: "Ìtura Suites booking website on a laptop and a phone",
  },
  {
    id: "home.heroSecond",
    page: "Home",
    label: "Home: second picture",
    where: "Overlaps the main picture on large screens.",
    kind: "image",
    aspect: 16 / 10,
    hint: "1600 × 1000",
    defaultSrc: "/work/adire-cover-960.webp",
    defaultAlt: "Adire Hair Studio booking website on a laptop and a phone",
  },
  {
    id: "hire.hero",
    page: "Hire",
    label: "Hire: main picture",
    where: "Top of the Hire page.",
    kind: "image",
    aspect: 16 / 10,
    hint: "1600 × 1000",
    defaultSrc: "/work/adire-cover.webp",
    defaultSrcSet: "/work/adire-cover-960.webp 960w, /work/adire-cover.webp 1600w",
    defaultAlt: "Adire Hair Studio booking website on a laptop and a phone",
  },
  {
    id: "about.portrait",
    page: "About",
    label: "Your photo",
    where: "The “Hi, I’m Gideon” section on the home page.",
    kind: "image",
    aspect: 4 / 5,
    hint: "1200 × 1500 (portrait)",
    defaultSrc: IMAGES.instructor.portrait,
    defaultAlt: "Gideon Okanlawon",
  },
  {
    id: "about.video",
    page: "About",
    label: "Intro video (optional)",
    where: "Adds a “Watch my intro” button on your photo. A YouTube link or a short video file.",
    kind: "video",
    aspect: 16 / 9,
    hint: "YouTube link, or an MP4 under 50 MB",
    defaultSrc: "",
    defaultAlt: "Intro video",
    optional: true,
  },
];

export const findSlot = (id: string) => MEDIA_SLOTS.find((s) => s.id === id);

/** What's saved for a slot in Firestore (siteMedia/{slotId}). */
export type SlotValue = {
  url: string;
  /** Smaller copy for phones (images only). */
  smUrl?: string;
  alt?: string;
  kind: MediaKind;
  width?: number;
  height?: number;
  libraryId?: string;
  updatedAt?: number;
  updatedBy?: string;
};

/** An uploaded file in the media library (mediaLibrary/{id}). */
export type LibraryItem = {
  id: string;
  name: string;
  kind: MediaKind;
  url: string;
  path: string;
  smUrl?: string;
  smPath?: string;
  width?: number;
  height?: number;
  size: number;
  contentType: string;
  createdAt: number;
};
