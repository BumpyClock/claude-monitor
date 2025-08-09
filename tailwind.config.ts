import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

export default {
  content: [
    './app/**/*.{vue,js,ts,jsx,tsx}',
    './components/**/*.{vue,js,ts,jsx,tsx}',
    './pages/**/*.{vue,js,ts,jsx,tsx}',
    './plugins/**/*.{vue,js,ts,jsx,tsx}',
    './nuxt.config.{js,ts}'
  ],
  darkMode: ['class', 'class'],
  theme: {
    extend: {
      screens: {
        xs: '480px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
        mobile: {
          max: '699px'
        },
        tablet: {
          min: '700px',
          max: '1023px'
        },
        desktop: {
          min: '1024px'
        }
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        theme: {
          primary: 'var(--theme-primary)',
          'primary-hover': 'var(--theme-primary-hover)',
          'primary-light': 'var(--theme-primary-light)',
          'primary-dark': 'var(--theme-primary-dark)',
          bg: {
            primary: 'var(--theme-bg-primary)',
            secondary: 'var(--theme-bg-secondary)',
            tertiary: 'var(--theme-bg-tertiary)',
            quaternary: 'var(--theme-bg-quaternary)'
          },
          text: {
            primary: 'var(--theme-text-primary)',
            secondary: 'var(--theme-text-secondary)',
            tertiary: 'var(--theme-text-tertiary)',
            quaternary: 'var(--theme-text-quaternary)'
          },
          border: {
            primary: 'var(--theme-border-primary)',
            secondary: 'var(--theme-border-secondary)',
            tertiary: 'var(--theme-border-tertiary)'
          },
          accent: {
            success: 'var(--theme-accent-success)',
            warning: 'var(--theme-accent-warning)',
            error: 'var(--theme-accent-error)',
            info: 'var(--theme-accent-info)'
          }
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      boxShadow: {
        theme: 'var(--theme-shadow)',
        'theme-lg': 'var(--theme-shadow-lg)'
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      transitionProperty: {
        theme: 'var(--theme-transition)',
        'theme-fast': 'var(--theme-transition-fast)'
      }
    }
  },
  plugins: [tailwindcssAnimate],
  safelist: [
    // Background colors
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-cyan-500',
    // Border colors
    'border-blue-500',
    'border-green-500',
    'border-yellow-500',
    'border-purple-500',
    'border-pink-500',
    'border-indigo-500',
    'border-red-500',
    'border-orange-500',
    'border-teal-500',
    'border-cyan-500',
    // Gradient colors
    'from-blue-500',
    'to-blue-600',
    'from-green-500',
    'to-green-600',
    'from-yellow-500',
    'to-yellow-600',
    'from-purple-500',
    'to-purple-600',
    'from-pink-500',
    'to-pink-600',
    'from-indigo-500',
    'to-indigo-600',
    'from-red-500',
    'to-red-600',
    'from-orange-500',
    'to-orange-600',
    'from-teal-500',
    'to-teal-600',
    'from-cyan-500',
    'to-cyan-600',
    // Theme classes
    'theme-bg-primary',
    'theme-bg-secondary',
    'theme-bg-tertiary',
    'theme-bg-quaternary',
    'theme-text-primary',
    'theme-text-secondary',
    'theme-text-tertiary',
    'theme-text-quaternary',
    'theme-border-primary',
    'theme-border-secondary',
    'theme-border-tertiary',
    'theme-primary',
    'theme-primary-bg',
    'theme-primary-border',
    'theme-accent-success',
    'theme-accent-warning',
    'theme-accent-error',
    'theme-accent-info',
    'theme-shadow',
    'theme-shadow-lg',
    'theme-transition',
    'theme-transition-fast',
    'theme-hover',
    'theme-active',
    'theme-focus',
    'backdrop-blur',
    // Theme class names
    'theme-light',
    'theme-dark',
    'theme-modern',
    'theme-earth',
    'theme-glass',
    'theme-high-contrast',
    // Responsive utilities
    'touch-pan-x',
    'touch-pan-y',
    'overflow-x-auto',
    'overflow-y-hidden',
    // Mobile-specific classes
    'sm:block',
    'sm:inline',
    'sm:hidden',
    'mobile:px-2',
    'mobile:py-2',
    'tablet:w-80',
    'desktop:w-96'
  ]
} satisfies Config