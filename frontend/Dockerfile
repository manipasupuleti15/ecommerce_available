# ==========================================
# Stage 1: Build React Production Bundle
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (layer caching — only re-runs npm install if
# package.json or package-lock.json changes, not on every source change)
COPY package*.json ./
RUN npm ci || npm install

# Copy all remaining source files and build the production bundle
COPY . .
RUN npm run build

# ==========================================
# Stage 2: Serve Bundle with Nginx Alpine
# ==========================================
FROM nginx:1.27-alpine

# Remove the default Nginx placeholder page
RUN rm -rf /usr/share/nginx/html/*

# Copy the compiled React static files from the builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy our custom Nginx config (handles SPA routing + /api/ reverse proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 inside the container
EXPOSE 80

# Start Nginx in the foreground (required for Docker)
CMD ["nginx", "-g", "daemon off;"]
