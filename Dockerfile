# Stage 1: Base image
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
# We would run npm install here if we had dependencies

# Stage 2: Development environment
FROM base AS development
ENV NODE_ENV=development
# Install development dependencies if any
COPY . .
CMD ["npm", "start"]

# Stage 3: Production environment
FROM base AS production
ENV NODE_ENV=production
# We would use npm ci --only=production if we had dependencies
COPY . .
# Run as non-root user for security
USER node
EXPOSE 3000
CMD ["node", "index.js"]
