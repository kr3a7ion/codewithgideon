import React, { useId } from "react";
import { Bird, CalendarCheck, Dumbbell, Flame, Gem, Lock, Rocket, Sprout, Star, Target, Trophy, Waves, Zap, type LucideIcon } from "lucide-react";
import { cn } from "../../ui";
import type { JourneyBadge } from "./lib";

// ---------------------------------------------------------------------------
// Badge medals
//
// Each weekly badge is drawn as a medal: a shaped emblem in the badge's
// colour, a bold white icon, a rim, and ribbons on the milestone weeks.
// Shapes change through the course so later badges look rarer.
// ---------------------------------------------------------------------------

type Shape = "coin" | "hex" | "shield" | "seal" | "gem" | "burst" | "laurel";

/** Artwork for each badge, keyed by its tier (unique per badge). */
const art: Record<string, { icon: LucideIcon; shape: Shape; ribbon?: boolean }> = {
  Starter: { icon: Sprout, shape: "coin" },
  Ignited: { icon: Flame, shape: "coin" },
  Charged: { icon: Zap, shape: "hex" },
  Milestone: { icon: CalendarCheck, shape: "shield", ribbon: true },
  Crusher: { icon: Dumbbell, shape: "hex" },
  Midpoint: { icon: Waves, shape: "seal", ribbon: true },
  Focused: { icon: Target, shape: "coin" },
  Elevated: { icon: Bird, shape: "seal" },
  Diamond: { icon: Gem, shape: "gem" },
  Launch: { icon: Rocket, shape: "shield" },
  Legend: { icon: Star, shape: "burst" },
  Champion: { icon: Trophy, shape: "laurel", ribbon: true },
};

export const badgeArt = (badge: Pick<JourneyBadge, "tier">) => art[badge.tier] || art.Starter;

// ---- colour ----

const rgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (hex: string, to: [number, number, number], amount: number) => {
  const c = rgb(hex);
  const m = c.map((v, i) => Math.round(v + (to[i] - v) * amount));
  return `rgb(${m[0]} ${m[1]} ${m[2]})`;
};
export const badgeTones = (hex: string) => ({
  base: hex,
  light: mix(hex, [255, 255, 255], 0.45),
  dark: mix(hex, [8, 21, 46], 0.32),
  deep: mix(hex, [8, 21, 46], 0.58),
});
export const badgeGlow = (hex: string, alpha = 0.55) => {
  const [r, g, b] = rgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// ---- geometry (viewBox 0 0 120 132, medal centred at 60,56) ----

const CX = 60;
const CY = 56;
const R = 50;

type Pt = [number, number];

const roundedPolygon = (pts: Pt[], corner: number) => {
  const n = pts.length;
  let d = "";
  for (let i = 0; i < n; i += 1) {
    const prev = pts[(i - 1 + n) % n];
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    const toward = (p: Pt) => {
      const dx = p[0] - cur[0];
      const dy = p[1] - cur[1];
      const len = Math.hypot(dx, dy) || 1;
      const r = Math.min(corner, len / 2);
      return [cur[0] + (dx / len) * r, cur[1] + (dy / len) * r] as Pt;
    };
    const a = toward(prev);
    const b = toward(next);
    d += `${i === 0 ? "M" : "L"}${a[0].toFixed(2)} ${a[1].toFixed(2)} Q${cur[0].toFixed(2)} ${cur[1].toFixed(2)} ${b[0].toFixed(2)} ${b[1].toFixed(2)} `;
  }
  return `${d}Z`;
};

const scale = (unit: Pt[], r: number): Pt[] => unit.map(([x, y]) => [CX + x * r, CY + y * r]);

const ring = (count: number, r: number, start = -90): Pt[] =>
  Array.from({ length: count }, (_, i) => {
    const a = ((start + (360 / count) * i) * Math.PI) / 180;
    return [CX + Math.cos(a) * r, CY + Math.sin(a) * r];
  });

const circlePath = (r: number) => `M${CX - r} ${CY} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0 Z`;

const sealPath = (r: number, bumps = 14) => {
  const pts = ring(bumps, r * 0.9);
  const chord = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
  const arc = (chord * 0.62).toFixed(2);
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)} `;
  for (let i = 1; i <= bumps; i += 1) {
    const p = pts[i % bumps];
    d += `A${arc} ${arc} 0 0 1 ${p[0].toFixed(2)} ${p[1].toFixed(2)} `;
  }
  return `${d}Z`;
};

const burstPath = (r: number, points = 12) => {
  const pts: Pt[] = [];
  for (let i = 0; i < points * 2; i += 1) {
    const a = ((-90 + (180 / points) * i) * Math.PI) / 180;
    const rr = i % 2 === 0 ? r : r * 0.84;
    pts.push([CX + Math.cos(a) * rr, CY + Math.sin(a) * rr]);
  }
  return roundedPolygon(pts, 2.5);
};

const shieldUnit: Pt[] = [
  [-0.9, -0.84],
  [0, -1],
  [0.9, -0.84],
  [0.88, 0.14],
  [0, 1],
  [-0.88, 0.14],
];
const gemUnit: Pt[] = [
  [-0.58, -0.86],
  [0.58, -0.86],
  [1, -0.26],
  [0, 1],
  [-1, -0.26],
];

/** Outline of the medal and of its inner face. */
const shapePaths = (shape: Shape): { outer: string; inner: string; iconScale: number } => {
  switch (shape) {
    case "hex": {
      const hex = (r: number) => roundedPolygon(ring(6, r), r * 0.16);
      return { outer: hex(R), inner: hex(R * 0.76), iconScale: 0.86 };
    }
    case "shield":
      return { outer: roundedPolygon(scale(shieldUnit, R), 7), inner: roundedPolygon(scale(shieldUnit, R * 0.76), 5), iconScale: 0.84 };
    case "seal":
      return { outer: sealPath(R), inner: circlePath(R * 0.68), iconScale: 0.84 };
    case "gem":
      return { outer: roundedPolygon(scale(gemUnit, R), 6), inner: roundedPolygon(scale(gemUnit, R * 0.72), 4), iconScale: 0.74 };
    case "burst":
      return { outer: burstPath(R), inner: circlePath(R * 0.66), iconScale: 0.82 };
    case "laurel":
      return { outer: circlePath(R * 0.78), inner: circlePath(R * 0.6), iconScale: 0.72 };
    case "coin":
    default:
      return { outer: circlePath(R), inner: circlePath(R * 0.78), iconScale: 0.9 };
  }
};

/** Leaves around the Champion medal. */
const laurelLeaves = () => {
  const leaves: { x: number; y: number; rot: number }[] = [];
  const rr = R * 0.92;
  for (let side = 0; side < 2; side += 1) {
    for (let k = 0; k < 7; k += 1) {
      // Left branch climbs from the bottom (115°) to the top (245°); the
      // right branch mirrors it.
      const deg = side === 0 ? 118 + k * 20 : 62 - k * 20;
      const a = (deg * Math.PI) / 180;
      // Each leaf lies along the branch, tipped outwards.
      leaves.push({ x: CX + Math.cos(a) * rr, y: CY + Math.sin(a) * rr, rot: deg + (side === 0 ? -30 : 30) });
    }
  }
  return leaves;
};

// ---------------------------------------------------------------------------

export type MedalState = "earned" | "latest" | "next" | "locked";

/**
 * One badge medal. "latest" glows and shines now and then, "earned" shines
 * when hovered (inside a `group`), "next" is grey with a slowly turning
 * dashed ring in the badge colour, and "locked" is grey with a lock.
 */
export const BadgeMedal: React.FC<{
  badge: Pick<JourneyBadge, "tier" | "color">;
  state?: MedalState;
  /** Width in px. */
  size?: number;
  className?: string;
  /** Shine once when it appears (e.g. in the badge dialog). */
  shineOnMount?: boolean;
}> = ({ badge, state = "earned", size = 96, className, shineOnMount }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { icon: Icon, shape, ribbon } = badgeArt(badge);
  const t = badgeTones(badge.color);
  const lit = state === "earned" || state === "latest";
  const { outer, inner, iconScale } = shapePaths(shape);
  const iconSize = R * iconScale;
  const id = (k: string) => `${k}-${uid}`;

  // Locked medals use the theme's greys through CSS, so they follow dark mode.
  const greyRimTop = "[stop-color:#DBE3EE] dark:[stop-color:#3A4A63]";
  const greyRimBottom = "[stop-color:#A9B6C8] dark:[stop-color:#1E293B]";
  const greyFaceTop = "[stop-color:#F4F7FB] dark:[stop-color:#26344A]";
  const greyFaceBottom = "[stop-color:#DBE3EE] dark:[stop-color:#152033]";

  return (
    <svg
      viewBox="0 0 120 132"
      width={size}
      height={(size * 132) / 120}
      aria-hidden
      className={cn("shrink-0 overflow-visible", state === "latest" && "animate-badge-glow motion-reduce:animate-none", className)}
      style={state === "latest" ? ({ "--badge-glow": badgeGlow(badge.color) } as React.CSSProperties) : undefined}
    >
      <defs>
        <linearGradient id={id("rim")} x1="0" y1="0" x2="0" y2="1">
          {lit ? (
            <>
              <stop offset="0" stopColor={t.light} />
              <stop offset="0.55" stopColor={t.base} />
              <stop offset="1" stopColor={t.deep} />
            </>
          ) : (
            <>
              <stop offset="0" className={greyRimTop} />
              <stop offset="1" className={greyRimBottom} />
            </>
          )}
        </linearGradient>
        <radialGradient id={id("face")} cx="0.38" cy="0.3" r="0.85">
          {lit ? (
            <>
              <stop offset="0" stopColor={t.base} />
              <stop offset="1" stopColor={t.dark} />
            </>
          ) : (
            <>
              <stop offset="0" className={greyFaceTop} />
              <stop offset="1" className={greyFaceBottom} />
            </>
          )}
        </radialGradient>
        <linearGradient id={id("shine")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id("ribbon")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit ? t.dark : "#94A3B8"} />
          <stop offset="1" stopColor={lit ? t.deep : "#64748B"} />
        </linearGradient>
        <clipPath id={id("clip")}>
          <path d={outer} />
        </clipPath>
        <clipPath id={id("clipInner")}>
          <path d={inner} />
        </clipPath>
        <filter id={id("lift")} x="-25%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.4" floodColor={lit ? t.deep : "#0F2B5B"} floodOpacity={lit ? 0.4 : 0.14} />
        </filter>
      </defs>

      {/* Ribbons on milestone weeks */}
      {ribbon ? (
        <g opacity={lit ? 1 : 0.55}>
          <path d={`M${CX - 21} ${CY + R * 0.6} L${CX - 3} ${CY + R * 0.78} L${CX - 11} ${CY + R + 25} L${CX - 19} ${CY + R + 17} L${CX - 29} ${CY + R + 23} Z`} fill={`url(#${id("ribbon")})`} />
          <path d={`M${CX + 21} ${CY + R * 0.6} L${CX + 3} ${CY + R * 0.78} L${CX + 11} ${CY + R + 25} L${CX + 19} ${CY + R + 17} L${CX + 29} ${CY + R + 23} Z`} fill={`url(#${id("ribbon")})`} />
        </g>
      ) : null}

      {/* Laurel for the last badge */}
      {shape === "laurel" ? (
        <g>
          {laurelLeaves().map((l, i) => (
            <ellipse key={i} cx={l.x} cy={l.y} rx="4.2" ry="8.6" transform={`rotate(${l.rot} ${l.x} ${l.y})`} fill={`url(#${id("rim")})`} />
          ))}
        </g>
      ) : null}

      {/* "Next": a dashed ring in the badge colour, turning slowly */}
      {state === "next" ? (
        <circle
          cx={CX}
          cy={CY}
          r={R + 5}
          fill="none"
          stroke={badge.color}
          strokeWidth="2.5"
          strokeDasharray="5 7"
          strokeLinecap="round"
          className="animate-[spin_14s_linear_infinite] motion-reduce:animate-none"
          style={{ transformOrigin: `${CX}px ${CY}px`, transformBox: "view-box" }}
        />
      ) : null}

      {/* Rim and face */}
      <g filter={`url(#${id("lift")})`}>
        <path d={outer} fill={`url(#${id("rim")})`} />
      </g>
      <path d={outer} fill="none" stroke={lit ? t.deep : "#0F2B5B"} strokeOpacity={lit ? 0.35 : 0.08} strokeWidth="1" />
      {shape === "coin" || shape === "laurel" || shape === "seal"
        ? ring(16, R * (shape === "laurel" ? 0.69 : shape === "seal" ? 0.79 : 0.89)).map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.25" fill="#fff" opacity={lit ? 0.5 : undefined} className={lit ? undefined : "[opacity:0.6] dark:[opacity:0.16]"} />
          ))
        : null}
      <path d={inner} fill={`url(#${id("face")})`} />
      <path
        d={inner}
        fill="none"
        stroke="#fff"
        strokeOpacity={lit ? 0.4 : undefined}
        strokeWidth="1.5"
        className={lit ? undefined : "[stroke-opacity:0.7] dark:[stroke-opacity:0.12]"}
      />
      {/* Gloss across the top of the face */}
      <g clipPath={`url(#${id("clipInner")})`}>
        <ellipse
          cx={CX - 10}
          cy={CY - 26}
          rx={R * 0.62}
          ry={R * 0.3}
          transform={`rotate(-16 ${CX - 10} ${CY - 26})`}
          fill="#fff"
          opacity={lit ? 0.16 : undefined}
          className={lit ? undefined : "[opacity:0.35] dark:[opacity:0.05]"}
        />
      </g>

      {/* Icon: a dark outline under a white stroke reads on every colour */}
      {lit ? (
        <>
          <Icon x={CX - iconSize / 2} y={CY - iconSize / 2} width={iconSize} height={iconSize} color={t.deep} strokeWidth={4.2} opacity={0.55} />
          <Icon x={CX - iconSize / 2} y={CY - iconSize / 2} width={iconSize} height={iconSize} color="#fff" strokeWidth={2.3} />
        </>
      ) : (
        <Icon
          x={CX - iconSize / 2}
          y={CY - iconSize / 2}
          width={iconSize}
          height={iconSize}
          strokeWidth={2.1}
          // "Next" shows its icon in the badge colour (brighter in dark mode).
          className={state === "next" ? "text-[var(--medal-ink)] dark:text-[var(--medal-ink-dark)]" : "text-[#94A3B8] dark:text-[#5B6B85]"}
          style={state === "next" ? ({ "--medal-ink": t.dark, "--medal-ink-dark": t.base } as React.CSSProperties) : undefined}
          color="currentColor"
          opacity={state === "next" ? 0.8 : 1}
        />
      )}

      {/* A band of light across the medal */}
      {lit ? (
        <g clipPath={`url(#${id("clip")})`}>
          <g
            className={cn(
              "motion-reduce:hidden",
              state === "latest" ? "animate-badge-shine-loop" : shineOnMount ? "animate-badge-shine" : "translate-x-0 group-hover:animate-badge-shine",
            )}
          >
            <rect x="-34" y="-20" width="28" height="180" fill={`url(#${id("shine")})`} transform={`rotate(18 ${CX} ${CY})`} />
          </g>
        </g>
      ) : null}

      {/* Lock */}
      {state === "locked" ? (
        <g>
          <circle cx={CX + R * 0.7} cy={CY + R * 0.7} r="12.5" className="fill-white stroke-[#C2CDDC] dark:fill-slate-800 dark:stroke-slate-600" strokeWidth="1.5" />
          <Lock x={CX + R * 0.7 - 7} y={CY + R * 0.7 - 7} width={14} height={14} strokeWidth={2.4} className="text-slate-500 dark:text-slate-300" />
        </g>
      ) : null}
    </svg>
  );
};

/** Little sparkles around a medal, for the latest badge. */
export const MedalSparkles: React.FC<{ color: string; className?: string }> = ({ color, className }) => (
  <span aria-hidden className={cn("pointer-events-none absolute inset-0 motion-reduce:hidden", className)}>
    {[
      { left: "4%", top: "18%", size: 14, delay: "0s" },
      { left: "86%", top: "8%", size: 18, delay: "0.9s" },
      { left: "92%", top: "62%", size: 11, delay: "1.6s" },
      { left: "0%", top: "70%", size: 10, delay: "2.1s" },
      { left: "70%", top: "88%", size: 12, delay: "0.4s" },
    ].map((s, i) => (
      <svg
        key={i}
        viewBox="0 0 24 24"
        width={s.size}
        height={s.size}
        className="absolute animate-twinkle"
        style={{ left: s.left, top: s.top, animationDelay: s.delay, color: i % 2 ? "#fff" : color }}
      >
        <path d="M12 0c.6 5.6 2.4 8.4 12 12-9.6 3.6-11.4 6.4-12 12-.6-5.6-2.4-8.4-12-12 9.6-3.6 11.4-6.4 12-12Z" fill="currentColor" />
      </svg>
    ))}
  </span>
);
