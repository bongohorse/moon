#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source tools/defold-version.env
platform="${1:-wasm-web}"
variant="${2:-release}"
cache="${MOON_TOOLCHAIN_DIR:-$PWD/.cache/toolchain}"
mkdir -p "$cache"
bob="$cache/bob-$DEFOLD_VERSION.jar"
if [[ ! -f "$bob" ]]; then
  curl --fail --location --silent --show-error "https://github.com/defold/defold/releases/download/$DEFOLD_VERSION/bob.jar" -o "$bob.part"
  printf '%s  %s\n' "$BOB_SHA256" "$bob.part" | sha256sum --check --status
  mv "$bob.part" "$bob"
fi
printf '%s  %s\n' "$BOB_SHA256" "$bob" | sha256sum --check --status
case "$platform" in
  wasm-web) architectures=wasm-web ;;
  arm64-android) architectures=arm64-android ;;
  x86_64-linux) architectures=x86_64-linux ;;
  *) echo "Unsupported build target: $platform" >&2; exit 2 ;;
esac
command=(java -jar "$bob")
if [[ -n "${HTTPS_PROXY:-}" ]]; then
  command=(python3 tools/with_build_proxy.py "${command[@]}")
fi
"${command[@]}" --platform "$platform" --architectures "$architectures" --variant "$variant" --archive --max-cpu-threads 3 --bundle-output "dist/$platform" resolve build bundle

# Ordinary 2D atlases work with the existing sprite/GUI materials; validate compiled output.
java -cp "$bob" tools/TextureBudget.java \
  build/default/assets/mondpost-vehicle.texturec build/default/assets/mondpost-world.texturec \
  build/default/assets/mondpost-backgrounds.texturec build/default/assets/mondpost-ui.texturec \
  build/default/assets/moon.texturec build/default/assets/soil.texturec build/default/assets/pixel.texturec
