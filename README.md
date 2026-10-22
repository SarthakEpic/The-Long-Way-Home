# Lunaria — The Long Way Home

Lunaria is a short, moonlit mirror-routing puzzle. Turn each mirror to guide a firefly through every star shard and into the moonflower.

## Play

Open index.html in a modern browser, or run a local server in this folder with python -m http.server 8000 and visit http://localhost:8000.

- Click or focus a mirror and press Enter to rotate it.
- Press H for a clue or R to restart the stage.
- Choose any of the three hand-built stages. Completed stages and best move counts save in this browser.
- Optional sound starts off.

## Design

The screen is built like a playable arcade HUD: the puzzle board takes the largest space, with stage identity, collectibles, move count, level select, and controls always in view. A midnight palette, crisp coordinate labels, chunky mirror controls, and a bright beam make the puzzle state easy to read. The interface stays in the game world instead of presenting the puzzle as a product or journal page.

The game uses plain HTML, CSS, and JavaScript with no build step, packages, remote fonts, or external assets. Mirror changes update the light path immediately, collectible stars brighten when reached, and the moonflower lights up when the route is complete. Reduced-motion and keyboard support are included.

## References

The layout takes cues from the clear, board-first play view in [Mini Metro](https://www.minimetro.io/) and the direct light-routing feedback in [Mirror Post](https://splashscreen.games/game/mirror-post) and [Prism Quest](https://listeray.github.io/prismquest/). Lunaria's artwork, board, and interface are original.