import { useEffect, useState } from "react";
import {
  defaultSiteConfig,
  getSiteConfig,
  SiteConfig,
} from "../services/siteConfig";

export const useSiteConfig = () => {
  const [config, setConfig] = useState<SiteConfig>(defaultSiteConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const nextConfig = await getSiteConfig();
        if (mounted) setConfig(nextConfig);
      } catch (e) {
        console.error("load site config failed:", e);
        if (mounted) {
          setConfig(defaultSiteConfig);
          setError("Site settings are using defaults right now.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { config, loading, error };
};
