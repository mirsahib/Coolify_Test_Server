# Stage 1: Base image
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# Stage 2: Development environment
FROM base AS development
ENV NODE_ENV=development
RUN npm install
COPY . .
CMD ["npm", "start"]

# Stage 3: Production environment
FROM base AS production
ENV NODE_ENV=production
RUN npm install --omit=dev
COPY . .
# Run as non-root user for security
USER node
EXPOSE 3000
CMD ["node", "index.js"]
