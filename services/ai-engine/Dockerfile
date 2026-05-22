# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps
COPY tsconfig.json ./
COPY src/ ./src
RUN npm run build

# Run stage
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --only=production --legacy-peer-deps
COPY --from=builder /app/dist ./dist
EXPOSE 3002
CMD ["node", "dist/index.js"]
