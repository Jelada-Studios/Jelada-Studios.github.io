# Jelada Studios website

Static site served by GitHub Pages at <https://jeladastudios.com>.

```
index.html              studio home page
fts-geology/index.html  FT's Geology page (own copy and diagrams, same shared assets)
assets/css/tailwind.css utility classes, BUILT from src/tailwind.css (do not edit by hand)
assets/css/site.css     shared hand-written styles: tokens, type, nav, motion, components (no build needed)
assets/css/fts.css      styles only the FT's Geology page uses: plate map, boundary diagrams, seismogram
assets/js/site.js       shared behaviour: theme, TR/EN, reveals, nav, menu, smooth scroll, page transitions
assets/js/fts.js        FT's Geology only: boundary tabs, seismogram trace, copy buttons
assets/js/vendor/       Lenis 1.3.26 (MIT), smooth scrolling
assets/fonts/           Space Grotesk + JetBrains Mono (OFL), self-hosted, latin + latin-ext
assets/img/             optimised photos (AVIF/WebP), logo vector, favicons, social card
```

## Changing the page

- **Copy / markup:** edit `index.html` or `fts-geology/index.html`. Both languages live in the `window.SITE_I18N` block at the bottom of each page.
- **Hand-written styles:** edit `assets/css/site.css` (everywhere) or `assets/css/fts.css` (mod page). Nothing to build.
- **Tailwind utility classes** (`px-6`, `md:text-7xl`, ...): if you add or remove one in either page or
  `assets/js/site.js` / `assets/js/fts.js`, rebuild the utility CSS and commit the result:

  ```
  npm install        # once
  npm run build:css
  ```

  A class that is not in the built file silently does nothing, so this is the first thing to check
  when a new class "has no effect".

## Notes

- `jeladastudioslogo.svg` (repo root) is the original brand file and is untouched. `assets/img/logo.svg`
  and `logo-mark.svg` are clean vector traces of it (about 99% pixel overlap), used on the page. The
  structured data and the FT's Geology page still point at the original.
- `test1.jpeg` (shows editor gizmos) and `image.png` are not used by any page. They were left in place
  in case something outside this repo links to them.
- Motion respects `prefers-reduced-motion`; scroll-linked effects use CSS scroll timelines and simply
  do not run in browsers without them. Page-to-page transitions use cross-document View Transitions.
- Sections use `overflow-clip`, not `overflow-hidden`: `hidden` turns a section into a scroll container,
  which freezes every scroll-linked animation inside it.
- The FT's Geology social card (`assets/img/og-fts.jpg`) is a 1200x630 crop of `fault1.jpg`; replace it
  with a designed card whenever you have one.
