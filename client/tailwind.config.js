/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#111827', // Latar belakang utama (abu-abu gelap)
        'brand-dark-secondary': '#1F2937', // Warna kartu/panel
        'brand-green': '#10B981', // Hijau cerah sebagai aksen utama
        'brand-green-light': 'rgba(16, 185, 129, 0.1)', // Latar belakang hover
        'brand-light': '#E5E7EB', // Warna teks utama
        'brand-gray': '#9CA3AF', // Warna teks sekunder
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 15px rgba(16, 185, 129, 0.4)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
