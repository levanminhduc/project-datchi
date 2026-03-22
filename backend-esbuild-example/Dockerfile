# Stage 1: Build the application with esbuild
FROM node:20-alpine as builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
COPY tsconfig.json ./
COPY esbuild.config.js ./
RUN npm install

# Copy source code and build
COPY src ./src
RUN npm run build

# Stage 2: Create the final production image
FROM node:20-alpine

WORKDIR /app

# Create a non-root user and switch to it
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Copy only necessary files from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Change ownership of /app to appuser before installing dependencies
RUN chown -R appuser:appgroup /app

USER appuser

# Install only production dependencies (for external modules like @hono/node-server)
RUN npm install --only=production

# Set environment variables
ENV PORT=3000

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
