#!/usr/bin/env bash
# Deploy mini-notion.
#   scripts/deploy.sh backend   -> OCI VM kelvin-first-instance, served at mini-notion-api.kelvin.us.ci
#   scripts/deploy.sh frontend  -> Cloudflare Pages project "mini-notion"
set -euo pipefail
cd "$(dirname "$0")/.."

BACKEND_URL=https://mini-notion-api.kelvin.us.ci
VM=ubuntu@168.110.208.75
SSH="ssh -i $HOME/.ssh/hashbang_key"

deploy_backend() {
	pnpm --filter backend build

	# Build a flat production node_modules here (all deps are pure JS) and copy it over.
	mkdir -p .deploy/backend
	cp backend/package.json .deploy/backend/
	(cd .deploy/backend && npm install --omit=dev --no-audit --no-fund --loglevel=error)

	rsync -az --delete -e "$SSH" backend/dist/ $VM:mini-notion/dist/
	rsync -az --delete -e "$SSH" .deploy/backend/node_modules/ $VM:mini-notion/node_modules/
	rsync -az -e "$SSH" backend/package.json $VM:mini-notion/

	(cd backend && npx prisma migrate deploy)

	$SSH $VM 'sudo systemctl restart mini-notion'
	# Expect 401: the API is up and wants a login. Startup takes a few seconds.
	for _ in $(seq 30); do
		code=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/notes")
		[ "$code" = 401 ] && break
		sleep 1
	done
	echo "backend check: $code (expect 401)"
}

deploy_frontend() {
	# Empty API URL = same origin; functions/ proxies /api and /socket.io to the backend.
	(cd frontend && VITE_API_URL="" pnpm build)
	(cd frontend && npx wrangler pages deploy dist --project-name mini-notion --branch main --commit-dirty=true)
}

case "${1:-}" in
	backend) deploy_backend ;;
	frontend) deploy_frontend ;;
	*) echo "usage: $0 backend|frontend" >&2; exit 1 ;;
esac
