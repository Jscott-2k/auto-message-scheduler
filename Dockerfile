# Use a slim Node.js base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of the project
COPY . .

# Prevent crash on default start — this gets overridden by cron commands
CMD ["sleep", "infinity"]