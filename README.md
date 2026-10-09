# earlywire.app

The EarlyWire website. Plain files, no build step, no third-party fonts, scripts or requests.
Hosted on GitHub Pages with the custom domain in `CNAME`. Source of truth: `Docs/site` in the app's repository.

- `index.html`, `style.css`, `site.js`: the home page (night-to-dawn theme, light and dark, works at phone width).
- `privacy.html`, `terms.html`: legal pages (same wording as before, clean markup).
- `assets/img`: screenshots from the app (iPhone, iPad, Mac) and video posters. `assets/video`: real recordings of the app (hero loop, one-minute tour, setup, listen, describe).
- `og.png`: social preview image. `sitemap.xml`, `robots.txt`.
- `testimonials.json`: real quotes only. It is `[]` on purpose, and the page shows an invitation instead. Add entries as
  `{"quote": "...", "name": "First name", "role": "optional"}` once a tester has agreed to be quoted. Never add invented quotes.

Preview locally: `python3 -m http.server 8000 --directory Docs/site`, then open http://localhost:8000.
Re-record the videos before big releases, since the screens change (see CLAUDE.md for the method).
