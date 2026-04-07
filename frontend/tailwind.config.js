/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#1B3A5C',
        teal: '#2D8F8A',
        gold: '#D4A843',
        cream: '#F7F5F1',
        dark: '#2C2C2C',
        'navy-light': '#2A5280',
        'teal-light': '#3AADA7',
        'teal-dark': '#1E6B66',
        'gold-light': '#E8C069',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
      },
      boxShadow: {
        'card': '0 4px 24px rgba(27, 58, 92, 0.08)',
        'card-hover': '0 8px 32px rgba(27, 58, 92, 0.14)',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

