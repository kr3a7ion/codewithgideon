/**
 * Reads the images Gideon set in Admin → Site media, with the built-in image
 * as the fallback. All slots load in one small read and are shared by every
 * component on the page.
 */
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { findSlot, type SlotValue } from "./mediaSlots";

type Store = Record<string, SlotValue>;

let cache: Store | null = null;
let loading: Promise<Store> | null = null;
const listeners = new Set<(s: Store) => void>();

const load = () => {
  if (cache) return Promise.resolve(cache);
  if (!loading) {
    loading = getDocs(collection(db, "siteMedia"))
      .then((snap: any) => {
        const out: Store = {};
        snap.docs.forEach((d: any) => {
          const v = d.data() as SlotValue;
          if (v && /^(https?:|blob:|\/)/.test(String(v.url || ""))) out[d.id] = v;
        });
        return out;
      })
      .catch(() => ({}) as Store)
      .then((out) => {
        cache = out;
        listeners.forEach((fn) => fn(out));
        return out;
      });
  }
  return loading;
};

/** Called by the admin after saving, so open pages pick up the change. */
export const refreshSiteMedia = async () => {
  cache = null;
  loading = null;
  return load();
};

export type ResolvedMedia = {
  src: string;
  srcSet?: string;
  alt: string;
  kind: "image" | "video";
  /** True when Gideon has uploaded something for this slot. */
  custom: boolean;
  /** False until the saved settings have loaded (avoids flashing the default). */
  ready: boolean;
};

export const resolveSlot = (id: string, saved: Store | null): ResolvedMedia => {
  const slot = findSlot(id);
  const v = saved?.[id];
  if (v?.url) {
    return {
      src: v.url,
      srcSet: v.smUrl && v.width ? `${v.smUrl} 800w, ${v.url} ${v.width}w` : undefined,
      alt: v.alt || slot?.defaultAlt || "",
      kind: v.kind || slot?.kind || "image",
      custom: true,
      ready: true,
    };
  }
  return {
    src: slot?.defaultSrc || "",
    srcSet: slot?.defaultSrcSet,
    alt: slot?.defaultAlt || "",
    kind: slot?.kind || "image",
    custom: false,
    ready: saved != null,
  };
};

export const useMediaSlot = (id: string): ResolvedMedia => {
  const [store, setStore] = useState<Store | null>(cache);
  useEffect(() => {
    listeners.add(setStore);
    load().then(setStore);
    return () => {
      listeners.delete(setStore);
    };
  }, []);
  return resolveSlot(id, store);
};
