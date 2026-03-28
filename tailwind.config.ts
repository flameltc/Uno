import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          default: '#090a0d',
          subtle: '#0f1117',
          inset: '#06070a',
          card: '#14161c',
          raised: '#1b1e26'
        },
        border: {
          default: '#262b36',
          muted: '#1d212a',
          strong: '#394254'
        },
        fg: {
          default: '#f4f7fb',
          muted: '#a7afbd',
          subtle: '#788194',
          onEmphasis: '#071321'
        },
        accent: {
          DEFAULT: '#adc6ff',
          foreground: '#071321',
          subtle: '#172339',
          muted: '#0f1729',
          strong: '#4b8eff'
        },
        success: {
          DEFAULT: '#4ade80',
          subtle: '#102319'
        },
        warning: {
          DEFAULT: '#fbbf24',
          subtle: '#2f240e'
        },
        danger: {
          DEFAULT: '#fb7185',
          subtle: '#31131c'
        }
      },
      fontFamily: {
        sans: ['Manrope', 'Segoe UI Variable Text', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['Cascadia Code', 'IBM Plex Mono', 'Consolas', 'monospace']
      },
      boxShadow: {
        panel: '0 20px 60px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        float: '0 28px 100px rgba(0, 0, 0, 0.45), 0 0 36px rgba(173, 198, 255, 0.08)',
        hero: '0 40px 140px rgba(0, 0, 0, 0.5), 0 0 50px rgba(173, 198, 255, 0.09)'
      },
      borderRadius: {
        sm: '12px',
        md: '18px',
        lg: '26px'
      }
    }
  },
  plugins: []
} satisfies Config
