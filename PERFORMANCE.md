# Rendering performance

Measured 2026-09-17 using the automated Chromium browser, real game assets,
390×844 Canvas, device pixel ratio 1. These are renderer timings, not end-to-end
frame rates or physical phone measurements.

| Floor | Previous renderer median | Cached renderer median |
| --- | ---: | ---: |
| 1 | 25.2 ms | 1.4 ms |
| 6 | 33.7 ms | 1.5 ms |
| 10 | 30.3 ms | 1.5 ms |

Method: load each floor, stop the animation loop, disable camera shake, and call
both the original HEAD version of `Scene.draw` and the updated renderer against
the same loaded assets and world. Force Canvas completion with
`Game.ctx.getImageData(0, 0, 1, 1)` after each draw. Discard one warm-up and take
the median of five samples. This deliberately includes rasterization/readback;
it does not include simulation, browser compositing, input latency or vsync.

On floor 6, moving the camera 3.4 world pixels per draw for 80 draws gave a
1.2 ms warm median, 1.9 ms p95 and 7.8 ms maximum, including new chunk creation.
The first cold draw took 38.1 ms. Floor-loading work is still synchronous.
The animated passage preview measured 0.8 ms median and 3.2 ms p95 over 30 draws.
Measurements are short local samples, not a guarantee of sustained 60 FPS.

Static floor textures and wall shading now use lazy 4×4-tile raster chunks.
Dynamic water, actors, hazards and effects retain their original drawing order.
The least-recently-used cache targets 32 MiB of pixel storage, or enough chunks
for one viewport if the viewport itself exceeds that budget; browser overhead is
additional. Changing floor, pixel ratio, stone asset or wall collision invalidates
the cache. Unchanged inventory markup no longer rewrites DOM nodes. Offscreen
stains and jets are culled, and stationary reduced-motion passage previews stop
redrawing. No dependencies were added.

Validation: `node --test tests/game.test.cjs` passes 68 tests, including cache
invalidation, cache memory bounds, DOM normalization, effect culling and existing
movement tests at 30/60/144 Hz. A mobile-sized browser screenshot was inspected.
No game JavaScript errors were reported; the existing missing favicon returns 404.
Physical mobile touch/audio testing and sustained crowded-room profiling remain
outside these measurements.
