# Owner's Mondpost visual references

Both original chat attachments were visually inspected on 13 October 2026 before this correction. They have no accessible local file, downloadable attachment ID or URL in this environment. Original pixels could not be archived here. This is an access limitation, not a claim that the references were unseen. No screenshot or generated reconstruction is presented as an original.

1. **Gameplay view:** landscape composition with a chunky orange/cream rover at the left third, closed orange parcel with white cube, astronaut's blue/cyan visor, treaded dark wheels and articulated suspension. A thin bright rim outlines violet rocky terrain above its textured cross-section; several angular distant layers sit under a sparse navy starfield and large cratered moon. A small upper HUD and broad tactile lower pedals leave the driving corridor visible. A distant solar station is scenery.
2. **Four-panel design sheet:** driving, jumping, detailed vehicle and world/UI studies. The vehicle study clarifies the closed box, cream suit, tire tread, orange hubs and exposed coil springs. The world study shows hills, crater, broad landing ground, pedal contours and palette: space `#10152F`, distance `#484478`, ground `#ACA6D2`, rover `#F6A044`, accent `#78DCE8`.

The gameplay view is the primary composition guide. References are design guidance, not backgrounds or extracted game assets. Battery and delivery examples are outside phase-one mechanics. UI remains consistently English, as in the existing prototype.

## Asset provenance

New artwork is original procedural illustration authored for this repository in `tools/generate_art.py`, using Pillow shapes, seeded textures and 4x supersampling. It does not read or edit concept-image pixels. Rover, wheels, coil springs, moon, layered ridges, rocks and pedal/panel plates are separate local PNGs. Their generation procedure is committed; Pillow is an authoring tool, not a runtime or added npm dependency. Regeneration: `python3 tools/generate_art.py` in an environment with Pillow.

`assets/terrain.buffer` is a generated closed triangle mesh following the unchanged `modules/terrain.lua` points. Its soil texture is separate from collision slabs. The generator writes the buffer too. The exact surface is marked by continuous overlapping 3px cosmetic lines.

The unmodified **DejaVu Sans Bold** font is locally bundled from the environment's DejaVu distribution. Its real copyright and Bitstream Vera permissions are retained in `assets/fonts/NOTICE.txt`; project/artwork licensing remains an owner decision. No rights are inferred for the owner's reference images. Existing Defold built-in shaders/material conventions retain their upstream license.
