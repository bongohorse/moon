# Mondpost runtime artwork

The 18 Imagegen originals from PR #13 / `856acdf` are preserved byte-for-byte under `assets/source/mondpost/`. These small derivatives are the game resources; originals are not imported into runtime atlases. Source provenance is recorded in the original README, without assigning an additional license.

## Reproduce and check

Use Python 3 and **Pillow 12.3.0** for authoring only:

```sh
python3 tools/prepare_mondpost.py
python3 tools/check_mondpost.py
```

The preparer verifies source SHA-256, clears only alpha below 8/255, crops alpha≥16 bounds with a 3px source guard, preserves RGBA transparency, and resamples premultiplied color with Lanczos. No opaque matte or generative retouching is applied. The source ring eye positions straighten the shock through an 8x affine intermediate. The wheel's slight source ellipse is normalized to a circular 48px tread diameter within a 52px canvas. Runtime SHA-256, crops, center pivots and bottom contact anchors are recorded in `manifest.json`; `modules/mondpost_assets.lua` contains generated cosmetic dimensions. CI validates PNG CRC, RGBA format, exact dimensions/checksums and atlas membership without needing Pillow.

## Per-asset specification

All sprite pivots are canvas centers. Bottom anchors are in image pixels, with y downward. Placement offsets below are body/world design units and do not change collision shapes.

| Original | Runtime canvas | Pivot | Atlas | Use |
| --- | --- | --- | --- | --- |
| `vehicle/rover-chassis.png` | 180×48 | 90, 24 | vehicle | chassis at body (0,-7), visual only |
| `vehicle/rover-wheel.png` | 52×52 | 26, 26 | vehicle | tread circle centered, physical radius 24; both wheel bodies |
| `vehicle/rover-suspension.png` | 24×84 | 12, 42 | vehicle | eye centers (12,12) and (12,72); stretch between mounts |
| `vehicle/astronaut-driver.png` | 68×88 | 34, 44 | vehicle | body attachment (24,32); behind chassis |
| `vehicle/cargo-box.png` | 72×44 | 36, 22 | vehicle | body attachment (-38,33); behind chassis |
| `world/solar-station.png` | 160×148 | 80, 74 | world | bottom center at x=3230; decorative background only |
| `world/moon-rocks.png` | 160×80 | 80, 40 | world | center, beneath the collision surface |
| `world/ground-details.png` | 192×48 | 96, 24 | world | center, beneath the collision surface |
| `world/finish-flag.png` | 84×136 | 42, 68 | world | bottom center at existing finish x=3600 |
| `backgrounds/cratered-planet.png` | 384×384 | 192, 192 | backgrounds | center, far background; never collision |
| `backgrounds/mountains-far.png` | 1000×136 | 500, 68 | backgrounds | center; feathered overlapping mirrored cards |
| `backgrounds/mountains-near.png` | 1000×170 | 500, 85 | backgrounds | center; feathered overlapping mirrored cards |
| `backgrounds/star-sparkle.png` | 24×28 | 12, 14 | world | center; sparse background stars |
| `effects/moon-dust.png` | 64×48 | 32, 24 | world | center; bounded eight-sprite particle pool |
| `ui/pedal-brake.png` | 256×104 | 128, 52 | ui | center; separate 240x115 touch rectangle |
| `ui/pedal-gas.png` | 256×100 | 128, 50 | ui | center; separate 240x115 touch rectangle |
| `ui/button-pause.png` | 64×64 | 32, 32 | ui | center; icon in a 140x55 labelled GUI hit rectangle |
| `ui/button-restart.png` | 64×64 | 32, 32 | ui | center; icon in a 140x55 labelled GUI hit rectangle |

## Rover and physics separation

The previous 180×110 composite becomes a 180×48 chassis at body-local `(0,-7)`, driver at `(24,32)` and cargo at `(-38,33)`. This accommodates differently padded source parts while retaining the 180px vehicle footprint and physical wheelbase/radius. Chassis paints in front of the tires at extreme compression; driver/cargo are behind its foreground edge. Shock graphics are above the rotating wheels and behind the chassis, so coils remain readable. Wheel rotation comes directly from each original physical body; there is no animated height-following vehicle.

The real wheel joint's rest anchors coincide at body-local `(±57,-46)` and wheel center; its axis is `(0,1)`. A **38px cosmetic upper bracket along that same axis**, at `(±57,-8)`, makes a drawable shock. Its other eye follows the actual wheel center. Prepared eye centers `(12,12)` and `(12,72)` are 60px apart; the image stretches by actual span/60, not by canvas height. The tiny scale floor prevents a singular rendering transform; it imposes no mechanical travel stop. Body, wheel and joint parameters are unchanged. Driver/cargo/fenders are decorative silhouette overhangs, not new colliders.

## World, effects and touch

Mountain originals are not assumed seamless. Three overlapping cards per layer alternate mirroring and have 96px horizontal and 18px bottom feathers. There is no wrapping card teleport inside the fixed track. The planet and stars move slowly; rocks/details stay beneath the bright collision edge. The station has no collider, charging action or hint. The flag's computed bottom contact anchor is placed at the existing x=3600 finish.

Moon dust is a sprite-based particle effect: **eight preallocated sprites**, 0.36s lifetime, at most one spawn per 0.1s, alternating actual wheels with an individual 26px ground probe and speed >80px/s. Pause, focus loss, restart and finish clear it. It never applies force or introduces physical objects.

Pedals use **240×115 design-unit touch rectangles** independent of alpha padding and the shorter decorative plate. Labels are Defold GUI text in the existing English language. Pause/restart use source icons plus GUI labels; top controls have a 44px minimum browser hit height. Small-window text minima and compact tuning preserve readability/road visibility. Native density/cutout behavior still needs device review.

## Measured compiled texture budget

| Resource | Packed texture | Format/mips | Payload |
| --- | --- | --- | --- |
| Vehicle | 256×256 | RGBA, 1 | 262,144 B |
| World, stars and dust | 512×256 | RGBA, 1 | 524,288 B |
| Backgrounds | 1024×1024 | RGBA, 1 | 4,194,304 B |
| UI | 512×256 | RGBA, 1 | 524,288 B |
| Utility pixel/legacy collider sprite | 64×64 | RGBA, 1 | 16,384 B |
| Soil | 128×128 | RGBA, 1 | 65,536 B |

Total: **5,586,944 B / 5.328 MiB**. These are compiled texture payloads, excluding font cache, framebuffers, driver overhead and engine memory; they are not device VRAM/FPS measurements. `tools/TextureBudget.java` checks every build: ordinary single-page 2D textures, ≤2048 per dimension, ≤8 MiB aggregate. Explicit atlas page-size fields produce arrays even with one page in this SDK and were removed for compatibility with the existing materials. No engine, action or dependency versions were changed.

94 allocated scene sprites (including the inactive dust pool and disabled collider-slab sprites), at most 99 during deferred rover replacement, fit the existing 128-sprite limit. GUI remains below its 256-node limit. [Comparisons and test evidence](../../../docs/asset-integration/README.md) distinguish browser/touch emulation from real-device acceptance.
