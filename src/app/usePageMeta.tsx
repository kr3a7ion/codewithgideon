import React from "react";
import { useEffect } from "react";

const SITE = "Code with Gideon";
const DEFAULT_DESCRIPTION =
  "Learn Flutter app development, web development and AI-assisted coding with Code with Gideon. Live, cohort-based coding classes for beginners and developers in Nigeria.";

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
}: {
  title?: string;
  description?: string;
  noindex?: boolean;
}) => {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE}` : `${SITE} | Learn Coding Live`;
    const desc = description || DEFAULT_DESCRIPTION;
    document.title = fullTitle;
    setMeta('meta[name="description"]', "name", "description", desc);
    setMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    setMeta('meta[property="og:description"]', "property", "og:description", desc);
    setMeta('meta[name="robots"]', "name", "robots", noindex ? "noindex, nofollow" : "index, follow");

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `https://codewithgideon.com${window.location.pathname}`;
  }, [title, description, noindex]);
};

/** Route wrapper so pages that don't set their own meta still get one. */
export const PageMeta: React.FC<{
  title?: string;
  description?: string;
  noindex?: boolean;
  children: React.ReactNode;
}> = ({ children, ...meta }) => {
  usePageMeta(meta);
  return children as React.ReactElement;
};
