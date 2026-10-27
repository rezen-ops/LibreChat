#!/bin/sh
set -e

# A Railway volume mounts root-owned and masks whatever ownership the image
# gave the directory, so the unprivileged `node` user cannot create the per-user
# upload folders underneath it. The mount only exists at runtime, so this is the
# first moment the ownership can be corrected.
#
# Privileges are dropped immediately afterwards: the app itself never runs as
# root. `exec` keeps PID 1 so signals and shutdown still reach node.
if [ -d /app/uploads ]; then
  chown node:node /app/uploads || true
  # Only the directories LibreChat creates under the mount, not a blind -R over
  # every uploaded file, which would scale with the corpus on every boot.
  for d in /app/uploads/temp /app/uploads/images; do
    mkdir -p "$d" && chown node:node "$d" || true
  done
fi

exec su-exec node "$@"
