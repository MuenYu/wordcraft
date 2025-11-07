set -euo pipefail

bun run lint
bun run check-types
bun run format

echo 'All checks passed. Ready to commit!'
