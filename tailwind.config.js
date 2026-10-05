/**
 * CodeWithGideon design tokens (shared with the Flutter app).
 *
 * Brand colours come from the mobile AppTheme so web and app look like one
 * product:
 *   deepBlue #0F2B5B  -> blue-900  (primary: buttons, headings)
 *   teal     #1698A0  -> teal-500  (accent; teal-600 for text on white)
 *   orange   #FF7A45  -> orange-500 (highlight; orange-600 for filled CTAs)
 * The existing components already use blue/teal/orange/slate utility
 * classes, so remapping the palettes restyles the whole site in one place.
 * Every scale was contrast-checked against white and the dark surface.
 *
 * Fonts: Sora for headings (font-display), Manrope for body (font-sans).
 *
 * @type {import('tailwindcss').Config}
 */
const slate = {
  50: "#F4F7FB",
  100: "#EAF0F6",
  200: "#DBE3EE",
  300: "#C2CDDC",
  400: "#95A3BC",
  500: "#61708A",
  600: "#4A5870",
  700: "#334158",
  800: "#1B2940",
  900: "#111B2D",
  950: "#09111F",
};

export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./index.tsx",
    "./src/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
    "./utils/**/*.{ts,tsx}",
    "./assets/**/*.{ts,tsx}",
    "./dev/**/*.{ts,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          50: "#EEF3FA",
          100: "#DCE6F4",
          200: "#B9CCE8",
          300: "#8AA8D6",
          400: "#5A82BF",
          500: "#3764A6",
          600: "#2A5494",
          700: "#224A88",
          800: "#1A3A70",
          900: "#0F2B5B",
          950: "#08152E",
        },
        teal: {
          50: "#EDFAFA",
          100: "#D2F2F1",
          200: "#A6E5E3",
          300: "#73D5D2",
          400: "#3FBCBE",
          500: "#1698A0",
          600: "#12808A",
          700: "#136B72",
          800: "#10555B",
          900: "#0D4449",
          950: "#062A2E",
        },
        orange: {
          50: "#FFF6F1",
          100: "#FFEDE4",
          200: "#FFDCCB",
          300: "#FFC4A8",
          400: "#FFA37A",
          500: "#FF7A45",
          600: "#D9561F",
          700: "#B8471A",
          800: "#933A17",
          900: "#763115",
          950: "#40170A",
        },
        // Neutrals tuned to the app's navy-tinted greys. `gray` is an alias
        // so older gray-* classes match.
        slate,
        gray: slate,
        brand: {
          navy: "#0F2B5B",
          teal: "#1698A0",
          orange: "#FF7A45",
        },
        // Rebrand neutrals for the public site (Figma: "CodeWithGideon —
        // Rebrand"). Paper is the warm section background; line is the
        // matching border. Teal = Learn, orange = Hire, navy = the brand.
        //
        // Paper and line read CSS variables so an area can retune them: the
        // student app (.student-app in index.css) uses cool greys instead of
        // the warm marketing tones. Defaults are the marketing values.
        paper: {
          DEFAULT: "rgb(var(--cwg-paper, 247 244 238) / <alpha-value>)",
          dark: "#0D1728",
        },
        line: {
          DEFAULT: "rgb(var(--cwg-line, 228 223 213) / <alpha-value>)",
          strong: "rgb(var(--cwg-line-strong, 201 194 180) / <alpha-value>)",
          dark: "#1B2940",
        },
        // Student app canvas: a cool, light blue-grey so white cards stand out.
        mist: "#EAF0F6",
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Sora", "Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 43, 91, 0.04), 0 8px 24px rgba(15, 43, 91, 0.06)",
        lift: "0 20px 50px rgba(8, 21, 46, 0.14)",
      },
      keyframes: {
        // Week blocks on the student home hero fill in one after another.
        "week-in": {
          "0%": { opacity: "0", transform: "scaleY(0.4)" },
          "100%": { opacity: "1", transform: "scaleY(1)" },
        },
        "week-glow": {
          "0%, 100%": { boxShadow: "0 0 0 3px rgba(63, 188, 190, 0.35)" },
          "50%": { boxShadow: "0 0 0 6px rgba(63, 188, 190, 0.12)" },
        },
        // A band of light sweeping across loading placeholders.
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        // The thin bar at the top of the page while a section loads.
        "load-bar": {
          "0%": { transform: "translateX(-100%) scaleX(0.4)" },
          "50%": { transform: "translateX(30%) scaleX(0.6)" },
          "100%": { transform: "translateX(100%) scaleX(0.4)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        // Badges: a band of light across a medal, the latest badge's glow,
        // sparkles, and the pop when a badge opens.
        "badge-shine": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(175px)" },
        },
        "badge-shine-loop": {
          "0%, 62%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(175px)" },
        },
        "badge-glow": {
          "0%, 100%": { filter: "drop-shadow(0 4px 10px var(--badge-glow, rgba(22,152,160,.35)))" },
          "50%": { filter: "drop-shadow(0 6px 22px var(--badge-glow, rgba(22,152,160,.6)))" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0", transform: "scale(0.4) rotate(0deg)" },
          "50%": { opacity: "1", transform: "scale(1) rotate(45deg)" },
        },
        "badge-pop": {
          "0%": { opacity: "0", transform: "scale(0.6) rotate(-8deg)" },
          "60%": { opacity: "1", transform: "scale(1.06) rotate(2deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(0deg)" },
        },
        bob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
      },
      animation: {
        "week-in": "week-in 420ms cubic-bezier(.2,.7,.3,1) both",
        "week-glow": "week-glow 2.4s ease-in-out infinite",
        shimmer: "shimmer 1.6s ease-in-out infinite",
        "load-bar": "load-bar 1.2s ease-in-out infinite",
        "fade-in": "fade-in 200ms ease-out both",
        "badge-shine": "badge-shine 1.1s cubic-bezier(.4,0,.2,1) both",
        "badge-shine-loop": "badge-shine-loop 5s cubic-bezier(.4,0,.2,1) infinite",
        "badge-glow": "badge-glow 3s ease-in-out infinite",
        twinkle: "twinkle 2.6s ease-in-out infinite",
        "badge-pop": "badge-pop 520ms cubic-bezier(.2,.8,.3,1.2) both",
        bob: "bob 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
