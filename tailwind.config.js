/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
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
        // Professional color palette based on Brunswick Green
        brunswick: {
          50: '#f0f4f1',
          100: '#dce6de',
          200: '#bad0be',
          300: '#92b297',
          400: '#6e9474',
          500: '#588157', // Fern Green
          600: '#4a6b49',
          700: '#3a5a40', // Hunter Green  
          800: '#344e41', // Brunswick Green
          900: '#2d4238',
        },
        sage: {
          50: '#f7f8f5',
          100: '#eef1e8',
          200: '#dfe4d4',
          300: '#c7d1b8',
          400: '#a3b18a', // Sage
          500: '#8fa070',
          600: '#798757',
          700: '#616b47',
          800: '#50573c',
          900: '#434a33',
        },
        timber: {
          50: '#f8f8f6',
          100: '#f0f0ec',
          200: '#e0e0d8',
          300: '#ccccc0',
          400: '#b4b4a4',
          500: '#a1a18c',
          600: '#94947a',
          700: '#7d7d66',
          800: '#686855',
          900: '#dad7cd', // Timberwolf
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'professional': '0 4px 24px -4px rgba(52, 78, 65, 0.08)',
        'professional-hover': '0 8px 32px -8px rgba(52, 78, 65, 0.12)',
        'professional-focus': '0 0 0 3px rgba(52, 78, 65, 0.12)',
      },
      backgroundImage: {
        'gradient-professional': 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
        'gradient-subtle': 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%)',
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
        "slide-in": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "professional-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(var(--primary) / 0.1)" },
          "50%": { boxShadow: "0 0 30px hsl(var(--primary) / 0.2)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "professional-pulse": "professional-pulse 4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}