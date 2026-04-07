/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    borderRadius: {
      DEFAULT: '0px',
      none: '0px',
      sm: '0px',
      md: '0px',
      lg: '0px',
      xl: '0px',
      '2xl': '0px',
      '3xl': '0px',
      full: '9999px',
    },
    extend: {
      colors: {
        surface: {
          DEFAULT: '#131318',
          dim: '#131318',
          'container-lowest': '#0e0e13',
          'container-low': '#1b1b20',
          'container': '#1f1f24',
          'container-high': '#2a292f',
          'container-highest': '#35343a',
        },
        primary: {
          DEFAULT: '#efffe3',
          container: '#39ff14',
          fixed: '#79ff5b',
          'fixed-dim': '#2ae500',
        },
        secondary: {
          DEFAULT: '#72de58',
          container: '#3aa625',
        },
        'on-surface': {
          DEFAULT: '#e4e1e9',
          variant: '#baccb0',
        },
        'on-primary': '#053900',
        outline: {
          DEFAULT: '#85967c',
          variant: '#3c4b35',
        },
        error: {
          DEFAULT: '#ffb4ab',
          container: '#93000a',
        },
        'tertiary-fixed-dim': '#e7bdb8',
        neon: '#39ff14',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 15px rgba(57, 255, 20, 0.4)',
        'neon-lg': '0 0 30px rgba(57, 255, 20, 0.3)',
        'neon-sm': '0 0 8px rgba(57, 255, 20, 0.3)',
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
        'flicker': 'flicker 0.15s infinite',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(57, 255, 20, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(57, 255, 20, 0.6)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.97' },
        },
      },
    },
  },
  plugins: [],
}
