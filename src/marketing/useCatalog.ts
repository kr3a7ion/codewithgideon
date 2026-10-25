/**
 * Public read of Hire packages and portfolio projects (published only),
 * shared across components. Falls back to the built-in starters if nothing
 * has been imported yet or Firestore can't be reached.
 */
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../services/firebase";
import { PACKAGE_STARTERS, PROJECT_STARTERS, type HirePackage, type Project } from "./catalog";

type Entry<T> = { data: T[] | null; loading: Promise<T[]> | null; listeners: Set<(d: T[]) => void> };

const make = <T extends { published: boolean; order: number }>(coll: string, starters: T[]): Entry<T> & { load: () => Promise<T[]>; reset: () => void } => {
  const e: Entry<T> = { data: null, loading: null, listeners: new Set() };
  const fallback = () => starters.filter((s) => s.published).sort((a, b) => a.order - b.order);
  const load = () => {
    if (e.data) return Promise.resolve(e.data);
    if (!e.loading) {
      e.loading = getDocs(query(collection(db, coll), where("published", "==", true)))
        .then((snap: any) => {
          const rows = snap.docs
            .map((d: any) => ({ id: d.id, ...(d.data() as any) }) as T)
            .filter((r: T) => r.published)
            .sort((a: T, b: T) => Number(a.order || 0) - Number(b.order || 0));
          return rows.length ? rows : fallback();
        })
        .catch(() => fallback())
        .then((rows) => {
          e.data = rows;
          e.listeners.forEach((fn) => fn(rows));
          return rows;
        });
    }
    return e.loading;
  };
  const reset = () => {
    e.data = null;
    e.loading = null;
  };
  return Object.assign(e, { load, reset });
};

const packages = make<HirePackage>("hirePackages", PACKAGE_STARTERS);
const projects = make<Project>("portfolio", PROJECT_STARTERS);

const useEntry = <T,>(entry: Entry<T> & { load: () => Promise<T[]> }, initial: T[]) => {
  const [data, setData] = useState<T[] | null>(entry.data);
  useEffect(() => {
    entry.listeners.add(setData);
    entry.load().then(setData);
    return () => {
      entry.listeners.delete(setData);
    };
  }, [entry]);
  return { items: data || initial, ready: data != null };
};

/** Published Hire packages, in order. Starters show until Firestore answers. */
export const usePackages = () => useEntry(packages, PACKAGE_STARTERS.filter((p) => p.published));

/** Published portfolio projects, in order. */
export const usePortfolio = () => useEntry(projects, PROJECT_STARTERS.filter((p) => p.published));

/** Called by the admin after a change so open pages reload. */
export const refreshCatalog = async () => {
  packages.reset();
  projects.reset();
  await Promise.all([packages.load(), projects.load()]);
};
