# Czinger Miami: home page v2 (dev handoff)

Live preview: https://sigovs.github.io/CZINGER_PRESTIGE/index_v2.html
Repo: https://github.com/Sigovs/CZINGER_PRESTIGE. Download ZIP: https://github.com/Sigovs/CZINGER_PRESTIGE/archive/refs/heads/main.zip

v2 files: `index_v2.html`, `css/home_v2.css`, `js/home_v2.js`. v2 shares `assets/` with v1. v1 (`index.html`, `home.css`, `home.js`) is the earlier version shown to the client; build from v2.

## Run locally
Use a web server, not `file://`. For example: `python3 -m http.server 8000`, then open http://localhost:8000/index_v2.html

## Stack
- Static HTML/CSS/JS. No build step and no framework.
- CDN dependencies, with pinned versions:
  - GSAP 3.15.0 with ScrollTrigger and SplitText (unpkg)
  - Lenis 1.3.26 (unpkg), CSS and JS
  - Google Fonts: Instrument Sans 400/500 and JetBrains Mono 500
- For production, self-host these files or keep the versions pinned.
- Smooth scroll comes from Lenis. With `prefers-reduced-motion: reduce`, Lenis, the pins and autoplay are all off, and the page falls back to a static version.

## Page structure
1. **Hero:** a slider (see below).
2. **The bench:** a pinned, scroll-scrubbed comparison of the three 21C expressions (HDF, VMax, Spyder). The SVG outlines are inline in the HTML.
3. **Engineering:** a scrubbed film, then the V8 and BrakeNode rows.
4. **Manufacturing:** a film.
5. **Records:** a film with a "watch the full lap" dialog. The 11 MB lap file loads only when the visitor asks for it.
6. **Miami:** a photo by default; `?miami=video` swaps in a film.
7. **Allocation form** and footer.

Full-screen film sections pin briefly. Their copy slides in, holds, then exits with the scroll.

## Model pages (placeholders)
- The pages are `21c-hdf.html`, `21c-vmax.html` and `21c-spyder.html`, styled by `css/model.css` plus the shared `css/home_v2.css`.
- Each one says "Model page coming soon" and shows the model logo, the head-on cutout and a short note.
- Each one has two buttons: "Inquire" goes to `index_v2.html#inquire` and "See it on the bench" goes to `index_v2.html#expr-…`.
- Links to these pages:
  - the 21C HDF / VMax / Spyder items in the menu;
  - the "Explore" button beside "Inquire" on each bench card.
- Hash links arriving from another page are re-landed after the pins measure the page (see `home_v2.js`, "arriving with a hash").

## Hero slider (v2)
- **Slide 1:** the Miami trio film. It plays once (18.3 s), crossfades to slide 2, which holds for 8 s, then returns to the film.
- **Slide 2:** the 21C Spyder photo with a WebGL "distort" overlay on desktop only. `?distort=0` turns the overlay off.
- **Controls:** numbered buttons with progress bars, plus a pause button (WCAG 2.2.2). The film pauses when it is off-screen and when the tab is hidden.
- **Film files**, all H.264 MP4 with no audio and faststart, each with a `.webp` poster:

| File | Size | Weight |
|---|---|---|
| `assets/video/hero-trio-d.mp4` | 1920×1080 | 3.6 MB |
| `assets/video/hero-trio-m.mp4` | 720×1280 | 1.8 MB |

- **Video fallback:** if the film fails to load, the hero falls back to the photo alone. For example, an embedded webview without H.264 support, such as the VS Code preview.
- **Mobile (≤767 px):**
  - The lede is hidden and the title sits on one line.
  - The label is shortened to "Official dealer · Florida".
  - The CTAs sit at the foot of the hero, above the slide controls.
- **Contrast:** the scrims were measured against the film every 0.5 s. The minimum is 6.1:1 on desktop and 5.7:1 on phones.

## Other video
All other video files are in `assets/video/`, each with a `-d` and `-m` version and a `.webp` poster. The page picks the right one with `matchMedia("(max-width: 767px)")`.

## URL parameters (QA only)
| Parameter | Effect |
|---|---|
| `?settle=1` | Turns on scroll "pin stops" (snap to rest positions) |
| `?hero=video` | The old single-video hero (H2 clip) instead of the slider |
| `?miami=video` | A film instead of the photo in the Miami section |
| `?distort=0` / `?distort=burst` | Hero photo overlay off, or always on |

## Open items before going live
- [ ] **Form:** `[data-form]` validates on the client only and shows a success message. Nothing is sent. Wire it to the CRM or lead endpoint. The fields are `expression`, `name`, `email`, `phone` and `message`.
- [ ] **Phone:** every number on the page is (833) 290-6287, the Prestige group sales line. czinger.com lists +1 888-514-3028 for Czinger Miami. Prestige needs to confirm which one to use.
- [ ] **Address:** the street number is withheld. czinger.com and the Prestige site disagree (14800 vs 14780 Biscayne Blvd).
- [ ] **Rights:** Czinger and Divergent film and photography are used for the prototype only. Written consent from Czinger is needed before launch. The hero trio film is Prestige's own.
- [ ] **Indexing:** remove `<meta name="robots" content="noindex">` at launch.
- [ ] **Footer:** remove the "Prototype, not for publication" line from the footer legal text at launch.
- [ ] **Console:** there is one known harmless GSAP warning ("target not found" in `cardIn`), carried over from v1.
