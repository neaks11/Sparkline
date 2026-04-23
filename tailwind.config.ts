import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#edf7ff',
          100: '#d7ebff',
          500: '#2a7fff',
          600: '#1a66db',
          900: '#0f2a52',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 42, 82, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
