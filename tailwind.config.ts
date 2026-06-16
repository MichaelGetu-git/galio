import type { Config } from 'tailwindcss';
import galioPreset from './galio-tailwind-preset';

const config: Config = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [galioPreset],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;