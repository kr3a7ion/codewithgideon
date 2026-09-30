import React from "react";
import { useEffect } from "react";

const SITE = "Code with Gideon";
const ORIGIN = "https://codewithgideon.com";
const DEFAULT_TITLE = `${SITE} | Learn to code, or get a website built`;
const DEFAULT_DESCRIPTION =
  "Live coding cohorts in web, Flutter and AI-assisted development, and websites that take bookings for businesses. By Gideon, in Abuja, Nigeria.";
const DEFAULT_IMAGE = "/og-default.jpg";

const absolute = (url: string) => (/^https?:\/\//i.test(url) ? url : `${ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`);

const setMeta = (selector: string, attr: string, key: string, value: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
};

/**
 * Sets the page title, description, social preview tags and (for private
 * pages) noindex, and keeps the canonical URL in sync with the route.
 */
export const usePageMeta = ({
  title,
  description,
  noindex = false,
  image,
}: {
  title?: string;
  description?: string;
  noindex?: boolean;
  /** Social preview image: a path on this site or a full URL. */
  image?: string;
}) => {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE}` : DEFAULT_TITLE;
    const desc = description || DEFAULT_DESCRIPTION;
    const img = absolute(image || DEFAULT_IMAGE);
    document.title = fullTitle;
    setMeta('meta[name="description"]', "name", "description", desc);
    setMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    setMeta('meta[property="og:description"]', "property", "og:description", desc);
    setMeta('meta[property="og:image"]', "property", "og:image", img);
    setMeta('meta[property="og:url"]', "property", "og:url", `${ORIGIN}${window.location.pathname}`);
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", img);
    setMeta('meta[name="robots"]', "name", "robots", noindex ? "noindex, nofollow" : "index, follow");

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${ORIGIN}${window.location.pathname}`;
  }, [title, description, noindex, image]);
};

/** Route wrapper so pages that don't set their own meta still get one. */
export const PageMeta: React.FC<{
  title?: string;
  description?: string;
  noindex?: boolean;
  image?: string;
  children: React.ReactNode;
}> = ({ children, ...meta }) => {
  usePageMeta(meta);
  return children as React.ReactElement;
};
