FROM node:20

WORKDIR /usr/src/app

COPY ./ ./

RUN corepack enable pnpm

RUN pnpm install
RUN npm install -g @prisma/client && cd packages/backend/prisma && npx prisma generate
RUN pnpm run build

ENTRYPOINT [ "pnpm", "run", "dev" ]