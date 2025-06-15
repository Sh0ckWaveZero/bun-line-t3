import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // 🎨 Font Families - Prompt Font สำหรับทั้ง Project
      fontFamily: {
        prompt: ['Prompt', 'sans-serif'],
        sans: ['Prompt', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // 🔤 Font Weights - รองรับทุก weight ของ Prompt
      fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },
      // 🎯 Custom utilities และ theme extensions ที่มีอยู่แล้ว
      animation: {
        'ring-rotate': 'ring-rotate 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite',
      },
      keyframes: {
        'ring-rotate': {
          '0%': {
            transform: 'rotate(0deg)',
          },
          '100%': {
            transform: 'rotate(360deg)',
          },
        },
      },
    },
  },
  plugins: [],
}

export default config
