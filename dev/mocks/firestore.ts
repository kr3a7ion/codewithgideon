// Minimal in-memory stand-in for firebase/firestore, for the UI preview only.
import { previewDb } from "./data";

export { Timestamp } from "./timestamp";

type Ref = { path: string };
export const getFirestore = () => ({});
export const collection = (_db: unknown, ...segments: string[]): Ref => ({ path: segments.join("/") });
export const collectionGroup = (_db: unknown, id: string): Ref => ({ path: `**/${id}` });
export const doc = (_db: unknown, ...segments: string[]): Ref => ({ path: segments.join("/") });
export const query = (ref: Ref) => ref;
export const orderBy = () => ({});
export const where = () => ({});
export const limit = () => ({});
export const serverTimestamp = () => new Date();
export const deleteField = () => undefined;
export const increment = (n: number) => n;

const snapFor = (path: string) => {
  const value = previewDb[path];
  if (Array.isArray(value)) {
    return { docs: value.map((d: any) => ({ id: d.id, data: () => d })), empty: !value.length };
  }
  return { exists: () => value != null, data: () => value ?? null, id: path.split("/").pop() };
};

export const onSnapshot = (ref: Ref, next: (s: any) => void) => {
  const t = setTimeout(() => next(snapFor(ref.path)), 150);
  return () => clearTimeout(t);
};
export const getDoc = async (ref: Ref) => snapFor(ref.path);
export const getDocs = async (ref: Ref) => snapFor(ref.path);
export const setDoc = async () => undefined;
export const updateDoc = async () => undefined;
export const addDoc = async () => ({ id: "new" });
export const deleteDoc = async () => undefined;
export const runTransaction = async (_db: unknown, fn: any) => fn({ get: getDoc, set() {}, update() {} });
