/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        hs: {
          red:    { DEFAULT: '#E53E3E', light: '#FC8181' },
          yellow: { DEFAULT: '#D69E2E', light: '#F6E05E' },
          green:  { DEFAULT: '#38A169', light: '#68D391' },
          purple: { DEFAULT: '#805AD5', light: '#B794F4' },
        },
      },
    },
  },
};
