[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Aethervanguard/best-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Aethervanguard/best-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

# Dapur Kilat — Make the best cooking game

A complete, original cooking game for the [make.fun bounty](https://make.fun/bounty/best-cooking-game-20261125-0137). It runs offline in a desktop browser from its own static files — no network, no libraries, everything drawn in code.

## How to play

You run a lightning-fast Indonesian kitchen. Customers pin orders on the board — each dish needs exactly three ingredients.

- **Click an ingredient bin (or press 1–6)** to drop it on the plate. Three right ingredients send the dish to the stove automatically.
- **Watch the stove**: when the ring fills, the dish waits on the serving counter, steaming and ready.
- **Click the matching order ticket (or press Space)** to serve it before the customer's patience runs out. Fast serves pay more; serving in a row builds a combo.
- **Wrong recipe** clears the plate. **Expired order** costs a heart. Lose all three hearts, or run out the 150-second shift, and the shift ends.

Menu: Nasi Goreng (nasi + telur + sambal), Mie Ayam (mie + ayam + sayur), Ayam Geprek (nasi + ayam + sambal), Mie Telur (mie + telur + sayur). Orders get faster and less patient as the level rises.

## Play it

Serve `game/` with any static server, or run `node serve.ts` and open http://localhost:8080.

## Screenshots

The four shots in `screenshots/` are real renders of the game's own code, staged by `game/src/shots.js` (`?shot=start|play|serve|end&seed=1`): the title over the kitchen, a dish mid-assembly, a plate ready to serve, and the end of a shift.
