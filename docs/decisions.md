# Phase-one decisions

## Engine and physics

Defold **1.14.0 stable**, published 12 October 2026. Bob reports engine commit `a81dbb0478e8b73931dc2d671563204f6ac0ef82` and channel `stable`. Java 25 is required. Toolchain version and official GitHub release asset SHA-256 live in `tools/defold-version.env`.

Use the built-in default **legacy Box2D 2.2.1** backend. The running debug engine explicitly reports this version. No extension, alpha engine or external physics library is needed. Box2D 3 is deliberately deferred because changing backends can change contact and vehicle behavior. The absence of an overriding app manifest selects the documented legacy default; the browser smoke check verifies the runtime backend.

Version-specific API evidence:

- [1.14.0 physics bindings](https://github.com/defold/defold/blob/1.14.0/engine/gamesys/src/gamesys/scripts/script_physics.cpp): `physics.JOINT_TYPE_WHEEL`, `create_joint`, `set_joint_properties`; properties `local_axis_a`, `enable_motor`, `motor_speed`, `max_motor_torque`, `frequency`, `damping`.
- [Legacy fixture bindings](https://github.com/defold/defold/blob/1.14.0/engine/gamesys/src/gamesys/scripts/box2d/v2/script_box2d_fixture_v2.cpp): `b2d.fixture.set_friction(body, fixture_index, friction)`. Called on freshly spawned tires before contact.
- [Box2D body lookup](https://github.com/defold/defold/blob/1.14.0/engine/gamesys/src/gamesys/scripts/box2d/script_box2d.cpp): `b2d.get_body(collision_object_url)`.
- [Window bindings](https://github.com/defold/defold/blob/1.14.0/engine/gamesys/src/gamesys/scripts/script_window.cpp): focus events and `window.get_safe_area()`.

Official manuals consulted: [Bob builds](https://defold.com/manuals/bob/), [HTML5](https://defold.com/manuals/html5/), [Android](https://defold.com/manuals/android/), [physics](https://defold.com/manuals/physics/), [joints](https://defold.com/manuals/physics-joints/), [touch](https://defold.com/manuals/input-mouse-and-touch/).

## Driving and lifecycle

Three dynamic bodies, two wheel joints and 15 static track slabs. Pixel-to-meter scale 0.01; base gravity 480 px/s² (4.8 m/s²), with arcade tuning rather than literal lunar gravity. Wheel motor angular speed is rad/s; motor/brake torque is N·m; spring tuning is Hz and damping ratio. Grip is fixture friction. Air control applies a physical force couple, limited to angular speed 2.5 rad/s. A tunable-strength feedback assist targets +0.35 rad nose-up under gas and -0.35 rad under brake, with angular damping; this keeps held pedals from continuously flipping the rover. Coasting provides no air torque. Both pedals pressed means brake wins and nose-down air input. Coasting disables wheel motors.

Physics runs at 60 Hz; engine `max_time_step=0.05` discards excess hitch time, bounding catch-up to roughly three fixed steps per render update. Focus loss disables rover bodies and clears input. Resume is explicit, with no wall-clock catch-up. Bodies are re-created on restart, destroying old joints first. All tuning is staged until an explicitly labeled restart, including friction to avoid stale cached contacts.

The render projection keeps world height at 720 units and reveals more terrain on wide screens. Camera offset places the rover near the left third at 16:9, with exponential follow and no spring overshoot. UI uses actual window size and platform safe-area insets; landscape is the intended orientation. Atlas sprites, 3 active dynamic bodies, small static geometry and no particles aim for 60 FPS; this is not a device performance claim. All gameplay assets are bundled and use no network services. A first browser load requires HTTP access; persistent offline reloading is not implemented in this phase.

## Licensing and references

No project license was supplied. Licensing remains an owner decision. Generated rover, wheel, terrain and ridge sprites are original placeholders; no third-party asset licenses are asserted. Concept images were not attached as accessible files in this conversation. `assets/` therefore follows the described navy/violet, cream/orange and cyan palette, but fidelity to unseen images requires owner review. Add accessible originals under `docs/references/` with provenance before visual acceptance.

## Renovate

Supported managers only: npm, GitHub Actions, custom regex with github-releases datasource for `defold/defold`. Stable numeric versions only. No automerge, and major updates require dashboard approval. Engine PRs must manually update the checksum from authoritative release metadata; stale checksums intentionally fail builds. Required repository CI applies to update PRs. The custom extractor is validated locally by invoking Renovate’s own extraction function with RE2 and schema validation. The installed bot must still run in GitHub to confirm its app permissions/onboarding state.
