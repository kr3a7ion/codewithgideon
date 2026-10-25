// Admin side of Portfolio and Packages: list everything (drafts included),
// save, delete, reorder and import the built-in starters.
import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { PACKAGE_STARTERS, PROJECT_STARTERS, type HirePackage, type Project } from "../src/marketing/catalog";

const strip = (v: any): any => {
  if (Array.isArray(v)) return v.map(strip);
  if (v && typeof v === "object") {
    const out: any = {};
    Object.entries(v).forEach(([k, x]) => {
      if (x !== undefined) out[k] = strip(x);
    });
    return out;
  }
  return v;
};

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "project";

const list = async <T,>(coll: string): Promise<T[]> => {
  const snap = await getDocs(collection(db, coll));
  return snap.docs
    .map((d: any) => ({ id: d.id, ...(d.data() as any) }) as T)
    .sort((a: any, b: any) => Number(a.order || 0) - Number(b.order || 0));
};

const save = async (coll: string, item: { id: string } & Record<string, any>) => {
  const { id, ...data } = item as any;
  await setDoc(doc(db, coll, id), strip({ ...data, updatedAt: Date.now() }));
};

/** Writes the starters that don't exist yet. Returns how many were added. */
const seed = async <T extends { id: string }>(coll: string, starters: T[]) => {
  const existing = new Set((await list<{ id: string }>(coll)).map((x) => x.id));
  const missing = starters.filter((s) => !existing.has(s.id));
  for (const s of missing) await save(coll, s);
  return missing.length;
};

export const catalog = {
  slugify,
  listProjects: () => list<Project>("portfolio"),
  listPackages: () => list<HirePackage>("hirePackages"),
  saveProject: (p: Project) => save("portfolio", { ...p, slug: slugify(p.slug || p.title) }),
  savePackage: (p: HirePackage) => save("hirePackages", p),
  removeProject: (id: string) => deleteDoc(doc(db, "portfolio", id)),
  removePackage: (id: string) => deleteDoc(doc(db, "hirePackages", id)),
  seedProjects: () => seed("portfolio", PROJECT_STARTERS),
  seedPackages: () => seed("hirePackages", PACKAGE_STARTERS),
  /** Saves new positions after moving an item up or down. */
  async reorder(coll: "portfolio" | "hirePackages", items: { id: string; order: number }[]) {
    for (const [i, it] of items.entries()) {
      if (it.order !== i + 1) await save(coll, { ...(it as any), order: i + 1 });
    }
  },
};
