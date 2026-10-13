# MOON / Mondpost

A small landscape lunar driving prototype using **Defold 1.14.0 stable**, **Lua**, integrated **Box2D 3.1.0**, atlas sprites and Defold GUI. Android is primary; HTML5 provides an accessible test build. iOS input/safe areas are considered, with no iOS build in phase one.

**Play:** https://bongohorse.github.io/moon/

## Run and develop

Open `game.project` in the matching stable Defold editor and choose Project → Build. Or use Java 25, Node 24 LTS (CI pins 24.21.0) and Python 3 for reproducible command-line checks:

```sh
npm ci
npm test
npm run validate:renovate
node tests/extraction.cjs
tools/build.sh wasm-web debug
npm run test:browser
```

The browser test installs Chromium separately with `npx playwright install chromium`; a system Chromium can be selected with `CHROMIUM_PATH=/usr/bin/chromium`, but the managed Headless Shell matches CI and is recommended for acceptance checks. For manual HTML5 testing:

```sh
python3 -m http.server 8000 --directory dist/wasm-web/MOON
```

Open the server locally in a browser. Builds are self-contained, including engine, atlas, fonts and all game data. Paths are relative, including deployment under `/moon/`.

## Drive

- **D / right arrow:** gas. **A / left arrow:** brake.
- Touch: large **BRAKE** pedal left, **GAS** pedal right. Two fingers supported; brake wins when both are held.
- In air, gas raises the nose and brake lowers it, with bounded torque and documented tilt assistance.
- **Space / Pause:** pause or resume. **R / Restart:** immediate fresh rover.
- Focus loss/app switch pauses and resets inputs. Resume explicitly.
- **Tuning +** opens the top panel. Adjust eight bounded settings. **Apply + Restart** applies them; **Defaults** stages the baseline again. All changes require restart.
- Drive from the flat start over hills, ramp, shallow crater and broad landing area to the cyan finish marker. Acceptance is about controllable jumps, suspension travel and landing feel.

## Builds and CI

```sh
tools/build.sh wasm-web release
tools/build.sh arm64-android debug
tools/build.sh x86_64-linux debug
```

Outputs are in `dist/<platform>/MOON/`. Bob is downloaded from the official release and checked against the pinned SHA-256. The explicit Box2D 3 app manifest requires Defold’s official native build service (`build.defold.com`). On cloud machines with `HTTPS_PROXY`, the build script uses a loopback bridge because Bob’s native client ignores that variable; upstream TLS verification remains enabled. No local Android SDK is required for the tested Bob debug APK build. This phase uses a generated **debug** key only, never store/release signing. Keep keys/password files ignored.

[Build workflow and downloadable Android APK](https://github.com/bongohorse/moon/actions/workflows/build.yml): artifacts are named `moon-arm64-android` and retained 14 days. The zip contains `MOON.apk`; sideload only on a suitable ARM64 Android test device. CI validates Lua logic and Renovate, builds release HTML5/debug Android, and runs a debug HTML5 physics smoke test before Pages deployment. Action SHAs, Node and Java versions are pinned. No native extensions or external asset CDN is used.

## Layout

- `main/`: start scene, resources, renderer and Defold GUI.
- `modules/`: vehicle, terrain, input, camera, shared state and central physics configuration.
- `assets/`: original modular rover/wheel/terrain/ridge sprites in one atlas.
- `tests/`: independent Lua logic, actual Renovate extraction and Chromium functional tests.
- `tools/`: pinned checksum-verified Defold build script.
- `docs/`: [decisions/API evidence](docs/decisions.md), [phase plan](docs/plan.md), [validation](docs/validation.md), reference access record.

## Boundaries

Phase one ends at owner acceptance. No battery/delivery/progression mechanics or further gameplay phases are started. The concept images were not technically accessible; visual fidelity needs review once the originals are supplied. No project/asset license was selected by the owner; licensing remains open.

60 FPS is a target, not a measured mobile guarantee. Automated headless Chromium and emulated touch are separate from manual desktop control and real-device testing. No Android/iOS device was attached; no device installation or device acceptance is claimed. See the validation record for actual evidence and remaining limits.
