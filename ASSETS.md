# Asset provenance

Two original atlases were generated with the built-in image generation tool for this game, then inspected and copied into `out/assets/`. No third-party game artwork was imported. Both atlases are 1254×1254 pixels. Source images are unchanged; the Canvas renderer uses explicit source rectangles because generated cell boundaries are not perfectly uniform.

- `out/assets/tomb-sprites.png`: RGBA with transparency. Sixteen richly detailed painterly, slightly elevated orthographic game sprites: explorer, blue/red/green jiangshi; closed/open stone sarcophagus, bronze crossbow, brazier; lamp, wine flask, hoof talisman, jade vest; compass, relic seal, altar, stairs.
- `out/assets/tomb-materials.png`: opaque terrain atlas: sandstone, limestone, bronze, ember basalt; gray stone, damp moss stone, ritual purple stone, obsidian; imperial gold stone, meteor stone, teal water, cracked moss stone; sandstone/gray/bronze/basalt wall reliefs.
- `out/assets/tomb-ambience.wav` and `sound-check.wav`: original deterministic synthesis using `scripts/create-audio.py`, PCM 22050 Hz, mono, 16-bit.

## Generation brief

Create production game atlases for a Chinese ancient-tomb survival game. Realistic painterly 3D-render appearance, top-down/slightly three-quarter orthographic view, lighting from upper left, aged cloth, eroded carved stone and oxidized bronze. No emoji, pixel art, labels, text, UI, dividers or mock screenshots. Sprite atlas: a transparent 4×4 atlas in the subject order listed above, isolated complete objects with padding. Terrain atlas: opaque 4×4 top-down material textures in the listed order, each material filling its cell. The requested 2048 size and exact regular grid were not honored by generation; the renderer accounts for the actual 1254 size and inspected boundaries. No retries or image editing were used.
