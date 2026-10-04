import { useEffect, useState } from "react";
import {
  defaultSiteConfig,
  getSiteConfig,
  SiteConfig,
} from "../services/siteConfig";

// One fetch per page load, shared by every component that needs settings
// (header, footer, home sections, Hire...).
let cached: SiteConfig | null = null;
let inflight: Promise<SiteConfig> | null = null;

const loadOnce = () => {
  if (!inflight) {
    inflight = getSiteConfig()
      .then((c) => (cached = c))
      .catch((e) => {
        inflight = null; // let a later mount retry
        throw e;
      });
  }
  return inflight;
};

export const useSiteConfig = () => {
  const [config, setConfig] = useState<SiteConfig>(cached || defaultSiteConfig);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState("");

  useEffect(() => {
    if (cached) return;
    let mounted = true;
    loadOnce()
      .then((next) => mounted && setConfig(next))
      .catch((e) => {
        console.error("load site config failed:", e);
        if (mounted) {
          setConfig(defaultSiteConfig);
          setError("Site settings are using defaults right now.");
        }
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return { config, loading, error };
};
