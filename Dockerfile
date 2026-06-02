# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for layer caching)
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy all source files
COPY . .

# Expose the port
EXPOSE 3000

# Start the server
CMD ["node", "src/server.js"]
