import defaultTheme from 'tailwindcss/defaultTheme'
import colors from 'tailwindcss/colors'

/**
 * Tasarım belirteçleri. Sayfalar renkleri ad ile kullanır (text-primary,
 * bg-accent, text-muted …); burayı değiştirmek tüm paneli birlikte günceller.
 *
 * - primary : başlık/metin rengi ve koyu yüzeyler (kenar menüsü)
 * - accent  : marka / birincil eylem rengi
 * - gray    : soğuk "slate" tonları — daha kurumsal, mavi-gri bir zemin
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        primary: '#0F172A',
        accent:  '#2563EB',
        success: '#059669',
        danger:  '#DC2626',
        warning: '#D97706',
        muted:   '#64748B',
        bg:      '#F5F7FA',
        gray:    colors.slate,
        // Sayfalar birincil butonun üzerine gelme rengi olarak blue-600
        // kullanıyor; accent artık 600 tonunda olduğu için bir ton koyusu.
        blue: { ...colors.blue, 600: '#1D4ED8' },
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        // Kartlar: ağır gölge yerine ince çerçeve + çok hafif derinlik.
        sm:    '0 0 0 1px rgb(15 23 42 / 0.06), 0 1px 2px 0 rgb(15 23 42 / 0.04)',
        md:    '0 0 0 1px rgb(15 23 42 / 0.06), 0 4px 12px -2px rgb(15 23 42 / 0.08)',
        lg:    '0 0 0 1px rgb(15 23 42 / 0.06), 0 12px 24px -6px rgb(15 23 42 / 0.12)',
        xl:    '0 0 0 1px rgb(15 23 42 / 0.06), 0 20px 32px -8px rgb(15 23 42 / 0.16)',
        '2xl': '0 0 0 1px rgb(15 23 42 / 0.08), 0 32px 64px -12px rgb(15 23 42 / 0.28)',
      },
      borderRadius: {
        xl:    '0.625rem',
        '2xl': '0.875rem',
      },
    }
  },
  plugins: []
}
