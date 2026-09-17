# Asset provenance

Original atlases were generated with the built-in image generation tool for this game, then inspected and copied into `assets/`. No third-party game artwork was imported. All atlases are 1254×1254 pixels. Source images are unchanged; the Canvas renderer uses explicit source rectangles because generated cell boundaries are not perfectly uniform.

- `assets/tomb-sprites.png`: RGBA with transparency. Sixteen richly detailed painterly, slightly elevated orthographic game sprites: explorer, blue/red/green jiangshi; closed/open stone sarcophagus, bronze crossbow, brazier; lamp, wine flask, hoof talisman, jade vest; compass, relic seal, altar, stairs.
- `assets/tomb-materials.png`: opaque terrain atlas: sandstone, limestone, bronze, ember basalt; gray stone, damp moss stone, ritual purple stone, obsidian; imperial gold stone, meteor stone, teal water, cracked moss stone; sandstone/gray/bronze/basalt wall reliefs.
- `assets/tomb-ambience.wav` and `sound-check.wav`: original deterministic synthesis using `scripts/create-audio.py`, PCM 22050 Hz, mono, 16-bit.

## Generation brief

Create production game atlases for a Chinese ancient-tomb survival game. Realistic painterly 3D-render appearance, top-down/slightly three-quarter orthographic view, lighting from upper left, aged cloth, eroded carved stone and oxidized bronze. No emoji, pixel art, labels, text, UI, dividers or mock screenshots. Sprite atlas: a transparent 4×4 atlas in the subject order listed above, isolated complete objects with padding. Terrain atlas: opaque 4×4 top-down material textures in the listed order, each material filling its cell. The requested 2048 size and exact regular grid were not honored by generation; the renderer accounts for the actual 1254 size and inspected boundaries. The first two atlases were accepted without retries. Motion atlases later received background-extraction passes through the built-in image tool.

## Motion assets

- `assets/raider-walk.png`: generated four-direction, four-frame explorer sheet. Source is RGB; neutral background uses the renderer’s cached color-key import. Static torso and articulated boot rendering maintain the held lantern and exaggerate alternating steps without regenerating textures.
- `assets/jiangshi-motion.png`: RGBA sheet; blue/red/green jiangshi grounded, airborne, crouching and lunging/spitting; dust, slash, venom and muzzle sparks.
- `assets/trap-motion.png`: RGBA sheet; arrow, stone, log, fireball; venom, crossbow, retracted/extended spikes; fire vent inactive/warning/active/smoke; poison grate inactive/warning/active and rubble.

Built-in generation prompts requested realistic elevated orthographic 4×4 sheets matching the original game art, four sequential down/left/right/back gait frames, three zombie classes with hop/windup/strike frames, and the listed projectile/trap states. Follow-up prompt: remove only the checkerboard background, preserve all sprites and grid, output true RGBA. Zombie/trap extraction succeeded; player extraction retained RGB, supported by the renderer. Original generated files are preserved. Explicit per-column source boundaries avoid neighbouring poses bleeding into frames.

Footsteps are short cached Web Audio buffers with stone heel/sole/grit and water splash variants. Playback follows actual travel distance, respects pause and mute, and disconnects finished sources. No external samples or audio service are used.

`assets/tomb-mechanisms.png`: built-in generated RGBA 1275×1233 atlas, inspected before integration. Prompt: realistic Chinese tomb mechanical lever OFF/ON, hatch closed/open, sand/water/beetles/lava/mist/corpse water/poison/vines/acid/starfall patches and gear/chain. Source unchanged; explicit boundaries account for the tall first row. Footstep synthesis was removed after user feedback.


## Realistic stone material (2026-09-16)
`assets/tomb-stone-realistic.png` was created with the built-in image generation tool and copied into this project. Runtime Canvas samples the left floor panel and right brick panel without altering the source image.
Prompt: A photorealistic orthographic two-panel ancient Chinese tomb material atlas: left worn cool-grey irregular limestone floor slabs, right staggered weathered blue-grey brickwork with subtle Han cloud-scroll relief. Flat diffuse lighting; no text, objects, borders or baked shadows; sharp natural stone detail.


## Expedition atlas
`assets/tomb-expedition.png`: built-in image generation, transparent 4×4 atlas. Prompt: realistic 2.5D overhead Chinese tomb objects, ten themed funerary architectural props (stone stele, crossbow, bronze guardian, ritual furnace, bone urn, water jar, talisman pillar, rooted pillar, gilt dragon column, meteor monolith), crawling corpse, worms, scarab, spider, bat, red lacquer coffin on pedestal. Neutral upper-left light, isolated alpha cutouts, no text. Integrated as runtime sprites.


## Coffin detail atlas
`assets/tomb-coffin-details.png`: generated with the built-in image tool. Prompt: transparent 2×2 realistic overhead Chinese tomb atlas containing a giant red lacquer coffin with descending stair passage, stone coffin arrival stairway, desiccated corpse inside open stone coffin, and scattered ivory bones/skulls. Isolated cutouts, neutral upper-left lighting, no text.
# Shovel and tomb atmosphere update

Generated with the built-in image-generation tool for this game: `assets/raider-shovel-attack.png` (four-direction, four-stage realistic shovel combat sheet), `assets/entrenching-shovel.png` (weathered steel and wood pickup), and `assets/tomb-remains.png` (aged severed remains in burial cloth). Transparent alpha is retained. Prompts requested elevated orthographic 2.5D sprites, weathered materials, consistent framing and no text. The attack sheet uses a mirrored right-facing row for coherent left-facing attacks. These assets are original generated art, not historical photographs.

The same tool produced `assets/raider-coffin-push.png`, a four-direction four-stage heavy-pushing animation, and `assets/coffin-lid.png`, a detached carved stone lid retained beside opened coffins. Both preserve transparent alpha and contain no text.

`assets/trap-emitters.png` is an original generated transparent 4×2 atlas. It contains, in order, a concealed arrow slit, rolling-stone chute, timber release gate, fireball furnace, flame nozzle, water-pressure pipe, smoke grille and poison nozzle. The runtime uses each device only for its matching hazard.

## Control icons (v15)

`assets/control-buttons.png`: generated with the built-in image tool. Prompt: a 2×2 sheet of aged bronze Chinese tomb game buttons, shovel attack, running figure, pause bars, speaker, ivory symbols, black background, no text. The current runtime uses its sprint, pause and sound controls; the former attack cell is retained but unused.

`assets/breath-button.svg`: a code-native functional control icon added for the hold-breath mechanic. It uses the game's bronze coin treatment with a pale lung-and-breath symbol and contains no label text.

`assets/raider-hold-breath.png`: built-in image generation, 4×4 character sheet matching the explorer. Rows show front, left, right and back directions; every frame uses a crouched, mouth-covered stealth pose with a low lantern. The runtime removes the neutral checkerboard color key and darkens the character while breath is held.
