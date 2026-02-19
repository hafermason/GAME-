#!/bin/bash
set -euo pipefail

# Only run in remote Claude Code on the web sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install htmlhint for HTML linting (uses npm global cache for speed)
npm install -g htmlhint --prefer-offline 2>/dev/null || npm install -g htmlhint
