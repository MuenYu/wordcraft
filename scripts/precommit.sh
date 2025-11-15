set -euo pipefail

bun run lint --fix
bun run check-types
bun run format

echo 'All checks passed. Ready to commit!'
