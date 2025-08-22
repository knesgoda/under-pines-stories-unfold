import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Quicksand', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Under Pines Brand Colors
        background: {
          dark: '#0B1C13',    // deep forest
          panel: '#1F3327',   // pine green
          sand: '#F5E6D3',    // light tan card
        },
        text: {
          light: '#F7F5F2',   // almost white
          muted: '#C9C5BD',   // soft gray
        },
        accent: {
          warm: '#F28C38',    // sunset orange
          glow: '#FFD580',    // firelight yellow
        },
        ink: '#354B3E',        // muted green-gray
        
        // Semantic Colors (keeping for shadcn compatibility)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)", 
        lg: "var(--radius-lg)",
        xl: "calc(var(--radius-lg) + 4px)",
      },
      boxShadow: {
        'soft': 'var(--shadow-soft)',
        'glow': 'var(--shadow-glow)',
      },
      backgroundImage: {
        'gradient-sunset': 'var(--gradient-sunset)',
        'gradient-panel': 'var(--gradient-panel)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "glow": {
          "0%, 100%": { boxShadow: "0 0 10px rgba(242, 140, 56, 0.2)" },
          "50%": { boxShadow: "0 0 20px rgba(242, 140, 56, 0.4)" },
        },
        "fade-in": {
          "from": { opacity: "0", transform: "translateY(10px)" },
          "to": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-pop": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
        "slide-in-left": {
          "from": { transform: "translateX(-100%)" },
          "to": { transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out", 
        "glow": "glow 2s infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "scale-pop": "scale-pop 0.2s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
      },
      screens: {
        'xs': '480px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config