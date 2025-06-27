#!/bin/sh
set -e

cd /app
yarn workspace @repo/db db:generate

exec yarn workspace web start