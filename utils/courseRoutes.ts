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
  const token =
    value?.courseId || value?.id || value?.slug || slugifyCourse(value?.title || "");
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
