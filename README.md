# Jelada Studios website

Static site served by GitHub Pages at <https://jeladastudios.com>.

```
index.html              studio home page (styled by assets/, see below)
fts-geology/index.html  FT's Geology page (still on the Tailwind Play CDN, not migrated yet)
assets/css/tailwind.css utility classes, BUILT from src/tailwind.css (do not edit by hand)
assets/css/site.css     every hand-written style: tokens, motion, components (no build needed)
assets/js/site.js       behaviour: theme, TR/EN, reveals, nav, menu, smooth scroll glue
assets/js/vendor/       Lenis 1.3.26 (MIT), smooth scrolling
assets/fonts/           Space Grotesk + JetBrains Mono (OFL), self-hosted, latin + latin-ext
assets/img/             optimised photos (AVIF/WebP), logo vector, favicons
```

## Changing the page

- **Copy / markup:** edit `index.html`. Both languages live in the `window.SITE_I18N` block at the bottom.
- **Hand-written styles:** edit `assets/css/site.css`. Nothing to build.
- **Tailwind utility classes** (`px-6`, `md:text-7xl`, ...): if you add or remove one in `index.html` or
  `assets/js/site.js`, rebuild the utility CSS and commit the result:

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
  do not run in browsers without them.
