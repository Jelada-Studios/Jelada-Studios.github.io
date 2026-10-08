/** Same theme the Play CDN used: colours are CSS variables so light/dark swap without a rebuild. */
module.exports = {
  content: ['./index.html', './fts-geology/index.html', './assets/js/site.js', './assets/js/fts.js'],
  theme: {
    extend: {
      colors: {
        black:      'rgb(var(--c-bg) / <alpha-value>)',
        darkgray:   'rgb(var(--c-surface) / <alpha-value>)',
        rawgray:    'rgb(var(--c-muted) / <alpha-value>)',
        purewhite:  'rgb(var(--c-fg) / <alpha-value>)',
        line:       'rgb(var(--c-line) / <alpha-value>)',
        faint:      'rgb(var(--c-faint) / <alpha-value>)',
        tensionred: 'rgb(var(--c-accent) / <alpha-value>)'
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    }
  }
};
