export const legacyCourseSlugs: Record<string, string> = {
  "path-flutter": "flutter-mobile-app-development",
  "path-web": "web-development-wordpress",
  "path-ai": "ai-assisted-development",
};

export const slugifyCourse = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const coursePathFromValue = (value?: {
  id?: string;
  courseId?: string;
  title?: string;
  slug?: string;
}) => {
  // Readable URLs first (/courses/flutter-mobile-app-development); the course
  // page also resolves ids, so old links keep working.
  const token =
    value?.slug ||
    slugifyCourse(value?.title || "") ||
    value?.courseId ||
    value?.id ||
    "";
  return token ? `/courses/${encodeURIComponent(token)}` : "/courses";
};

export const courseTokenFromPathname = (pathname: string) => {
  const match = String(pathname || "").match(/^\/courses\/([^/?#]+)\/?$/);
  if (!match?.[1]) return "";
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};
