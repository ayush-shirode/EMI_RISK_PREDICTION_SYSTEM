# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy the shared package and the scheduler configuration
COPY packages/db ./packages/db
COPY services/scheduler ./services/scheduler

# Install and build DB package first
WORKDIR /app/packages/db
RUN npm install
RUN npm run build

# Install and build Scheduler service
WORKDIR /app/services/scheduler
RUN npm install
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built node_modules and output files
COPY --from=builder /app/packages/db /app/packages/db
COPY --from=builder /app/services/scheduler/package.json /app/services/scheduler/package.json
COPY --from=builder /app/services/scheduler/node_modules /app/services/scheduler/node_modules
COPY --from=builder /app/services/scheduler/dist /app/services/scheduler/dist

WORKDIR /app/services/scheduler

ENV NODE_ENV=production
ENV RUN_ON_START=false

CMD ["npm", "start"]
