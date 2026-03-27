import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          default: '#f2f6fb',
          subtle: '#f7faff',
          inset: '#edf3fa',
          card: '#ffffff'
        },
        border: {
          default: '#d0d7de',
          muted: '#dbe4ee'
        },
        fg: {
          default: '#24292f',
          muted: '#57606a',
          subtle: '#6b7785',
          onEmphasis: '#ffffff'
        },
        accent: {
          DEFAULT: '#0f6cfd',
          foreground: '#ffffff',
          subtle: '#dff0ff',
          muted: '#eef7ff'
        },
        success: {
          DEFAULT: '#1a7f37',
          subtle: '#dafbe1'
        },
        warning: {
          DEFAULT: '#9a6700',
          subtle: '#fff8c5'
        },
        danger: {
          DEFAULT: '#cf222e',
          subtle: '#ffebe9'
        }
      },
      fontFamily: {
        sans: ['Segoe UI Variable Text', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['Cascadia Code', 'Consolas', 'monospace']
      },
      boxShadow: {
        panel: '0 1px 0 rgba(27, 31, 36, 0.04), 0 10px 30px rgba(15, 23, 42, 0.06)',
        float: '0 24px 80px rgba(15, 23, 42, 0.14)',
        hero: '0 30px 120px rgba(15, 23, 42, 0.16)'
      },
      borderRadius: {
        sm: '10px',
        md: '14px',
        lg: '18px'
      }
    }
  },
  plugins: []
} satisfies Config
