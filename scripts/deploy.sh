#!/usr/bin/env bash
# Deploy mini-notion.
#   scripts/deploy.sh backend   -> hashbang (ssh alias "hb"), served at /mini-notion-backend/
#   scripts/deploy.sh frontend  -> Cloudflare Pages project "mini-notion"
set -euo pipefail
cd "$(dirname "$0")/.."

BACKEND_URL=https://geeky1.de1.hashbang.sh/mini-notion-backend

deploy_backend() {
	pnpm --filter backend build

	# The server's 512 MiB memory limit can't run npm install, so build a flat
	# production node_modules here (all deps are pure JS) and copy it over.
	mkdir -p .deploy/backend
	cp backend/package.json .deploy/backend/
	(cd .deploy/backend && npm install --omit=dev --no-audit --no-fund --loglevel=error)

	rsync -az --delete backend/dist/ hb:app/dist/
	rsync -az --delete .deploy/backend/node_modules/ hb:app/node_modules/
	rsync -az backend/package.json hb:app/

	(cd backend && npx prisma migrate deploy)

	ssh hb 'export XDG_RUNTIME_DIR=/run/user/$(id -u); systemctl --user restart mini-notion'
	sleep 3
	# Expect 401: the API is up and wants a login.
	curl -s -o /dev/null -w "backend check: %{http_code} (expect 401)\n" "$BACKEND_URL/api/notes"
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
