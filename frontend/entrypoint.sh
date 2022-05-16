#!/bin/bash
set -e

yarn install

# Start webpacker dev if in dev
if [ "$RAILS_ENV" == "development" ]; then
    ./bin/webpack-dev-server &
fi

# Remove a potentially pre-existing server.pid for Rails.
rm -f /app/tmp/pids/server.pid

# Then exec the container's main process (what's set as CMD in the Dockerfile).
exec "$@"
