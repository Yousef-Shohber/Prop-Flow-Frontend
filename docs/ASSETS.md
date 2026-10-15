# Photography checklist

The app runs without any of these files: wherever a photo is missing, a matching illustration is shown (and no
failed image request is made). Drop a file into **`src/assets/photos/`** with exactly the name below (`.jpg`, `.webp`
or `.png`) and it is picked up automatically on the next dev reload or build, fingerprinted and cached by Vite.

Export each image at the size shown, keep it under ~250 KB (use WebP or well-compressed JPEG), and give yourself
the licence you need (Unsplash / Pexels licences allow commercial use without attribution, but check each photo's page).

| File name (in `src/assets/photos/`) | Used in                                        | Ratio / size     | What to look for                                                       | Where to look (search pages, pick any photo you like)                                                                  |
| ----------------------------------- | ---------------------------------------------- | ---------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `hero-residential.jpg`              | Public landing hero                            | 4:5, 1200 x 1500 | Modern residential building or entrance, daylight, calm colours        | https://unsplash.com/s/photos/modern-apartment-building · https://www.pexels.com/search/modern%20apartment%20building/ |
| `welcome-hero.jpg`                  | Welcome page hero (shown under a navy overlay) | 5:2, 2000 x 800  | Wide, soft, low-contrast exterior or skyline; subject kept to one side | https://unsplash.com/s/photos/residential-building-dusk · https://www.pexels.com/search/building%20dusk/               |
| `gallery-tower.jpg`                 | Landing "spaces" gallery (large tile)          | 4:3, 1600 x 1200 | Residential tower or multi-unit building                               | https://unsplash.com/s/photos/residential-tower · https://www.pexels.com/search/apartment%20tower/                     |
| `gallery-villa.jpg`                 | Landing gallery                                | 4:3, 1200 x 900  | Detached villa or townhouse with garden                                | https://unsplash.com/s/photos/modern-villa · https://www.pexels.com/search/villa%20exterior/                           |
| `gallery-interior.jpg`              | Landing gallery                                | 4:3, 1200 x 900  | Bright, empty or lightly furnished living room                         | https://unsplash.com/s/photos/living-room-interior · https://www.pexels.com/search/apartment%20interior/               |
| `gallery-commercial.jpg`            | Landing gallery (wide tile)                    | 16:7, 1600 x 700 | Shopfronts or office building                                          | https://unsplash.com/s/photos/commercial-building · https://www.pexels.com/search/office%20building/                   |
| `cta-skyline.jpg`                   | Landing closing banner (shown at 25 % opacity) | 5:2, 2000 x 800  | Skyline, very low contrast                                             | https://unsplash.com/s/photos/city-skyline · https://www.pexels.com/search/skyline/                                    |

Notes

- The URLs above are search pages, not specific photos: this environment had no internet browsing, so no individual
  photo was picked or downloaded for you.
- Property and unit photos shown inside the app are the ones owners upload through the backend (Cloudinary); they are not
  part of this checklist.
- Every photo has alt text in both languages (`landing.alt.*`, `home.heroAlt`). If you change a photo's subject, update it.

## Status review (v4 pass)

Present in `src/assets/photos/`: hero-residential, welcome-hero, gallery-tower, gallery-tower2, gallery-villa, gallery-interior,
gallery-commercial, cta-skyline, type-other (jpg) and type-townhouse (re-encoded to WebP, 92 KB). `og-image.jpg` was moved to `public/`
(it was being bundled but never referenced). Per-type tile photos now live in `TYPE_PHOTO` in `src/lib/photos.ts`.

**Known limitation:** the bundled photos are 600-612 px wide. They are sharp in cards, tiles and the Home collage, but would look soft
if used as a full-bleed hero on large screens, which is why Home uses a collage instead. Listing photos always come from owner uploads;
when none exist the illustration is shown.

**Recommended additions (could not be downloaded: no internet access in this environment)**

| File name (`src/assets/photos/`)      | Purpose                       | Size        | Source (search pages)                                                 |
| ------------------------------------- | ----------------------------- | ----------- | --------------------------------------------------------------------- |
| `hero-residential@2x.jpg`             | sharper landing hero          | 1200 x 1500 | https://unsplash.com/s/photos/modern-apartment-building               |
| `welcome-hero-wide.jpg`               | optional full-bleed Home hero | 2000 x 800  | https://unsplash.com/s/photos/residential-building-dusk               |
| `og-image.jpg` (already in `public/`) | social preview                | 1200 x 630  | needs `<meta property="og:image">` with an absolute URL once deployed |

Check each photo's licence page before use.
