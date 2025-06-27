   #!/bin/sh
  #  set -e

   cd /app
   echo "Running migrations..."
    yarn workspace @repo/db db:deploy
   echo "Starting API server..."
   exec node apps/api/dist/server.js