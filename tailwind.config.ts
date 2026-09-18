import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        vibe: {
          bg: "var(--background)",
          card: "var(--card)",
          surface: "var(--muted)",
          blue: "var(--accent)",
          electric: "var(--chart-3)",
          cyan: "var(--accent)",
          gold: "var(--secondary)",
          purple: "var(--chart-5)",
          green: "var(--chart-4)",
          red: "var(--primary)",
        },
        slate: {
          50: "var(--muted)",
          100: "var(--foreground)",
          200: "var(--foreground)",
          300: "var(--foreground)",
          400: "var(--muted-foreground)",
          500: "var(--muted-foreground)",
          600: "var(--border)",
          700: "var(--border)",
          800: "var(--border)",
          900: "var(--card)",
          950: "var(--background)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "DM Sans", "sans-serif"],
        mono: ["var(--font-mono)", "Space Mono", "monospace"],
      },
      borderRadius: {
        none: "0px",
        sm: "var(--radius, 0px)",
        DEFAULT: "var(--radius, 0px)",
        md: "var(--radius, 0px)",
        lg: "var(--radius, 0px)",
        xl: "var(--radius, 0px)",
        "2xl": "var(--radius, 0px)",
        "3xl": "var(--radius, 0px)",
        full: "9999px",
      },
      boxShadow: {
        DEFAULT: "var(--shadow-offset-x, 4px) var(--shadow-offset-y, 4px) var(--shadow-blur, 0px) var(--shadow-color, #000)",
        sm: "2px 2px 0px var(--shadow-color, #000)",
        md: "var(--shadow-offset-x, 4px) var(--shadow-offset-y, 4px) 0px var(--shadow-color, #000)",
        lg: "6px 6px 0px var(--shadow-color, #000)",
        xl: "8px 8px 0px var(--shadow-color, #000)",
        "2xl": "10px 10px 0px var(--shadow-color, #000)",
        neo: "var(--shadow-offset-x, 4px) var(--shadow-offset-y, 4px) var(--shadow-blur, 0px) var(--shadow-color, #000)",
        "neo-sm": "2px 2px 0px var(--border)",
        "neo-lg": "6px 6px 0px var(--border)",
        glow: "0 0 20px -5px var(--primary)",
        "glow-cyan": "0 0 20px -5px var(--accent)",
        "glow-gold": "0 0 20px -5px var(--secondary)",
      },
    },
  },
  plugins: [],
};

export default config;
