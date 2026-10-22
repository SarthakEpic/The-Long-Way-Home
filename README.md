# Lunaria — The Long Way Home

Lunaria is a small, moonlit routing puzzle. Rotate the garden mirrors to guide a lost firefly through every star and into the moonflower.

## Play

Open index.html in a modern browser, or serve this folder with python -m http.server and visit http://localhost:8000.

- Click a mirror (or focus it and press Enter) to turn it.
- Press **H** for a clue or **R** to reset the meadow.
- Finish all three hand-built routes. Your completed meadows and best turn counts are saved in this browser.
- Sound is optional and starts off.

## Design decisions

- **One clear mechanic:** each mirror turns the light by 90 degrees. There is no timer, so the puzzle rewards observation instead of speed.
- **A little world in the interface:** a warm garden palette, custom CSS mirror and flower art, animated beam tracing, and tiny optional synthesized tones build atmosphere without image or audio downloads.
- **Responsive and keyboard friendly:** the board scales down for phones, every mirror is a real button, focus is visible, and motion respects the reduced-motion setting.
- **Plain web technologies:** semantic HTML, CSS, and vanilla JavaScript; no packages, build step, or network dependency.
