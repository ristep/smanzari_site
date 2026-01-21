# ============================================
# Stage 1: Build the React app
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (for better layer caching)
COPY package.json yarn.lock .yarnrc.yml ./

# Install dependencies
RUN yarn install --immutable

# Copy source code
COPY . .

# Build the production bundle
RUN yarn build

# ============================================
# Stage 2: Serve with Nginx
# ============================================
FROM nginx:1.25-alpine

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
