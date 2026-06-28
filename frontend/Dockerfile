# =============================================================================
# VetCloud Frontend — Production Dockerfile
# Multi-stage: Node.js build → nginx static serving
# =============================================================================

# Stage 1: Build React app
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (ci for reproducible builds)
COPY package*.json ./
RUN npm ci

# Pass API URL at build time (Vite bakes it into the bundle)
# Override with: docker build --build-arg VITE_API_URL=https://vetcloud.gr
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL

# Copy source and build
COPY . .
RUN npm run build

# =============================================================================
# Stage 2: Serve with nginx
# =============================================================================
FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our SPA-friendly nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
