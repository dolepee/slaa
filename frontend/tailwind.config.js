/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: '#0B0F1A',
          light: '#111827',
        },
      },
      animation: {
        'glow': 'glow-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
