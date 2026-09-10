/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0B0D10',
          secondary: '#12151A',
          tertiary: '#1A1E25',
          hover: '#222730',
        },
        accent: {
          amber: '#FF6B00',
          'amber-light': '#FF8C3A',
          'amber-dim': 'rgba(255, 107, 0, 0.15)',
          cyan: '#00D9C0',
          'cyan-light': '#33E5D0',
          'cyan-dim': 'rgba(0, 217, 192, 0.15)',
          red: '#FF3B3B',
          'red-dim': 'rgba(255, 59, 59, 0.15)',
          blue: '#4A9EFF',
          'blue-dim': 'rgba(74, 158, 255, 0.15)',
        },
        text: {
          primary: '#E8E9EC',
          secondary: '#8B8F97',
          muted: '#555962',
          inverse: '#0B0D10',
        },
        border: {
          DEFAULT: '#2A2E37',
          light: '#363B44',
          focus: '#FF6B00',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Space Mono"', 'monospace'],
        sans: ['"Inter"', '"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'scan-line': 'scanLine 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'check-in': 'checkIn 0.3s ease-out',
      },
      keyframes: {
        scanLine: {
          '0%': { top: '0%', opacity: '1' },
          '50%': { top: '100%', opacity: '0.5' },
          '100%': { top: '0%', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(255, 107, 0, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(255, 107, 0, 0.6)' },
        },
        checkIn: {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(42, 46, 55, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(42, 46, 55, 0.3) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '20px 20px',
      },
    },
  },
  plugins: [],
}
