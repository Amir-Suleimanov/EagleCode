import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#121413',
        surface: '#121413',
        panel: '#1a1c1b',
        raised: '#1e201f',
        highest: '#282a29',
        primary: '#37e787',
        'primary-soft': '#8affaf',
        secondary: '#e4c277',
        outline: '#3c4a3e',
        muted: '#9aaa9c',
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'Segoe UI', 'Arial', 'sans-serif'],
        display: ['Geist Variable', 'Geist', 'Inter Variable', 'sans-serif'],
        mono: ['JetBrains Mono', 'Cascadia Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
