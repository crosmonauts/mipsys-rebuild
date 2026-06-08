import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fontFamily: {
          sans: ['var(--font-body)', '"IBM Plex Sans"', 'sans-serif'],
          serif: ['var(--font-body)', '"IBM Plex Sans"', 'sans-serif'],
          mono: ['var(--font-mono)', '"IBM Plex Mono"', 'monospace'],
        },
        letterSpacing: {
          luxury: '0.4em',
          'tight-heading': '-0.04em',
        },
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
    },
  },
  plugins: [],
};
export default config;
