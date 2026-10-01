# The Cliffs

A one-page website for The Cliffs, a fictional luxury clifftop rental on Australia's coast. It's a practice project, built to showcase the house and send visitors to book on Airbnb.

**Live site:** https://daiviksg.github.io/the-cliffs-portfolio-site/

## What's in it

- A scroll-to-open hero: the coast gives way to the house as you scroll
- A full-width photo wall whose middle column stays pinned while the outer columns scroll past
- A "day here" band that moves from dawn to night as you scroll
- Photos that open like windows, a photo viewer that expands from the grid, and buttons with a sliding-arrow fill effect
- Smooth scrolling with [Lenis](https://github.com/darkroomengineering/lenis), turned off for touch screens and reduced-motion visitors
- Responsive from 320px phones to 1920px desktops, with keyboard and screen-reader support

## Built with

Plain HTML, CSS and JavaScript, with no build step. Lenis loads from the jsDelivr CDN, and fonts (Marcellus, Hanken Grotesk) from Google Fonts.

| File | Purpose |
|---|---|
| `index.html` | The page |
| `styles.css` | Design tokens, layout and motion |
| `main.js` | Scroll effects, menu, photo viewer and buttons |
| `config.js` | Listing details: Airbnb URL, guests, price, rating |
| `404.html` | Not-found page (GitHub Pages serves it automatically) |

## Run it locally

```bash
python -m http.server 5500
```

Then open http://localhost:5500.

Listing details, reviews and photos are placeholders for practice.
