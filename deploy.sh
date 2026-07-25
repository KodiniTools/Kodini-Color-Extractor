#!/usr/bin/env bash
#
# Deploy the Kodini Color Extractor to the production web root.
#
# Usage:
#   ./deploy.sh
#
# What it does (in order):
#   1. Pull the latest code for the deploy branch (skip with NO_PULL=1)
#   2. Install dependencies reproducibly (npm ci)
#   3. Build the production bundle (npm run build -> dist/)
#   4. Mirror dist/ into the web root with rsync --delete
#
# The web root matches Vite's base path (/kodini-color-extractor/), so the
# built asset URLs line up with the target folder automatically.
#
# Environment overrides:
#   DEPLOY_DIR    Target web root
#                 (default: /var/www/kodinitools.com/kodini-color-extractor)
#   BRANCH        Git branch to deploy (default: main)
#   NO_PULL=1     Skip git fetch/checkout/pull; build the current checkout
#   DEPLOY_OWNER  chown the deployed files to this user:group afterwards,
#                 e.g. DEPLOY_OWNER=www-data:www-data
#
# The build runs as the current user; only the copy into the web root is
# escalated with sudo when that folder is not writable by you.

set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/var/www/kodinitools.com/kodini-color-extractor}"
BRANCH="${BRANCH:-main}"

# Refuse to deploy into an unsafe target (the mirror step deletes its contents).
if [ -z "$DEPLOY_DIR" ] || [ "$DEPLOY_DIR" = "/" ]; then
  echo "✗ Refusing to deploy: DEPLOY_DIR is unsafe ('$DEPLOY_DIR')." >&2
  exit 1
fi

# Always operate from the repository root (this script's directory).
cd "$(dirname "$0")"

echo "▶ Kodini Color Extractor — deploy"
echo "  repo:   $(pwd)"
echo "  branch: $BRANCH"
echo "  target: $DEPLOY_DIR"

# 1. Update source ----------------------------------------------------------
if [ "${NO_PULL:-0}" != "1" ]; then
  echo "▶ Fetching latest '$BRANCH'…"
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
fi

# 2. Install dependencies ---------------------------------------------------
echo "▶ Installing dependencies (npm ci)…"
npm ci

# 3. Build ------------------------------------------------------------------
echo "▶ Building production bundle…"
npm run build

# 4. Deploy -----------------------------------------------------------------
# Escalate only the file-copy steps if the web root is not writable by us.
SUDO=""
if [ "$(id -u)" -ne 0 ] && ! mkdir -p "$DEPLOY_DIR" 2>/dev/null; then
  SUDO="sudo"
fi

echo "▶ Deploying to $DEPLOY_DIR…"
$SUDO mkdir -p "$DEPLOY_DIR"
if command -v rsync >/dev/null 2>&1; then
  $SUDO rsync -a --delete dist/ "$DEPLOY_DIR/"
else
  # Fallback without rsync: clear the target's contents, then copy dist/ in.
  $SUDO find "$DEPLOY_DIR" -mindepth 1 -delete
  $SUDO cp -a dist/. "$DEPLOY_DIR/"
fi

# 5. Optional ownership fix -------------------------------------------------
if [ -n "${DEPLOY_OWNER:-}" ]; then
  echo "▶ Setting owner to $DEPLOY_OWNER…"
  $SUDO chown -R "$DEPLOY_OWNER" "$DEPLOY_DIR"
fi

echo "✓ Deploy complete."
