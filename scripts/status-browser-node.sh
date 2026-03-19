#!/usr/bin/env bash
set -euo pipefail

echo "== mac local tunnel =="
if nc -vz 127.0.0.1 14535 2>&1; then
  echo
else
  echo
fi

echo "== listener owning 14535 =="
lsof -nP -iTCP:14535 -sTCP:LISTEN || true

echo
printf '== launchctl ssh-tunnel ==\n'
launchctl print gui/$UID/com.openclaw.ssh-tunnel 2>/dev/null | grep -E 'path =|state =|last exit code|program =' || true

echo
printf '== launchctl node-host ==\n'
launchctl print gui/$UID/com.openclaw.node-host 2>/dev/null | grep -E 'path =|state =|last exit code|program =' || true

echo
printf '== recent ssh-tunnel errors ==\n'
tail -n 10 /tmp/openclaw-ssh-tunnel-error.log 2>/dev/null || true

echo
printf '== recent node-host errors ==\n'
tail -n 10 /tmp/openclaw-node-host-error.log 2>/dev/null || true

echo
printf '== VPS view ==\n'
ssh root@srv882799.hstgr.cloud 'openclaw nodes status' || true
