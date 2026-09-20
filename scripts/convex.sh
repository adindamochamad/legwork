#!/usr/bin/env bash
# Convex "use node" actions require Node 20, 22, or 24. Homebrew's default node
# may be newer (e.g. v26); prefer node@22 when installed.
if [[ -x /opt/homebrew/opt/node@22/bin/node ]]; then
  export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
elif [[ -x /usr/local/opt/node@22/bin/node ]]; then
  export PATH="/usr/local/opt/node@22/bin:$PATH"
fi
exec npx convex "$@"
