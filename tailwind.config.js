/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'jost': ['Jost', 'sans-serif'],
      },
      backgroundColor: {
        'primary': '#3477FF',
        'primary-hover': '#5C89E1',
        'background': '#0A031F',
        'background-end': '#020007',
      },
      colors: {
        'primary': '#3477FF',
        'primary-hover': '#5C89E1',
      },
    },
  },
  plugins: [],
}; 