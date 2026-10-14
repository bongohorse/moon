# Working on MOON

- Use Defold 1.14.0 stable, Lua and integrated Box2D 3.1.0. No Phaser, Capacitor or web wrapper game implementations.
- This task is isolated; work in the existing checkout. Do not create worktrees unless asked.
- The owner explicitly authorized the longer rounded route, collectible stars, batteries and solar charging in issue #16. Stop after this scope for owner acceptance; no deliveries, upgrades or further progression automatically.
- Code, documentation, issues and PRs are English. Owner-facing status is German.
- Keep vehicle bodies physical. Never animate the chassis along a height function.
- Keep tunables in modules/config.lua. Brake wins over gas. Reset every input source on pause, restart and focus loss.
- Explicitly wake the chassis and both wheels on effective pedal changes; Box2D 3 motor setters do not reliably wake sleeping islands. Cold-start and parked-solar tests must wait for physical sleep before gas.
- Edit route knots in tools/build_level.py and regenerate the shared collision/render data; run its --check mode before committing. Keep nearby collider windows and star/dust pools bounded.
- Use fixed_update for forces and motors. Preserve the 60 Hz fixed step and 0.05 s hitch cap.
- Create wheel joints through b2d.joint with enable_spring=true; destroy their handles before deleting bodies. Low-level joint torque and force inputs compensate for physics.scale=0.01. Recheck these conversions on backend updates.
- Physics/render/GUI share Lua state intentionally. Do not remove script.shared_state without replacing the communication mechanism.
- Use original locally bundled sprite assets. References are visual guidance, never flattened game backgrounds. Do not invent asset licenses.
- Run npm ci, npm test, npm run validate:renovate, tools/build.sh wasm-web debug and browser tests for behavior changes. Build release HTML5 and debug Android before merging engine/toolchain changes.
- Check tools/defold-version.env checksums against official release metadata. Never bypass verification.
- Use small reviewable PRs. Merge only after required checks pass. Never commit credentials, signing keys or generated bundles.
- Record actual test scope. Headless Chromium and emulated touch do not establish Android/iOS device behavior or 60 FPS.
