import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          default: '#f6f8fa',
          subtle: '#f6f8fa',
          inset: '#f6f8fa',
          card: '#ffffff'
        },
        border: {
          default: '#d0d7de',
          muted: '#d8dee4'
        },
        fg: {
          default: '#24292f',
          muted: '#57606a',
          subtle: '#6e7781',
          onEmphasis: '#ffffff'
        },
        accent: {
          DEFAULT: '#0969da',
          foreground: '#ffffff',
          subtle: '#ddf4ff',
          muted: '#f0f6ff'
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
        panel: '0 1px 0 rgba(27, 31, 36, 0.04), 0 1px 3px rgba(27, 31, 36, 0.08)'
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '10px'
      }
    }
  },
  plugins: []
} satisfies Config
