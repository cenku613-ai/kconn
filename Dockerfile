FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsup.config.ts ./
COPY src/ src/
RUN npx tsup

FROM node:24-alpine
RUN addgroup -g 1001 kconn && \
    adduser -u 1001 -G kconn -s /bin/sh -D kconn
WORKDIR /app
COPY --from=builder /app/dist/ dist/
COPY --from=builder /app/package.json package.json
COPY --from=builder /app/package-lock.json package-lock.json
RUN npm ci --omit=dev && \
    npm cache clean --force && \
    rm -rf /usr/local/lib/node_modules/npm && \
    rm -rf /root/.npm
USER kconn
ENTRYPOINT ["node", "dist/index.js"]
