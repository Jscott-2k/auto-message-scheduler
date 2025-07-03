# Use official lightweight Node.js image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install dependencies (production only)
RUN npm install --production

# Copy rest of the project files
COPY . .

# Default command: run scheduler.js with time argument passed by Fly cron
ENTRYPOINT ["node", "scheduler.js"]