/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontSize: {
        tag: ['0.5625rem', '0.875rem'],
        regularSmall: ['0.8125rem', '1rem'],
        regularLarge: ['1.125rem', '1.625rem'],
        regularMedium: ['0.875rem', '1.25rem'],
      },
      colors: {
        // Colores claros (light)
        primary: 'var(--va-primary)', // logo:verde oscuro
        secondary: 'var(--va-secondary)', // logo:verde claro
        backgroundLightPrimary: 'var(--va-background-light-primary)',
        backgroundLightSecondary: 'var(--va-background-light-secondary)',
        Lightbase: 'var(--va-base)', // base tema claro (blanco)
        success: 'var(--va-success)',
        warning: 'var(--va-warning)',
        info: 'var(--va-info)',
        danger: 'var(--va-danger)',
        // Colores oscuros (dark)
        darkPrimary: 'var(--va-dark-primary)', // logo: verde oscuro (dark-mode)
        darkSecondary: 'var(--va-dark-secondary)', // logo:verde claro (dark-mode)
        backgroundDarkPrimary: 'var(--va-background-dark-primary)', // fondo oscuro (dark-mode)
        backgroundDarkSecondary: 'var(--va-background-dark-secondary)', // fondo secundario oscuro (dark-mode)
        darkBase: 'var(--va-dark-base)', // base tema oscuro
      },
      height: {
        screen: '100dvh',
      },
      minHeight: {
        screen: '100dvh',
      },
      maxHeight: {
        screen: '100dvh',
      },
    },
    screens: {
      xs: '0px',
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
    },
  },
  plugins: [],
};
