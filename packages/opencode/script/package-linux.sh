#!/usr/bin/env bash
#
# Package the prebuilt `zeth` Linux binary into a .deb and an .AppImage.
#
# Usage: package-linux.sh <arch: x64|arm64> <version>
#
# Prerequisites:
#   - The binary already exists at
#     packages/opencode/dist/zethcode-linux-<arch>/bin/zeth
#   - Run from the repository root.
#
set -euo pipefail

ARCH="${1:?usage: package-linux.sh <x64|arm64> <version>}"
VERSION="${2:?usage: package-linux.sh <arch> <version>}"

# Map the build arch to the arch strings each format expects.
case "$ARCH" in
  x64)   DEB_ARCH="amd64";   APPIMAGE_ARCH="x86_64" ;;
  arm64) DEB_ARCH="arm64";   APPIMAGE_ARCH="aarch64" ;;
  *) echo "error: unsupported arch '$ARCH' (expected x64 or arm64)"; exit 1 ;;
esac

PKG_NAME="zethcode"
MAINTAINER="ZethRise <hello@zethrise.com>"
DESC="Terminal-native AI coding assistant"
HOMEPAGE="https://github.com/ZethRise/ZethCode"

REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
DIST_DIR="${REPO_ROOT}/packages/opencode/dist"
BINARY="${DIST_DIR}/zethcode-linux-${ARCH}/bin/zeth"

ICON_512="${REPO_ROOT}/packages/identity/mark-512x512.png"
ICON_192="${REPO_ROOT}/packages/identity/mark-192x192.png"

if [ ! -f "$BINARY" ]; then
  echo "error: binary not found at $BINARY"
  echo "did you run script/build.ts --os=linux --arch=${ARCH} first?"
  exit 1
fi
for icon in "$ICON_512" "$ICON_192"; do
  if [ ! -f "$icon" ]; then
    echo "error: missing icon $icon"
    exit 1
  fi
done

DESKTOP_ENTRY="[Desktop Entry]
Name=Zeth Code
Comment=${DESC}
Exec=zeth
Icon=${PKG_NAME}
Terminal=true
Type=Application
Categories=Development;Utility;"

# -----------------------------------------------------------------------------
# .deb
# -----------------------------------------------------------------------------
echo "==> Building .deb for ${ARCH} (${DEB_ARCH})"

DEB_ROOT="${DIST_DIR}/deb-${ARCH}"
rm -rf "$DEB_ROOT"
mkdir -p "$DEB_ROOT/DEBIAN" \
         "$DEB_ROOT/usr/bin" \
         "$DEB_ROOT/usr/share/applications" \
         "$DEB_ROOT/usr/share/icons/hicolor/512x512/apps" \
         "$DEB_ROOT/usr/share/icons/hicolor/192x192/apps"

install -m 0755 "$BINARY" "$DEB_ROOT/usr/bin/zeth"
cp "$ICON_512" "$DEB_ROOT/usr/share/icons/hicolor/512x512/apps/${PKG_NAME}.png"
cp "$ICON_192" "$DEB_ROOT/usr/share/icons/hicolor/192x192/apps/${PKG_NAME}.png"
printf '%s\n' "$DESKTOP_ENTRY" > "$DEB_ROOT/usr/share/applications/${PKG_NAME}.desktop"

# Installed-Size is in KiB, as dpkg expects.
INSTALLED_SIZE="$(du -sk "$DEB_ROOT/usr" | cut -f1)"

cat > "$DEB_ROOT/DEBIAN/control" <<EOF
Package: ${PKG_NAME}
Version: ${VERSION}
Section: devel
Priority: optional
Architecture: ${DEB_ARCH}
Installed-Size: ${INSTALLED_SIZE}
Maintainer: ${MAINTAINER}
Homepage: ${HOMEPAGE}
Description: ${DESC}
 Zeth Code is a terminal-native AI coding assistant for local
 developer workflows. It reads and edits code, runs commands,
 manages Git, and preserves project memory across sessions.
EOF
chmod 0644 "$DEB_ROOT/DEBIAN/control"

DEB_OUT="${DIST_DIR}/zethcode-linux-${ARCH}.deb"
# --root-owner-group makes every entry root:root without needing fakeroot.
dpkg-deb --build --root-owner-group "$DEB_ROOT" "$DEB_OUT"
echo "    -> $DEB_OUT"

# -----------------------------------------------------------------------------
# .AppImage
# -----------------------------------------------------------------------------
echo "==> Building .AppImage for ${ARCH} (${APPIMAGE_ARCH})"

APPDIR="${DIST_DIR}/AppDir-${ARCH}"
rm -rf "$APPDIR"
mkdir -p "$APPDIR/usr/bin" \
         "$APPDIR/usr/share/applications" \
         "$APPDIR/usr/share/icons/hicolor/512x512/apps" \
         "$APPDIR/usr/share/icons/hicolor/192x192/apps"

install -m 0755 "$BINARY" "$APPDIR/usr/bin/zeth"
cp "$ICON_512" "$APPDIR/usr/share/icons/hicolor/512x512/apps/${PKG_NAME}.png"
cp "$ICON_192" "$APPDIR/usr/share/icons/hicolor/192x192/apps/${PKG_NAME}.png"
# appimagetool reads the .desktop from the AppDir root.
printf '%s\n' "$DESKTOP_ENTRY" > "$APPDIR/${PKG_NAME}.desktop"
# .DirIcon is the fallback icon some file managers read.
cp "$ICON_192" "$APPDIR/.DirIcon"

# AppRun: tiny launcher that execs the packaged binary with the caller's args.
cat > "$APPDIR/AppRun" <<'RUN'
#!/usr/bin/env bash
set -e
HERE="$(dirname "$(readlink -f "${0}")")"
exec "${HERE}/usr/bin/zeth" "$@"
RUN
chmod 0755 "$APPDIR/AppRun"

# appimagetool is itself an AppImage. GitHub runners lack /dev/fuse, so we
# extract it and run the inner AppRun directly (no FUSE required).
APPIMAGETOOL_URL="https://github.com/AppImage/appimagetool/releases/download/continuous/appimagetool-${APPIMAGE_ARCH}.AppImage"
TOOL_DIR="${DIST_DIR}/.appimagetool-${ARCH}"
rm -rf "$TOOL_DIR"
mkdir -p "$TOOL_DIR"
echo "    downloading appimagetool (${APPIMAGE_ARCH})..."
curl -fsSL "$APPIMAGETOOL_URL" -o "$TOOL_DIR/appimagetool"
chmod +x "$TOOL_DIR/appimagetool"
( cd "$TOOL_DIR" && ./appimagetool --appimage-extract >/dev/null )

APPIMAGE_OUT="${DIST_DIR}/zethcode-linux-${ARCH}.AppImage"
# ARCH tells appimagetool which runtime to embed; --no-appstream skips
# AppStream validation (needs appstreamcli); --no-sign skips GPG signing.
ARCH="${APPIMAGE_ARCH}" NO_STRIP=true \
  "$TOOL_DIR/squashfs-root/AppRun" "$APPDIR" "$APPIMAGE_OUT" \
  --no-appstream --no-sign
echo "    -> $APPIMAGE_OUT"

echo "==> done"
