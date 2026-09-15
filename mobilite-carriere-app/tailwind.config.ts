import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        etat: {
          50: '#eef2f8',
          100: '#d6e0ef',
          200: '#adc1df',
          600: '#1d4e89',
          700: '#163d6c',
          800: '#102c4e',
          900: '#0b1f37',
        },
      },
    },
  },
  plugins: [],
};

export default config;
