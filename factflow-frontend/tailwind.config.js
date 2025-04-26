/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
    "./app/routes/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          green: '#39FF14',
          blue: '#00FFFF',
          purple: '#9D00FF',
          red: '#FF0000',
          yellow: '#FFFF00',
        },
        dark: {
          DEFAULT: '#121212',
          lighter: '#1E1E1E',
          lightest: '#2A2A2A',
        }
      },
      boxShadow: {
        'neon-green': '0 0 5px #39FF14, 0 0 10px #39FF14, 0 0 15px #39FF14',
        'neon-blue': '0 0 5px #00FFFF, 0 0 10px #00FFFF, 0 0 15px #00FFFF',
        'neon-red': '0 0 5px #FF0000, 0 0 10px #FF0000, 0 0 15px #FF0000',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} 