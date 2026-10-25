import React, { useEffect, useState } from "react";
import { cn } from "../ui";
import { findSlot } from "./mediaSlots";
import { useMediaSlot } from "./useSiteMedia";

/**
 * An image from Admin → Site media. Holds a soft placeholder for a moment
 * while the saved choice loads (so the old picture doesn't flash first), and
 * falls back to the built-in image if that takes too long or fails to load.
 */
export const SlotImage: React.FC<
  Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "alt"> & { slot: string; alt?: string }
> = ({ slot, alt, className, onError, ...rest }) => {
  const media = useMediaSlot(slot);
  const [waited, setWaited] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setWaited(true), 1200);
    return () => window.clearTimeout(t);
  }, []);
  useEffect(() => setFailed(false), [media.src]);

  if (!media.ready && !waited) {
    return <span aria-hidden className={cn("block animate-pulse bg-paper dark:bg-slate-800", className)} />;
  }

  const def = findSlot(slot);
  const src = failed && media.custom ? def?.defaultSrc || "" : media.src;
  const srcSet = failed && media.custom ? def?.defaultSrcSet : media.srcSet;
  if (!src) return null;

  return (
    <img
      {...rest}
      src={src}
      srcSet={srcSet}
      alt={alt ?? media.alt}
      className={className}
      onError={(e) => {
        if (media.custom && !failed) setFailed(true);
        onError?.(e);
      }}
    />
  );
};
