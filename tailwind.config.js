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
      },
      animation: {
        "week-in": "week-in 420ms cubic-bezier(.2,.7,.3,1) both",
        "week-glow": "week-glow 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
