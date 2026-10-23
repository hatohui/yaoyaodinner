FROM oven/bun:1-debian AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun x prisma generate
RUN bun run build

# ──────────────────────────────────────────────────────────────────

# A fresh install: `--production` over an existing node_modules leaves the
# dev dependencies in place, and bun adds peers by default, which pulls the
# prisma CLI and typescript back in through @prisma/client.
FROM oven/bun:1-debian AS deps

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production --omit=peer --ignore-scripts

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# The generated client bundles its own Postgres query compiler, so the runtime
# copies for every other database, source maps and unused fonts are dead weight.
RUN cd node_modules \
    && find @prisma/client/runtime -name 'query_compiler_*' -delete \
    && find @prisma/client/runtime -name 'wasm-compiler-edge*' -delete \
    && find . -name '*.map' -delete \
    && find figlet/fonts -type f ! -name 'Standard.flf' -delete \
    && rm -rf figlet/importable-fonts

# ──────────────────────────────────────────────────────────────────

FROM node:20-alpine

COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:1.0.1 /lambda-adapter /opt/extensions/lambda-adapter

WORKDIR /var/task

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "dist/main.js"]
