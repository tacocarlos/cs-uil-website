#!/bin/sh
# Vercel's build command (see buildCommand in vercel.json).
#
# Production builds apply pending database migrations first, while the
# previous deployment is still serving traffic, so migrations must keep
# working with the old code: add columns/tables in one deploy, remove old
# ones in a later one. Preview builds never migrate.
set -e

if [ "$VERCEL_ENV" = "production" ]; then
    echo "Applying database migrations"
    drizzle-kit migrate
fi

next build
