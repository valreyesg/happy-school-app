/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        hs: {
          red:    { DEFAULT: '#E53E3E', light: '#FC8181', dark: '#C53030' },
          yellow: { DEFAULT: '#D69E2E', light: '#F6E05E', dark: '#B7791F' },
          green:  { DEFAULT: '#38A169', light: '#68D391', dark: '#276749' },
          purple: { DEFAULT: '#805AD5', light: '#B794F4', dark: '#553C9A' },
          blue:   { DEFAULT: '#3B82F6', light: '#93C5FD', dark: '#2563EB' },
          orange: { DEFAULT: '#F97316', light: '#FDBA74', dark: '#EA580C' },
        },
      },
    },
  },
};
