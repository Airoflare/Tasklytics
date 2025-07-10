# Stage 1: Builder stage using the optimized Bun image (oven/bun:alpine)
FROM oven/bun:alpine AS builder

# Set the working directory for the build
WORKDIR /app

# Copy the project files from the build context into the container
COPY . .

# Install dependencies and build the project (output will be in the "out" directory)
RUN bun install && \
    bun run build

# Stage 2: Final NGINX image (nginxinc/nginx-unprivileged:alpine)
FROM nginxinc/nginx-unprivileged:alpine AS final

# Copy the NGINX config file from the deployment folder
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the output of the build from the builder stage into the NGINX html directory
COPY --from=builder /app/out /usr/share/nginx/html

# Expose port 80 to allow traffic
EXPOSE 80

# The default command to run the NGINX server
CMD ["nginx", "-g", "daemon off;"]