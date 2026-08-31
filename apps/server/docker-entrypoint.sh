#!/bin/sh
set -e

# Start as root to self-heal the data directory ownership, then drop
# privileges to `node` for the server process. Docker creates missing
# host-bind directories as root:root, which would otherwise make SQLite
# fail with SQLITE_CANTOPEN (the app runs as uid 1000).
if [ "$(id -u)" = "0" ]; then
  mkdir -p /app/data
  chown node:node /app/data
  exec su-exec node:node "$@"
fi

exec "$@"
