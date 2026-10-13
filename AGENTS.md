# Working on MOON

- Use Defold 1.14.0 stable, Lua and integrated legacy Box2D 2.2.1. No Phaser, Capacitor or web wrapper game implementations.
- This task is isolated; work in the existing checkout. Do not create worktrees unless asked.
- Phase 1 ends at owner acceptance. Do not implement deliveries, batteries, progression or later gameplay automatically.
- Code, documentation, issues and PRs are English. Owner-facing status is German.
- Keep vehicle bodies physical. Never animate the chassis along a height function.
- Keep tunables in modules/config.lua. Brake wins over gas. Reset every input source on pause, restart and focus loss.
- Use fixed_update for forces and motors. Preserve the 60 Hz fixed step and 0.05 s hitch cap.
- Legacy Wheel Joint updates must include axis, frequency and damping; partial property tables reset omitted properties.
- Physics/render/GUI share Lua state intentionally. Do not remove script.shared_state without replacing the communication mechanism.
- Use original locally bundled sprite assets. References are visual guidance, never flattened game backgrounds. Do not invent asset licenses.
- Run npm ci, npm test, npm run validate:renovate, tools/build.sh wasm-web debug and browser tests for behavior changes. Build release HTML5 and debug Android before merging engine/toolchain changes.
- Check tools/defold-version.env checksums against official release metadata. Never bypass verification.
- Use small reviewable PRs. Merge only after required checks pass. Never commit credentials, signing keys or generated bundles.
- Record actual test scope. Headless Chromium and emulated touch do not establish Android/iOS device behavior or 60 FPS.
