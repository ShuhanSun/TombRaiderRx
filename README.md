# 寻龙诀 · Tomb Raider

[English](README.md) | [简体中文](README.zh-CN.md)

A browser-based tomb exploration game inspired by Chinese burial architecture, hidden chambers, mechanical traps, grave goods, and supernatural folklore.

**Play the current build:** https://tombraider-playtest.bookcool.chatgpt.site

You enter a sealed underground tomb with limited information. Explore chamber by chamber, read the environment, open coffins, recover tools and relics, survive traps and undead guardians, unlock the main burial chamber, and escape before the tomb turns against you.

## The Tomb-Raiding Loop

1. **Explore** — move through tomb passages, side chambers, hidden rooms, and sealed burial spaces.
2. **Investigate** — inspect coffins, relics, mechanisms, blood traces, wall structures, and environmental clues.
3. **Prepare** — find tools and survival items before committing to riskier rooms.
4. **Survive** — evade or fight undead guardians and use the tomb's own traps and terrain to stay alive.
5. **Break through** — open the main chamber, deal with its guardian, and reach the escape tunnel.

The goal is not to turn the tomb into a conventional combat arena. Combat creates pressure; exploration, spatial awareness, risk management, and environmental interaction drive the experience.

## What Makes It Different

- **Chinese tomb atmosphere** — stone chambers, burial corridors, coffins, grave goods, dim wall lighting, hidden rooms, and ritual architecture.
- **Physical coffin interaction** — push lids aside, reveal empty coffins, supplies, relics, or undead occupants.
- **Environmental danger** — fire, water, smoke, projectiles, rolling hazards, collapsing mechanisms, and other tomb traps use distinct visual language.
- **Stealth through breath control** — holding your breath can reduce enemy aggression and create an opening to reposition.
- **Exploration tools** — equipment changes how safely and efficiently you can navigate the tomb.
- **Hidden spaces** — some burial chambers are concealed behind walls and reward careful exploration.
- **Desktop + mobile** — the game is designed to be playable in a browser with keyboard or touch controls.

## Equipment

| Item | Purpose |
| --- | --- |
| Entrenching Shovel / 兵工铲 | Close-range attack tool used against undead creatures, crawling enemies, and breakable containers. |
| Compass | Unlocks navigation assistance such as the minimap and objective direction. |
| Oil Lamp | Temporarily improves visibility in dark areas. |
| Golden Jade Suit | Absorbs a single incoming hit. |
| Wooden Shield | Blocks a limited number of attacks before breaking. |

Equipment is deliberately limited. The player is expected to make decisions about route, timing, positioning, and risk rather than simply overpower every threat.

## Controls

### Desktop

- **WASD / Arrow Keys** — Move
- **Shift** — Sprint
- **B** — Hold breath
- **Esc** — Pause
- **M** — Mute

Combat and nearby interactions are contextual. After obtaining the shovel, nearby valid targets can be attacked automatically when conditions allow.

### Mobile

Drag on the game area to move. Sprint, breath control, and contextual actions are available through on-screen controls. The interface is designed to avoid browser double-tap zoom during rapid gameplay input.

## Level Design

The current game contains ten tomb levels with progressively larger spaces and more dangerous combinations of rooms, coffins, traps, enemies, and hidden areas.

The maps are authored and stored in `levels.js` so layouts remain reproducible for balancing, testing, and bug fixing. Later levels increase spatial complexity rather than relying only on higher enemy health.

## Visual and Interaction Goals

The project aims for a grounded 2.5D tomb-exploration look rather than a bright arcade style. Walls should read as solid architecture with visible height and shadow. Smoke remains translucent so danger does not destroy readability. Important objects should be understandable from form, lighting, motion, and placement instead of excessive text labels.

Character animation distinguishes walking, attacking, pushing coffins, holding breath, taking damage, and shield use. Open coffins retain their lids in the world rather than disappearing like ordinary loot containers.

## Run Locally

No build step is required.

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Keep the root HTML/CSS/JavaScript files and the `assets/` directory together when serving the game.

## Tests

Requires Node.js 22+.

```bash
node --test tests/*.test.cjs
```

The automated suite covers core gameplay behavior including map expansion, action atlases, coffins, relics, item details, shield durability, traps, hidden chambers, enemy behavior, return-to-coffin logic, pushing, auto-attack, breath control, and input handling.

Browser mocks cannot fully replace real-device testing, so touch controls, audio, rendering, and mobile performance still require manual verification.

Optional render validation:

```bash
node scripts/render-check.cjs
```

With `@napi-rs/canvas` installed, screenshots are written to `tmp/render-check`.

## Project Notes

- Performance notes: `PERFORMANCE.md`
- Asset and audio credits: `ASSETS.md`
- Main exploration mechanics: `expedition.js`
- Hazards and trap logic: `dangers.js`
- Level layouts: `levels.js`

## Status

This is an actively evolving playable prototype. The current focus is making each tomb feel more deliberate, readable, atmospheric, and replayable while keeping browser performance stable.

Created by Shuhan Sun. See `LICENSE`.
