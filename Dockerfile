FROM node:20-slim

WORKDIR /app

# Copy and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy app files
COPY . .

# Set env and entrypoint for scheduler
ENV NODE_ENV=production
ENV TZ=UTC

ENTRYPOINT ["node"]
CMD ["scheduler.js"]  # Fly cron will append the HH:MM argument