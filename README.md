# cooking-game-01

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Shayidinadapa/cooking-game-01/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Shayidinadapa/cooking-game-01/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Sizzle & Serve** — a tiny kitchen rush game. You are the only chef on a
150-second shift: tickets land on the order board, and you run the kitchen —
grab buns, tomatoes, lettuce and cheese, chop what needs chopping, grill
patties and fry fries before they burn, build each dish exactly as the ticket
asks on the plating counter, and ring the serve bell before the customer's
patience runs out. Seven dishes on the menu combine the same ingredients in
different ways, so every ticket is a little route-planning puzzle; fast serves
pay tips and a streak pays bonuses, while the tickets arrive faster and faster
as the rush builds.

## How to play

- **Move:** WASD or arrow keys (mouse click also works to use a station)
- **Interact:** E or Space — grab, chop (hold), grill, fry, plate, serve, trash
- **M:** mute · **R:** restart the shift

The loop: bin → chop board / grill / fryer → plating counter → serve window.
E at an empty grill slaps a fresh patty on it; E at an empty fryer drops fries
in. Burnt food goes in the trash. A wrong plate clears the streak.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no network:
`game/` is plain static files, and every sound is synthesised live with
WebAudio.

## Layout

- `game/index.html` — page shell and canvas
- `game/src/config.js` — kitchen layout, ingredients, recipes, difficulty curve
- `game/src/state.js` — shift clock, tickets, patience, scoring
- `game/src/input.js` — keyboard and mouse
- `game/src/chef.js` — movement and every station interaction
- `game/src/render.js` — all canvas drawing: kitchen, board, chef, HUD
- `game/src/scenes.js` — fixed screenshot scenes (`?shot=cover|mid|rush|serve`)
- `game/src/audio.js` — synthesised sound effects
- `game/src/main.js` — frame loop and wiring
- `main.ts` — the make.fun hand-in program (copies `game/` + `screenshots/`,
  writes `dossier.json`)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

---

<sub>Entered on [make.fun](https://make.fun/?ref=1bz6mt7h&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
