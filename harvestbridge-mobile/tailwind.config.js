const { lightColors, darkColors } = require('./src/theme/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: lightColors.primary,
        accent: lightColors.accent,
        canvas: lightColors.background,
        surface: lightColors.surface,
        outline: lightColors.border,
        ink: lightColors.text,
        muted: lightColors.textMuted,
        danger: lightColors.error,
        success: lightColors.success,
        warning: lightColors.warning,
        info: lightColors.info,
        'dark-brand': darkColors.primary,
        'dark-accent': darkColors.accent,
        'dark-canvas': darkColors.background,
        'dark-surface': darkColors.surface,
        'dark-outline': darkColors.border,
        'dark-ink': darkColors.text,
        'dark-muted': darkColors.textMuted,
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '18px',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      minHeight: {
        button: '52px',
      },
    },
  },
  plugins: [],
};
