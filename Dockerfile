FROM docker.m.daocloud.io/node:18-alpine

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy source code
COPY . .

# Ensure directories exist and have correct permissions
# public/img for uploads
RUN mkdir -p /app/public/img && chmod 777 /app/public/img

# Expose the application port
EXPOSE 9907

# Start the application
CMD ["node", "server.js"]
