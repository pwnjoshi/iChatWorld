/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        apple: {
          bg: '#FAFAFA',
          card: '#FFFFFF',
          secondaryBg: '#F2F2F7',
          tertiaryBg: '#E5E5EA',
          blue: '#007AFF',
          blueHover: '#0062CC',
          green: '#34C759',
          orange: '#FF9500',
          red: '#FF3B30',
          textPrimary: '#1C1C1E',
          textSecondary: '#8E8E93',
          border: '#E5E5EA',
          borderLight: '#F2F2F7',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Inter',
          'system-ui',
          'sans-serif'
        ]
      },
      fontSize: {
        'title-1': ['34px', { lineHeight: '41px', letterSpacing: '-0.022em' }],
        'title-2': ['28px', { lineHeight: '34px', letterSpacing: '-0.02em' }],
        'title-3': ['22px', { lineHeight: '28px', letterSpacing: '-0.017em' }],
        'headline': ['17px', { lineHeight: '22px', letterSpacing: '-0.024em', fontWeight: '600' }],
        'body': ['17px', { lineHeight: '22px', letterSpacing: '-0.024em' }],
        'callout': ['16px', { lineHeight: '21px', letterSpacing: '-0.02em' }],
        'subhead': ['15px', { lineHeight: '20px', letterSpacing: '-0.015em' }],
        'footnote': ['13px', { lineHeight: '18px', letterSpacing: '-0.01em' }],
        'caption': ['12px', { lineHeight: '16px', letterSpacing: '0em' }],
      },
      borderRadius: {
        'ios-card': '18px',
        'ios-btn': '12px',
        'ios-input': '12px',
      },
      boxShadow: {
        'ios-card': '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)',
        'ios-sheet': '0 -4px 24px rgba(0, 0, 0, 0.12)',
        'ios-dropdown': '0 8px 30px rgba(0, 0, 0, 0.12)',
      },
      transitionTimingFunction: {
        'apple-spring': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      }
    },
  },
  plugins: [],
}
