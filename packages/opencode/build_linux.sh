#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."
bun run ./packages/opencode/script/build.ts --os=linux --arch=x64
