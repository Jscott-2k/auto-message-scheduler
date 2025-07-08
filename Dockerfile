# Use a slim Node.js base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of the project
COPY . .

CMD ["node", "scheduler.js"]