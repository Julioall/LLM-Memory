FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runner
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8787
ENV DATA_DIR=/app/data
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY openapi ./openapi
COPY docs ./docs
RUN mkdir -p /app/data/docs /app/data/versions /app/data/trash /app/data/audit /app/data/templates \
  && chown -R node:node /app/data
USER node
EXPOSE 8787
CMD ["node", "dist/server.js"]

