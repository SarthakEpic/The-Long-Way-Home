# Lunaria — The Long Way Home

Lunaria is a small moonlit routing puzzle. Rotate the garden mirrors to guide a lost firefly through every star and into the moonflower.

## Play

Open `index.html` in a modern browser, or serve this folder with `python -m http.server 8000` and visit `http://localhost:8000`.

- Click a mirror (or focus it and press Enter) to turn it.
- Press **H** for a clue or **R** to reset the meadow.
- Finish all three hand-built routes. Completed meadows and best turn counts are saved in this browser.
- Sound is optional and starts off.

## Design decisions

- **Board first:** the puzzle occupies the main stage, while the route, objective, and turn count live in a compact field journal.
- **A small game's own world:** etched coordinates, botanical corner drawings, a warm paper journal, and custom firefly and flower marks make the interface feel like a night-garden game rather than a product dashboard.
- **Tactile feedback:** the beam redraws as mirrors turn, stars glow when found, and the final flower wakes when the path is complete.
- **Responsive and accessible:** the board scales for phones, mirrors and routes are real buttons, focus is visible, and animation respects reduced-motion settings.
- **Plain web technologies:** semantic HTML, CSS, and vanilla JavaScript; no packages, build step, remote fonts, or external assets.

## References

The interaction takes cues from the direct mirror and beam feedback in [Prism](https://github.com/rahulatrkm/prism). The garden mood was informed by small browser games such as [Planted](https://tripod.itch.io/planted) and [BLOOM](https://unlonelystudio.itch.io/bloom). Lunaria's artwork and layout are original CSS and inline SVG.
