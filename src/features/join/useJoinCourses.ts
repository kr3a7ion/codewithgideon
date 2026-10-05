import { useEffect, useMemo, useState } from "react";
import {
  registrationStore,
  type ActiveCohortForPath,
  type CourseDoc,
  type PathDoc,
} from "../../../services/registrationStore";
import { parseCourseRef } from "./joinCourse";

/** A course the student can join, with its price and length. */
export type JoinCourse = {
  id: string;
  courseId: string;
  pathId: string;
  /** Saved on the profile as `path` (the path title, or the course title). */
  pathTitle: string;
  title: string;
  weeks: number;
  rate: number;
  level: string;
  /** "3 live classes a week", or the admin's text if it can't be read. */
  cadence: string;
  imageUrl: string;
};

const parseWeeks = (duration: string, fallback = 0) => {
  const n = parseInt(String(duration || "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const parseRate = (label: string) => {
  const s = String(label || "").toLowerCase();
  const n = parseInt(s.replace(/[^\d]/g, ""), 10);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return s.includes("k") ? n * 1000 : n;
};

/** "3× Weekly" -> "3 live classes a week". */
export const cadenceText = (sessions: string) => {
  const raw = String(sessions || "").trim();
  const n = parseInt(raw, 10);
  if (Number.isFinite(n) && n > 0 && /week/i.test(raw)) {
    return `${n} live ${n === 1 ? "class" : "classes"} a week`;
  }
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() : "";
};

const toJoinCourse = (c: CourseDoc, paths: Map<string, PathDoc>): JoinCourse => {
  const anyC = c as any;
  const pathId = String(anyC.pathId || "").trim();
  return {
    id: c.id,
    courseId: c.id,
    pathId,
    pathTitle: String(paths.get(pathId)?.title || c.title || "").trim() || c.title,
    title: String(c.title || "Course").trim(),
    weeks: Number(anyC.weeks) > 0 ? Math.floor(Number(anyC.weeks)) : parseWeeks(c.duration, 0),
    rate: Number(anyC.pricePerWeek) > 0 ? Math.floor(Number(anyC.pricePerWeek)) : parseRate(c.priceLabel || ""),
    level: String(c.level || "").trim(),
    cadence: cadenceText(c.sessions),
    imageUrl: String(c.imageUrl || "").trim(),
  };
};

/**
 * Loads the courses a student can join (active, with a path, a length and a
 * weekly price), picks the one they chose, and loads its current cohort.
 */
export const useJoinCourses = (preferred: string) => {
  const [options, setOptions] = useState<JoinCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [cohort, setCohort] = useState<ActiveCohortForPath | null>(null);
  const [cohortLoading, setCohortLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [courseList, pathList] = await Promise.all([
          registrationStore.getCourses(),
          registrationStore.getPaths(true).catch(() => [] as PathDoc[]),
        ]);
        const paths = new Map<string, PathDoc>();
        (pathList || []).filter((p: any) => p?.isActive !== false).forEach((p) => paths.set(p.id, p));
        const seen = new Set<string>();
        const list = (courseList || [])
          .filter((c: any) => c.isActive !== false && String(c.pathId || "").trim())
          .map((c) => toJoinCourse(c, paths))
          .filter((c) => c.weeks > 0 && c.rate > 0)
          .filter((c) => {
            const k = `${c.pathId}::${c.title.toLowerCase()}`;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          });
        if (!mounted) return;
        setOptions(list);
        if (!list.length) setError("Courses aren't open for sign-up right now. Please try again shortly or message Gideon on WhatsApp.");
      } catch (e) {
        console.error("load join courses failed:", e);
        if (mounted) {
          setOptions([]);
          setError("We couldn't load the courses. Check your connection and try again.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Pick the preferred course once the list is in.
  useEffect(() => {
    if (!options.length) return;
    if (selectedId && options.some((o) => o.id === selectedId)) return;
    const ref = parseCourseRef(preferred);
    const want = ref.value.toLowerCase();
    const hit =
      (ref.kind === "courseId" && options.find((o) => o.courseId === ref.value)) ||
      (ref.kind === "pathId" && options.find((o) => o.pathId === ref.value)) ||
      (ref.kind === "title" && want && options.find((o) => o.title.toLowerCase() === want || o.pathTitle.toLowerCase() === want)) ||
      options[0];
    setSelectedId(hit.id);
  }, [options, preferred, selectedId]);

  const selected = useMemo(() => options.find((o) => o.id === selectedId) || null, [options, selectedId]);

  useEffect(() => {
    let mounted = true;
    if (!selected?.pathId) {
      setCohort(null);
      return;
    }
    setCohortLoading(true);
    registrationStore
      .getActiveCohortForPathId(selected.pathId)
      .then((c) => mounted && setCohort(c))
      .catch(() => mounted && setCohort(null))
      .finally(() => mounted && setCohortLoading(false));
    return () => {
      mounted = false;
    };
  }, [selected?.pathId]);

  return { options, loading, error, selected, selectId: setSelectedId, cohort, cohortLoading };
};
