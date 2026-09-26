# Backend image for Koyeb. Built from the repo root because the backend imports from ../shared.
FROM node:24-slim

RUN npm install -g pnpm@10.33.2

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile
RUN cd backend && npx prisma generate && pnpm build

WORKDIR /app/backend
ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000

CMD ["node", "dist/backend/src/main.js"]
