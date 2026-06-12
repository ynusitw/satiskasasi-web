/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        primary: '#2C3E50',
        accent:  '#3498DB',
        success: '#27AE60',
        danger:  '#E74C3C',
        warning: '#F39C12',
        muted:   '#7F8C8D',
        bg:      '#F0F2F5',
      }
    }
  },
  plugins: []
}