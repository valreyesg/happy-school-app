/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta Happy School
        hs: {
          red:    { DEFAULT: '#E53E3E', light: '#FC8181', dark: '#C53030' },
          yellow: { DEFAULT: '#D69E2E', light: '#F6E05E', dark: '#B7791F' },
          green:  { DEFAULT: '#38A169', light: '#68D391', dark: '#276749' },
          purple: { DEFAULT: '#805AD5', light: '#B794F4', dark: '#553C9A' },
        },
        // Semáforo
        semaforo: {
          verde:    '#38A169',
          amarillo: '#D69E2E',
          rojo:     '#E53E3E',
          gris:     '#718096',
        },
      },
      fontFamily: {
        // Tipografías redondeadas y amigables
        sans: ['Nunito', 'Poppins', 'ui-rounded', 'system-ui', 'sans-serif'],
        display: ['Nunito', 'Poppins', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'bounce-soft': 'bounce 1s ease-in-out infinite',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'hs': '0 4px 14px 0 rgba(128, 90, 213, 0.15)',
        'hs-lg': '0 10px 30px 0 rgba(128, 90, 213, 0.2)',
      },
    },
  },
  plugins: [],
};
