const textSizes = {
  regularSmall: {
    fontSize: '0.8125rem',
    lineHeight: '1rem',
  },
}

module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontSize: {
        tag: ['0.5625rem', '0.875rem'],
        regularSmall: ['0.8125rem', '1rem'],
        regularLarge: ['1.125rem', '1.625rem'],
        regularMedium: ['0.875rem', '1.25rem'],
      },
      maxWidth: {
        '7xl': '1128px',
      },
      colors: {
        color: 'var(--va-color)',
        secondary: 'var(--va-secondary)',
        //COLORES ADICIONALES
        tertiary: 'var(--va-tertiary)',
        quaternary: 'var(--va-quaternary)',
        success: 'var(--va-success)',
        info: 'var(--va-info)',
        danger: 'var(--va-danger)',
        warning: 'var(--va-warning)',
        backgroundPrimary: 'var(--va-background-color)',
        backgroundSecondary: 'var(--va-background-secondary)',
        backgroundElement: 'var(--va-background-element)',
        backgroundCardPrimary: 'var(--va-background-card-color)',
        backgroundCardSecondary: 'var(--va-background-card-secondary)',
        backgroundBorder: 'var(--va-background-border)',
        textPrimary: 'var(--va-text-color)',
        textInverted: 'var(--va-text-inverted)',
        shadow: 'var(--va-shadow)',
        focus: 'var(--va-focus)',

        one: 'var(--va-one)',
        two: 'var(--va-two)',
        three: 'var(--va-three)',
        four: 'var(--va-four)',
        five: 'var(--va-five)',
        six: 'var(--va-six)',
        seven: 'var(--va-seven)',
        eight: 'var(--va-eight)',
        nine: 'var(--va-nine)',
        ten: 'var(--va-ten)',
        eleven: 'var(--va-eleven)',
        twelve: 'var(--va-twelve)',
        thirteen: 'var(--va-thirteen)',
        fourteen: 'var(--va-fourteen)',
        fifteen: 'var(--va-fifteen)',
        sixteen: 'var(--va-sixteen)',
        seventeen: 'var(--va-seventeen)',
        eightteen: 'var(--va-eighteen)',
        nineteen: 'var(--va-nineteen)',
        twenty: 'var(--va-twenty)'
      },
      screens: {
        xs: '0px',
        sm: '640px',
        md: '1024px',
        lg: '1440px',
        xl: '1920px',
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
}
